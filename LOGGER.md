# Logger Utility

## Overview
The SDK includes a configurable logger utility that allows you to control logging output based on log levels and groups.

## Log Levels
- `SILENT` (0): No logging
- `ERROR` (1): Only errors
- `WARN` (2): Warnings and errors
- `INFO` (3): Info, warnings, and errors
- `DEBUG` (4): All logging

## Log Groups
- `SDK`: SDK initialization and core operations
- `API`: API calls and responses
- `AUTH`: Authentication and authorization
- `DEPLOY`: Deployment operations
- `VALIDATION`: Data validation
- `REGISTRY`: Registry operations

## Usage

### SDK Configuration
```typescript
import { InkwellBlogSDK, LogLevel } from '@inkwell.ar/sdk';

const sdk = new InkwellBlogSDK({
  processId: 'your-process-id',
  logLevel: LogLevel.INFO // Optional, defaults to WARN
});
```

### Registry SDK Configuration
```typescript
import { InkwellRegistrySDK, LogLevel } from '@inkwell.ar/sdk';

const registrySDK = new InkwellRegistrySDK({
  logLevel: LogLevel.DEBUG // logLevel
});
```

### Standalone Logger
```typescript
import { Logger, LogLevel, LogGroup } from '@inkwell.ar/sdk';

const logger = new Logger({ level: LogLevel.INFO });

logger.error(LogGroup.API, 'Connection failed', error);
logger.warn(LogGroup.AUTH, 'Invalid permissions');
logger.info(LogGroup.SDK, 'Operation completed');
logger.debug(LogGroup.VALIDATION, 'Data validated');
```

## Output Format
Logs are formatted as: `[GROUP] message`

Example: `[API] Getting blog info`
