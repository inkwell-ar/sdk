// Core types for the Blog CRUD SDK

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
