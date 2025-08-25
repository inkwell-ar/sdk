// Core types for the Blog CRUD SDK
import { LogLevel } from '../utils/logger';

export interface BlogPost {
  id: number;
  title: string;
  description: string;
  body?: string;
  published_at: number;
  last_update: number;
  labels?: string[];
  authors: string[];
}

export interface BlogDetails {
  title: string;
  description: string;
  logo: string;
}

export interface BlogInfo {
  name: string;
  author: string;
  blogTitle: string;
  blogDescription: string;
  blogLogo: string;
  details: BlogDetails;
}

export interface UpdateBlogDetailsData {
  title?: string;
  description?: string;
  logo?: string;
}

export interface CreatePostData {
  title: string;
  description: string;
  body?: string;
  published_at: number;
  last_update: number;
  labels?: string[];
  authors: string[];
}

export interface UpdatePostData extends CreatePostData {}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | string;
}

export type RoleUpdateResult = [string, boolean, string?];

export interface GetPostsOptions {
  ordered?: boolean;
}

export interface GetPostOptions {
  id: number;
}

export interface CreatePostOptions {
  data: CreatePostData;
  wallet?: any; // Optional: will use browser wallet if available
}

export interface UpdatePostOptions {
  id: number;
  data: UpdatePostData;
  wallet?: any; // Optional: will use browser wallet if available
}

export interface DeletePostOptions {
  id: number;
  wallet?: any; // Optional: will use browser wallet if available
}

export interface RoleManagementOptions {
  accounts: string[];
  wallet?: any; // Optional: will use browser wallet if available
}

export interface BlogSDKConfig {
  processId: string;
  wallet?: any; // Arweave wallet instance
  aoconnect?: any; // aoconnect instance
  logLevel?: LogLevel; // Logger configuration
}

export interface RegistrySDKConfig {
  registryProcessId?: string; // Registry process ID
  aoconnect?: any; // aoconnect instance
  logLevel?: LogLevel; // Logger configuration
}

// Re-export logger types
export { LogLevel, LogGroup } from '../utils/logger';

// Parse response options
export interface ParseResponseOptions {
  result: any;
  isDryrun?: boolean;
  recursiveParse?: boolean;
  optionsWallet?: string;
}

export interface DeployConfig {
  name?: string;
  wallet?: string | any;
  contractPath?: string;
  tags?: Array<{ name: string; value: string }>;
  retry?: {
    count: number;
    delay: number;
  };
  luaPath?: string;
  minify?: boolean;
  contractTransformer?: (source: string) => string;
  onBoot?: boolean;
  silent?: boolean;
  blueprints?: string[];
  forceSpawn?: boolean;
}

export interface DeployResult {
  processId: string;
  messageId?: string;
}

export interface DeployOptions {
  name?: string;
  wallet?: string | any;
  contractPath?: string;
  tags?: Array<{ name: string; value: string }>;
  retry?: {
    count: number;
    delay: number;
  };
  luaPath?: string;
  minify?: boolean;
  contractTransformer?: (source: string) => string;
  onBoot?: boolean;
  silent?: boolean;
  blueprints?: string[];
  forceSpawn?: boolean;
}

export interface BlogSDK {
  // Public methods
  getInfo(): Promise<ApiResponse<BlogInfo>>;
  getAllPosts(options?: GetPostsOptions): Promise<ApiResponse<BlogPost[]>>;
  getPost(options: GetPostOptions): Promise<ApiResponse<BlogPost>>;
  getUserRoles(walletAddress: string): Promise<ApiResponse<string[]>>;

  // Editor methods
  createPost(
    options: CreatePostOptions
  ): Promise<ApiResponse<BlogPost | string>>;
  updatePost(
    options: UpdatePostOptions
  ): Promise<ApiResponse<BlogPost | string>>;
  deletePost(options: DeletePostOptions): Promise<ApiResponse<string>>;

  // Admin methods
  addEditors(
    options: RoleManagementOptions
  ): Promise<ApiResponse<RoleUpdateResult[] | string>>;
  removeEditors(
    options: RoleManagementOptions
  ): Promise<ApiResponse<RoleUpdateResult[] | string>>;
  addAdmins(
    options: RoleManagementOptions
  ): Promise<ApiResponse<RoleUpdateResult[] | string>>;
  removeAdmins(
    options: RoleManagementOptions
  ): Promise<ApiResponse<RoleUpdateResult[] | string>>;
  getEditors(): Promise<ApiResponse<string[]>>;
  getAdmins(): Promise<ApiResponse<string[]>>;
  setBlogDetails(options: {
    data: UpdateBlogDetailsData;
    wallet?: any; // Optional: will use browser wallet if available
  }): Promise<ApiResponse<BlogDetails | string>>;
}

export interface RegistrySDK {
  // Core registry methods
  getWalletBlogs(wallet: string): Promise<BlogPermission[]>;
  getBlogWallets(blogId: string): Promise<WalletPermission[]>;
  checkWalletRole(wallet: string, blogId: string, role: string): Promise<boolean>;
  getRegistryStats(): Promise<RegistryStats>;

  // Convenience methods
  getAdminBlogs(wallet: string): Promise<BlogPermission[]>;
  getEditableBlogs(wallet: string): Promise<BlogPermission[]>;
  canAdminBlog(wallet: string, blogId: string): Promise<boolean>;
  canEditBlog(wallet: string, blogId: string): Promise<boolean>;
}

// Valid roles
export const Role = {
  ADMIN: 'DEFAULT_ADMIN_ROLE',
  EDITOR: 'EDITOR_ROLE',
} as const;

// Role type
export type Role = (typeof Role)[keyof typeof Role];

// Blog Registry Types
export interface BlogPermission {
  blog_id: string;
  roles: Role[];
  last_updated: number;
}

export interface WalletPermission {
  wallet: string;
  roles: string[];
  last_updated: number;
}

export interface RegistryStats {
  version: string;
  wallet_count: number;
  blog_count: number;
  total_permissions: number;
}

export interface SyncResult {
  wallet: string;
  roles: string[];
  synced: boolean;
}

export interface SyncResponse {
  message: string;
  synced_wallets: number;
  results: SyncResult[];
}
