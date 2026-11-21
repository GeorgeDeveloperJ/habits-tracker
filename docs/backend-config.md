# Backend Configuration & Infrastructure

## 📝 Logging (Winston)
We use **Winston** for structured backend logging to replace standard `console.log` and `console.error`. This ensures all events are timestamped, colorized, and standardized.

**Configuration File:** `src/config/logger.ts`

**How to use it in controllers:**
``` typescript
import logger from '../config/logger';

// 🟢 For successful operations or milestones
logger.info('Successfully fetched active cycle');

// 🔴 For caught exceptions (inside catch blocks)
logger.error(\`Failed to create daily log: \${error.message}\`);
```

*Note: Currently, the logger is configured strictly for console transport. Future iterations will include file transports (e.g., `error.log`) for persistent monitoring.*
## CORS & Proxy Configuration

By default, the backend allows `http://localhost:5173`, `https://habits.krakenserv.dev`, and the Vercel frontend origins configured in `backend/src/middlewares/cors.ts`. Set `CORS_ORIGINS` to a comma-separated list of `https://` origins in production to override the default allowlist without modifying code. Set `DB_ADAPTER=neon` when connecting to Neon serverless PostgreSQL.

## Verification and password recovery email

Set `SMTP_URL` to an authenticated SMTP URL using `smtps://` or `smtp://` with STARTTLS. Supply the credentials through the deployment secret store and percent-encode reserved URL characters. Set `PASSWORD_RESET_FROM` to the provider's verified sender and `PUBLIC_APP_URL` to the frontend origin. Production requires an HTTPS origin. Deploy the frontend with a fallback to `index.html` for direct visits to `/reset-password`.

Verification and recovery share the same SMTP configuration. Without these settings, signup, login that requires email verification, and password recovery respond with HTTP 503. Verified users can still sign in. The password reset link carries its token in the URL fragment, which keeps the token out of the frontend page request.

Apply the additive email-verification migration before releasing the API. Existing sessions stay valid, and existing accounts verify their email at the next sign-in. Release updated web and native clients with the API so they can handle the verification prompt. After the rollout, check `/api/ready` and use a staging mailbox to complete signup, sign-in verification for an existing account, and password recovery.

Authentication limits use PostgreSQL so all API replicas share the same counters. If a reverse proxy terminates incoming traffic, set `TRUSTED_PROXY_CIDRS` to the comma-separated addresses or CIDRs of your trusted proxies. Leave it unset for direct connections. Run `DELETE FROM "AuthRateBucket" WHERE "expiresAt" <= CURRENT_TIMESTAMP` periodically as a database maintenance task.

The authentication migration checks for email case collisions before lowercasing stored email addresses. Resolve collisions through account ownership review before applying the migration. If Prisma already recorded a failed attempt, confirm the transaction rolled back, then run `./node_modules/.bin/prisma migrate resolve --rolled-back 20261118165500_harden_auth_identity` from the release tools image before rerunning `migrate deploy`. The migration also retires outstanding reset links. Users with tokens issued before this release must sign in again.

### Release checks and recovery

Before running the authentication migration on an existing database, back up the database and check for duplicate rows grouped by `lower("email")`. Rehearse the upgrade on an isolated restore. Drain the old API instances or disable their password recovery route before migrating so they cannot issue more links during cutover. The cycle migration keeps the newest active cycle for each user and retains the other cycles as history.

After password recovery, check that the prior session stops working. For mail delivery errors, check the redacted SMTP error code in the API logs and verify connectivity from the API container. Use a corrected image for auth rollbacks so the old reset-token response remains retired.

The frontend production dependency audit is clean. The remaining Picomatch advisory applies to build and lint dependencies, which use repository-controlled patterns. The backend's remaining DeepmergeTS advisory comes through the Prisma CLI's configuration tooling. The production image excludes the CLI and DeepmergeTS. Treat release tooling as trusted and run it only with checked-in configuration.
