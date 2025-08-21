import { connect, createDataItemSigner } from '@permaweb/aoconnect';
import { deployContract } from 'ao-deploy';
import { BLOG_REGISTRY_PROCESS_ID } from '../config/registry';
import {
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
} from '../types';
import {
  validateCreatePostData,
  validateUpdatePostData,
  validatePostId,
  validateRoleManagementOptions,
  validateBlogDetailsData,
  validateSDKConfig,
  ValidationError,
} from '../utils/validation';

export class InkwellBlogSDK implements BlogSDK {
  private processId: string;
  private aoconnect: any;

  constructor(config: BlogSDKConfig) {
    validateSDKConfig(config);
    this.processId = config.processId;
    this.aoconnect = config.aoconnect || connect({ MODE: 'legacy' });
  }

  /**
   * Get the appropriate signer for the wallet
   */
  private getSigner(wallet?: any) {
    if (wallet) {
      return createDataItemSigner(wallet);
    }

    // Check for browser wallet
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as any).arweaveWallet
    ) {
      return createDataItemSigner((globalThis as any).arweaveWallet);
    }

    throw new Error(
      'No wallet provided and no browser wallet available. Please provide a wallet or connect a browser wallet.'
    );
  }

  /**
   * Get the result of a message using its message ID
   */
  private async getMessageResult(messageId: string): Promise<any> {
    try {
      const resultData = await this.aoconnect.result({
        message: messageId,
        process: this.processId,
      });
      return resultData;
    } catch (error) {
      throw new Error(
        `Failed to get message result: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deploy a new Inkwell Blog process
   */
  static async deploy(options: DeployOptions = {}): Promise<DeployResult> {
    try {
      // Check if registry is configured
      // @ts-ignore
      if (BLOG_REGISTRY_PROCESS_ID === 'YOUR_REGISTRY_PROCESS_ID_HERE') {
        throw new Error('Registry process ID not configured. Please run the deployment script first: npm run deploy:registry');
      }

      const defaultOptions = {
        name: options.name || 'inkwell-blog',
        contractPath: options.contractPath || './lua-process/inkwell_blog.lua',
        luaPath: options.luaPath || './lua-process/?.lua',
        tags: [
          { name: 'App-Name', value: 'Inkwell-Blog' },
          { name: 'App-Version', value: '1.0.0' },
          { name: 'Registry-Process-ID', value: BLOG_REGISTRY_PROCESS_ID },
          ...(options.tags || []),
        ],
        retry: {
          count: options.retry?.count || 10,
          delay: options.retry?.delay || 3000,
        },
        minify: options.minify !== false,
        onBoot: options.onBoot || false,
        silent: options.silent || false,
        forceSpawn: options.forceSpawn || false,
      };

      const result = await deployContract({
        ...defaultOptions,
        wallet: options.wallet,
      });

      return {
        processId: result.processId,
        messageId: result.messageId,
      };
    } catch (error) {
      throw new Error(
        `Failed to deploy Inkwell Blog process: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get blog information
   */
  async getInfo(): Promise<ApiResponse<BlogInfo>> {
    try {
      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Info' }],
      });

      return this.parseInfoResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get all posts from the blog
   */
  async getAllPosts(
    options: GetPostsOptions = {}
  ): Promise<ApiResponse<BlogPost[]>> {
    try {
      const tags = [{ name: 'Action', value: 'Get-All-Posts' }];

      if (options.ordered !== undefined) {
        tags.push({ name: 'Ordered', value: options.ordered.toString() });
      }

      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags,
      });

      return this.parseDryrunResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get a specific post by ID
   */
  async getPost(options: GetPostOptions): Promise<ApiResponse<BlogPost>> {
    try {
      validatePostId(options.id);

      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Get-Post' },
          { name: 'Id', value: options.id.toString() },
        ],
      });

      return this.parseDryrunResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get user roles for the current wallet
   */
  async getUserRoles(walletAddress: string): Promise<ApiResponse<string[]>> {
    try {
      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Get-User-Roles' },
          { name: 'User-Address', value: walletAddress },
        ],
      });

      return this.parseMessageResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a new post (Editor role required)
   */
  async createPost(
    options: CreatePostOptions
  ): Promise<ApiResponse<BlogPost | string>> {
    try {
      validateCreatePostData(options.data);

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Create-Post' }],
        data: JSON.stringify(options.data),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        return {
          success: false,
          data: 'Create-Post message failed',
        };
      }

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        return this.parseMessageResponse(resultData);
      } catch (resultError) {
        // If we can't get the result, return a success message with the message ID
        return {
          success: true,
          data: `Post created successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update an existing post (Editor role required)
   */
  async updatePost(
    options: UpdatePostOptions
  ): Promise<ApiResponse<BlogPost | string>> {
    try {
      validatePostId(options.id);
      validateUpdatePostData(options.data);

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Update-Post' },
          { name: 'Id', value: options.id.toString() },
        ],
        data: JSON.stringify(options.data),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        return {
          success: false,
          data: 'Update-Post message failed',
        };
      }

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        return this.parseMessageResponse(resultData);
      } catch (resultError) {
        return {
          success: true,
          data: `Post updated successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete a post (Editor role required)
   */
  async deletePost(options: DeletePostOptions): Promise<ApiResponse<string>> {
    try {
      validatePostId(options.id);

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Delete-Post' },
          { name: 'Id', value: options.id.toString() },
        ],
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        return {
          success: false,
          data: 'Delete-Post message failed',
        };
      }

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        return this.parseMessageResponse(resultData);
      } catch (resultError) {
        return {
          success: true,
          data: `Post ${options.id} deleted successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Add editors to the blog (Admin role required)
   */
  async addEditors(
    options: RoleManagementOptions
  ): Promise<ApiResponse<RoleUpdateResult[] | string>> {
    try {
      validateRoleManagementOptions(options);

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Add-Editors' }],
        data: JSON.stringify({ accounts: options.accounts }),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        return {
          success: false,
          data: 'Add-Editors message failed',
        };
      }

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        return this.parseMessageResponse(resultData);
      } catch (resultError) {
        return {
          success: true,
          data: `Editors ${options.accounts.join(', ')} added successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Remove editors from the blog (Admin role required)
   */
  async removeEditors(
    options: RoleManagementOptions
  ): Promise<ApiResponse<RoleUpdateResult[] | string>> {
    try {
      validateRoleManagementOptions(options);

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Remove-Editors' }],
        data: JSON.stringify({ accounts: options.accounts }),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        return {
          success: false,
          data: 'Remove-Editors message failed',
        };
      }

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        return this.parseMessageResponse(resultData);
      } catch (resultError) {
        return {
          success: true,
          data: `Editors ${options.accounts.join(', ')} removed successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Add admins to the blog (Admin role required)
   */
  async addAdmins(
    options: RoleManagementOptions
  ): Promise<ApiResponse<RoleUpdateResult[] | string>> {
    try {
      validateRoleManagementOptions(options);

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Add-Admins' }],
        data: JSON.stringify({ accounts: options.accounts }),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        return {
          success: false,
          data: 'Add-Admins message failed',
        };
      }

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        return this.parseMessageResponse(resultData);
      } catch (resultError) {
        return {
          success: true,
          data: `Admins ${options.accounts.join(', ')} added successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Remove admins from the blog (Admin role required)
   */
  async removeAdmins(
    options: RoleManagementOptions
  ): Promise<ApiResponse<RoleUpdateResult[] | string>> {
    try {
      validateRoleManagementOptions(options);

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Remove-Admins' }],
        data: JSON.stringify({ accounts: options.accounts }),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        return {
          success: false,
          data: 'Remove-Admins message failed',
        };
      }

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        return this.parseMessageResponse(resultData);
      } catch (resultError) {
        return {
          success: true,
          data: `Admins ${options.accounts.join(', ')} removed successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get all editors (Admin role required)
   */
  async getEditors(): Promise<ApiResponse<string[]>> {
    try {
      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Get-Editors' }],
      });

      return this.parseMessageResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get all admins (Admin role required)
   */
  async getAdmins(): Promise<ApiResponse<string[]>> {
    try {
      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Get-Admins' }],
      });

      return this.parseMessageResponse(result);
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Set blog details (Admin role required)
   */
  async setBlogDetails(options: {
    data: UpdateBlogDetailsData;
    wallet?: any;
  }): Promise<ApiResponse<BlogDetails | string>> {
    try {
      validateBlogDetailsData(options.data);

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Set-Blog-Details' }],
        data: JSON.stringify(options.data),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        return {
          success: false,
          data: 'Set-Blog-Details message failed',
        };
      }

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        return this.parseDryrunResponse(resultData);
      } catch (resultError) {
        return {
          success: true,
          data: `Blog details updated successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Parse the response
   */
  private parseResponse(
    result: any,
    recursiveParse: boolean = false
  ): ApiResponse<any> {
    try {
      if (result && result.Messages && result.Messages.length > 0) {
        const message = result.Messages[0];
        if (message.Data) {
          const parsed = JSON.parse(message.Data);
          if (recursiveParse && typeof parsed.data === 'string') {
            parsed.data = JSON.parse(parsed.data);
          }
          return {
            success: parsed.success,
            data: parsed.data || parsed,
          };
        }
      }

      return {
        success: false,
        data: 'Invalid response format from process',
      };
    } catch (error) {
      return {
        success: false,
        data:
          error instanceof Error ? error.message : 'Failed to parse response',
      };
    }
  }

  /**
   * Parse the response from dryrun operations
   */
  private parseDryrunResponse(result: any): ApiResponse<any> {
    return this.parseResponse(result);
  }

  /**
   * Parse the response from message result operations
   */
  private parseMessageResponse(result: any): ApiResponse<any> {
    return this.parseResponse(result, true);
  }

  /**
   * Parse the Info response from the AO process
   */
  private parseInfoResponse(result: any): ApiResponse<BlogInfo> {
    try {
      if (result && result.Messages && result.Messages.length > 0) {
        const message = result.Messages[0];

        // Info handler returns data in message tags and Data field
        const info: BlogInfo = {
          name: message.Tags?.Name || '',
          author: message.Tags?.Author || '',
          blogTitle: message.Tags?.['Blog-Title'] || '',
          blogDescription: message.Tags?.['Blog-Description'] || '',
          blogLogo: message.Tags?.['Blog-Logo'] || '',
          details: {
            title: message.Tags?.['Blog-Title'] || '',
            description: message.Tags?.['Blog-Description'] || '',
            logo: message.Tags?.['Blog-Logo'] || '',
          },
        };

        // Also try to parse the Data field for additional details
        if (message.Data) {
          try {
            const parsedData = JSON.parse(message.Data);
            if (parsedData.success && parsedData.data) {
              info.details = {
                title: parsedData.data.title || info.details.title,
                description:
                  parsedData.data.description || info.details.description,
                logo: parsedData.data.logo || info.details.logo,
              };
            }
          } catch (parseError) {
            // If Data parsing fails, continue with tag-based info
          }
        }

        return {
          success: true,
          data: info,
        };
      }

      return {
        success: false,
        data: 'Invalid response format from process',
      };
    } catch (error) {
      return {
        success: false,
        data:
          error instanceof Error
            ? error.message
            : 'Failed to parse Info response',
      };
    }
  }
}
