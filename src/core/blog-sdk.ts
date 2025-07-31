import { connect } from '@permaweb/aoconnect';
import { deployContract } from 'ao-deploy';
import {
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
} from '../types';
import {
  validateCreatePostData,
  validateUpdatePostData,
  validatePostId,
  validateRoleManagementOptions,
  validateBlogDetailsData,
  validateSDKConfig,
  ValidationError
} from '../utils/validation';

export class InkwellBlogSDK implements BlogSDK {
  private processId: string;
  private aoconnect: any;

  constructor(config: BlogSDKConfig) {
    validateSDKConfig(config);
    this.processId = config.processId;
    this.aoconnect = config.aoconnect || connect();
  }

  /**
   * Deploy a new Inkwell Blog process
   */
  static async deploy(options: DeployOptions = {}): Promise<DeployResult> {
    try {
      const defaultOptions = {
        name: options.name || 'inkwell-blog',
        contractPath: options.contractPath || './lua-process/inkwell_blog.lua',
        luaPath: options.luaPath || './lua-process/?.lua',
        tags: [
          { name: 'App-Name', value: 'Inkwell-Blog' },
          { name: 'App-Version', value: '1.0.0' },
          ...(options.tags || [])
        ],
        retry: {
          count: options.retry?.count || 10,
          delay: options.retry?.delay || 3000
        },
        minify: options.minify !== false,
        onBoot: options.onBoot || false,
        silent: options.silent || false,
        forceSpawn: options.forceSpawn || false
      };

      const result = await deployContract({
        ...defaultOptions,
        wallet: options.wallet
      });

      return {
        processId: result.processId,
        messageId: result.messageId
      };
    } catch (error) {
      throw new Error(`Failed to deploy Inkwell Blog process: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all posts from the blog
   */
  async getAllPosts(options: GetPostsOptions = {}): Promise<ApiResponse<BlogPost[]>> {
    try {
      const tags = [
        { name: 'Action', value: 'Get-All-Posts' }
      ];

      if (options.ordered !== undefined) {
        tags.push({ name: 'Ordered', value: options.ordered.toString() });
      }

      const result = await this.aoconnect.dryRun({
        process: this.processId,
        tags
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a specific post by ID
   */
  async getPost(options: GetPostOptions): Promise<ApiResponse<BlogPost>> {
    try {
      validatePostId(options.id);

      const result = await this.aoconnect.dryRun({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Get-Post' },
          { name: 'Id', value: options.id.toString() }
        ]
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user roles for the current wallet
   */
  async getUserRoles(): Promise<ApiResponse<string[]>> {
    try {
      const result = await this.aoconnect.dryRun({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Get-User-Roles' }
        ]
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a new post (Editor role required)
   */
  async createPost(options: CreatePostOptions): Promise<ApiResponse<BlogPost>> {
    try {
      validateCreatePostData(options.data);

      const result = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Create-Post' }
        ],
        data: JSON.stringify(options.data)
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update an existing post (Editor role required)
   */
  async updatePost(options: UpdatePostOptions): Promise<ApiResponse<BlogPost>> {
    try {
      validatePostId(options.id);
      validateUpdatePostData(options.data);

      const result = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Update-Post' },
          { name: 'Id', value: options.id.toString() }
        ],
        data: JSON.stringify(options.data)
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a post (Editor role required)
   */
  async deletePost(options: DeletePostOptions): Promise<ApiResponse<BlogPost>> {
    try {
      validatePostId(options.id);

      const result = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Delete-Post' },
          { name: 'Id', value: options.id.toString() }
        ]
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Add editors to the blog (Admin role required)
   */
  async addEditors(options: RoleManagementOptions): Promise<ApiResponse<RoleUpdateResult[]>> {
    try {
      validateRoleManagementOptions(options);

      const result = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Add-Editors' }
        ],
        data: JSON.stringify({ accounts: options.accounts })
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Remove editors from the blog (Admin role required)
   */
  async removeEditors(options: RoleManagementOptions): Promise<ApiResponse<RoleUpdateResult[]>> {
    try {
      validateRoleManagementOptions(options);

      const result = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Remove-Editors' }
        ],
        data: JSON.stringify({ accounts: options.accounts })
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Add admins to the blog (Admin role required)
   */
  async addAdmins(options: RoleManagementOptions): Promise<ApiResponse<RoleUpdateResult[]>> {
    try {
      validateRoleManagementOptions(options);

      const result = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Add-Admins' }
        ],
        data: JSON.stringify({ accounts: options.accounts })
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Remove admins from the blog (Admin role required)
   */
  async removeAdmins(options: RoleManagementOptions): Promise<ApiResponse<RoleUpdateResult[]>> {
    try {
      validateRoleManagementOptions(options);

      const result = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Remove-Admins' }
        ],
        data: JSON.stringify({ accounts: options.accounts })
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all editors (Admin role required)
   */
  async getEditors(): Promise<ApiResponse<string[]>> {
    try {
      const result = await this.aoconnect.dryRun({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Get-Editors' }
        ]
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all admins (Admin role required)
   */
  async getAdmins(): Promise<ApiResponse<string[]>> {
    try {
      const result = await this.aoconnect.dryRun({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Get-Admins' }
        ]
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Set blog details (Admin role required)
   */
  async setBlogDetails(options: { data: UpdateBlogDetailsData }): Promise<ApiResponse<BlogDetails>> {
    try {
      validateBlogDetailsData(options.data);

      const result = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Set-Blog-Details' }
        ],
        data: JSON.stringify(options.data)
      });

      return this.parseResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse the response from the AO process
   */
  private parseResponse(result: any): ApiResponse<any> {
    try {
      if (result && result.Messages && result.Messages.length > 0) {
        const message = result.Messages[0];
        if (message.Data) {
          const parsed = JSON.parse(message.Data);
          return {
            success: parsed.success,
            data: parsed.data
          };
        }
      }
      
      return {
        success: false,
        data: 'Invalid response format from process'
      };
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Failed to parse response'
      };
    }
  }
} 