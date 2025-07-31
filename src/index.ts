// Main entry point for the Inkwell Blog SDK

export { InkwellBlogSDK } from './core/blog-sdk';
export type {
  BlogSDK,
  BlogSDKConfig,
  ApiResponse,
  BlogPost,
  BlogDetails,
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
  DeployResult
} from './types';
export { ValidationError } from './utils/validation';

// Default export for convenience
export default InkwellBlogSDK; 