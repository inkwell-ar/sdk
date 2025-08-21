// Main entry point for the Inkwell Blog SDK

export { InkwellBlogSDK } from './core/blog-sdk';
export { BlogRegistrySDK } from './core/blog-registry-sdk';
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
  // Blog Registry types
  BlogPermission,
  WalletPermission,
  RegistryStats,
  SyncResult,
  SyncResponse,
} from './types';
export { ValidationError } from './utils/validation';

// Default export for convenience
// export default InkwellBlogSDK;
