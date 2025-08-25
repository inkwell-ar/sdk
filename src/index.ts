// Main entry point for the Inkwell Blog SDK

export { InkwellBlogSDK } from './core/blog-sdk';
export { InkwellRegistrySDK } from './core/registry-sdk';
export { deployBlogInBrowser } from './core/browser-deploy';
export type {
  BlogSDK,
  BlogSDKConfig,
  ApiResponse,
  BlogPost,
  BlogDetails,
  BlogInfo,
  CreatePostData,
  UpdatePostData,
  UpdateBlogDetailsData,
  GetPostsOptions,
  GetPostOptions,
  CreatePostOptions,
  UpdatePostOptions,
  DeletePostOptions,
  RoleManagementOptions,
  RoleUpdateResult,
  DeployOptions,
  DeployResult,
  ParseResponseOptions,
  // Blog Registry types
  RegistrySDK,
  RegistrySDKConfig,
  BlogPermission,
  WalletPermission,
  RegistryStats,
  SyncResult,
  SyncResponse,
} from './types';
export { ValidationError } from './utils/validation';
export { Logger, LogLevel, LogGroup } from './utils/logger';

// Default export for convenience
// export default InkwellBlogSDK;
