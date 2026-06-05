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