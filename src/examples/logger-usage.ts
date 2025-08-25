import { InkwellBlogSDK, BlogRegistrySDK, LogLevel, LogGroup, Logger } from '../index';

// Example 1: Using logger with Blog SDK
const blogSdk = new InkwellBlogSDK({
  processId: 'your-process-id',
  logLevel: LogLevel.DEBUG, // Will log everything
});

// Example 2: Using logger with Registry SDK (silent)
const registrySdk = new BlogRegistrySDK(
  undefined, // aoconnect
  undefined, // registryProcessId
  LogLevel.SILENT // No logging
);

// Example 3: Using logger with Registry SDK (info level)
const registrySdkInfo = new BlogRegistrySDK(
  undefined, // aoconnect
  undefined, // registryProcessId
  LogLevel.INFO // Will log info, warn, and error
);

// Example 4: Standalone logger usage
const logger = new Logger({ level: LogLevel.WARN });

logger.debug(LogGroup.SDK, 'This will not be logged'); // Won't show
logger.info(LogGroup.API, 'This will not be logged'); // Won't show
logger.warn(LogGroup.AUTH, 'This will be logged'); // Will show
logger.error(LogGroup.DEPLOY, 'This will be logged'); // Will show

// Example 5: Dynamic log level changes
logger.setLevel(LogLevel.DEBUG);
logger.debug(LogGroup.VALIDATION, 'Now this will be logged'); // Will show

// Example usage with actual SDK methods
async function exampleUsage() {
  try {
    // This will log debug messages about the API calls
    const info = await blogSdk.getInfo();
    
    if (info.success) {
      console.log('Blog info:', info.data);
    }
  } catch (error) {
    // Logger will automatically log errors
    console.error('Failed to get blog info:', error);
  }
}

export { exampleUsage };
