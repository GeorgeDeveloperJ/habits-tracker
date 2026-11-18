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
## Password recovery email

Set `SMTP_URL` to an authenticated SMTP URL using `smtps://` or `smtp://` with STARTTLS. Supply the credentials through the deployment secret store and percent-encode reserved URL characters. Set `PASSWORD_RESET_FROM` to the provider's verified sender and `PUBLIC_APP_URL` to the frontend origin. Production requires an HTTPS origin. Deploy the frontend with a fallback to `index.html` for direct visits to `/reset-password`.

Omit all three values to disable password recovery. The API responds with HTTP 503 while recovery is disabled. For enabled recovery, the reset link goes to the account mailbox. The URL holds the token in its fragment so the frontend host does not receive it in the page request. Verify delivery using a staging mailbox before enabling recovery for users.

Authentication limits use PostgreSQL so all API replicas share the same counters. If a reverse proxy terminates incoming traffic, set `TRUSTED_PROXY_CIDRS` to the comma-separated addresses or CIDRs of your trusted proxies. Leave it unset for direct connections. Run `DELETE FROM "AuthRateBucket" WHERE "expiresAt" <= CURRENT_TIMESTAMP` periodically as a database maintenance task.

The authentication migration checks for email case collisions before lowercasing stored email addresses. Resolve collisions through account ownership review before retrying a failed migration. The migration also retires outstanding reset links. Users with tokens issued before this release must sign in again.

### Release checks and recovery

Before running the authentication migration on an existing database, back up the database and check for duplicate rows grouped by `lower("email")`. Rehearse the upgrade on an isolated restore. The cycle migration keeps the newest active cycle for each user and retains the other cycles as history.

After migration, confirm `/api/ready` succeeds and complete password recovery through the configured mail provider using a staging account. Check that the prior session stops working. If delivery fails, remove the three email settings and restart the hardened API to disable recovery while investigating. Use a corrected image for auth rollbacks so the old reset-token response remains retired.

The frontend production dependency audit is clean. The remaining Picomatch advisory applies to build and lint dependencies, which use repository-controlled patterns. The backend's remaining DeepmergeTS advisory comes through the Prisma CLI's configuration tooling. The production image excludes the CLI and DeepmergeTS. Treat release tooling as trusted and run it only with checked-in configuration.
