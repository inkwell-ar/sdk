import { connect, createDataItemSigner } from '@permaweb/aoconnect';
import { Logger, LogLevel, LogGroup } from '../utils/logger';
import { BLOG_REGISTRY_PROCESS_ID } from '../config/registry';
import { deployBlogInBrowser } from './browser-deploy';
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
  private logger: Logger;

  constructor(config: BlogSDKConfig) {
    validateSDKConfig(config);
    this.processId = config.processId;
    this.aoconnect = config.aoconnect || connect({ MODE: 'legacy' });
    this.logger = new Logger({ level: config.logLevel || LogLevel.WARN });
    
    this.logger.info(LogGroup.SDK, `Initialized InkwellBlogSDK with process ID: ${this.processId}`);
  }

  /**
   * Get the appropriate signer for the wallet
   */
  private getSigner(wallet?: any) {
    if (wallet) {
      this.logger.debug(LogGroup.AUTH, 'Using provided wallet for signing');
      return createDataItemSigner(wallet);
    }

    // Check for browser wallet
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as any).arweaveWallet
    ) {
      this.logger.debug(LogGroup.AUTH, 'Using browser wallet for signing');
      return createDataItemSigner((globalThis as any).arweaveWallet);
    }

    this.logger.error(LogGroup.AUTH, 'No wallet available for signing - neither provided nor browser wallet found');
    throw new Error(
      'No wallet provided and no browser wallet available. Please provide a wallet or connect a browser wallet.'
    );
  }

  /**
   * Get the result of a message using its message ID
   */
  private async getMessageResult(messageId: string): Promise<any> {
    try {
      this.logger.debug(LogGroup.API, `Getting message result for ID: ${messageId}`);
      const resultData = await this.aoconnect.result({
        message: messageId,
        process: this.processId,
      });
      this.logger.debug(LogGroup.API, `Successfully retrieved message result`);
      return resultData;
    } catch (error) {
      this.logger.error(LogGroup.API, `Failed to get message result for ${messageId}`, error);
      throw new Error(
        `Failed to get message result: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deploy a new Inkwell Blog process
   * Works in both browser and Node.js environments using aoconnect
   */
  static async deploy(options: DeployOptions = {}): Promise<DeployResult> {
    const logger = new Logger({ level: LogLevel.INFO });
    try {
      logger.info(LogGroup.DEPLOY, `Starting blog deployment with name: ${options.name || 'unnamed'}`);
      // Use browser deployment for all environments
      const result = await deployBlogInBrowser({
        name: options.name,
        wallet: options.wallet,
      });
      logger.info(LogGroup.DEPLOY, `Blog deployed successfully with process ID: ${result.processId}`);
      return result;
    } catch (error) {
      logger.error(LogGroup.DEPLOY, `Failed to deploy blog process`, error);
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
      this.logger.debug(LogGroup.API, 'Getting blog info');
      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Info' }],
      });

      const response = await this.parseInfoResponse(result);
      this.logger.debug(LogGroup.API, 'Blog info retrieved successfully');
      return response;
    } catch (error) {
      this.logger.error(LogGroup.API, 'Failed to get blog info', error);
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
      this.logger.debug(LogGroup.API, `Getting all posts with options: ${JSON.stringify(options)}`);
      const tags = [{ name: 'Action', value: 'Get-All-Posts' }];

      if (options.ordered !== undefined) {
        tags.push({ name: 'Ordered', value: options.ordered.toString() });
      }

      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags,
      });

      const response = await this.parseDryrunResponse(result);
      if (response.success && Array.isArray(response.data)) {
        this.logger.info(LogGroup.API, `Retrieved ${response.data.length} posts`);
      }
      return response;
    } catch (error) {
      this.logger.error(LogGroup.API, 'Failed to get all posts', error);
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
      this.logger.debug(LogGroup.API, `Getting post with ID: ${options.id}`);
      validatePostId(options.id);
      this.logger.debug(LogGroup.VALIDATION, 'Post ID validation passed');

      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Get-Post' },
          { name: 'Id', value: options.id.toString() },
        ],
      });

      const response = await this.parseDryrunResponse(result);
      if (response.success) {
        this.logger.debug(LogGroup.API, `Successfully retrieved post ${options.id}`);
      }
      return response;
    } catch (error) {
      this.logger.error(LogGroup.API, `Failed to get post ${options.id}`, error);
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
      this.logger.debug(LogGroup.AUTH, `Getting roles for wallet: ${walletAddress}`);
      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Get-User-Roles' },
          { name: 'User-Address', value: walletAddress },
        ],
      });

      const response = await this.parseMessageResponse(result);
      if (response.success && Array.isArray(response.data)) {
        this.logger.info(LogGroup.AUTH, `User has ${response.data.length} roles: ${response.data.join(', ')}`);
      }
      return response;
    } catch (error) {
      this.logger.error(LogGroup.AUTH, `Failed to get user roles for ${walletAddress}`, error);
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
      this.logger.info(LogGroup.API, `Creating post: ${options.data.title}`);
      validateCreatePostData(options.data);
      this.logger.debug(LogGroup.VALIDATION, 'Post data validation passed');

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Create-Post' }],
        data: JSON.stringify(options.data),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        this.logger.error(LogGroup.API, 'Create-Post message failed - no message ID returned');
        return {
          success: false,
          data: 'Create-Post message failed',
        };
      }

      this.logger.debug(LogGroup.API, `Post creation message sent with ID: ${messageId}`);

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        const response = await this.parseMessageResponse(resultData, options.wallet);
        this.logger.info(LogGroup.API, 'Post created successfully');
        return response;
      } catch (resultError) {
        this.logger.warn(LogGroup.API, `Could not retrieve post creation result, but message was sent: ${messageId}`);
        // If we can't get the result, return a success message with the message ID
        return {
          success: true,
          data: `Post created successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      this.logger.error(LogGroup.API, 'Failed to create post', error);
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
      this.logger.info(LogGroup.API, `Updating post ${options.id}: ${options.data.title}`);
      validatePostId(options.id);
      validateUpdatePostData(options.data);
      this.logger.debug(LogGroup.VALIDATION, 'Post update data validation passed');

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
        this.logger.error(LogGroup.API, 'Update-Post message failed - no message ID returned');
        return {
          success: false,
          data: 'Update-Post message failed',
        };
      }

      this.logger.debug(LogGroup.API, `Post update message sent with ID: ${messageId}`);

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        const response = await this.parseMessageResponse(resultData, options.wallet);
        this.logger.info(LogGroup.API, `Post ${options.id} updated successfully`);
        return response;
      } catch (resultError) {
        this.logger.warn(LogGroup.API, `Could not retrieve post update result, but message was sent: ${messageId}`);
        return {
          success: true,
          data: `Post updated successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      this.logger.error(LogGroup.API, `Failed to update post ${options.id}`, error);
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
      this.logger.info(LogGroup.API, `Deleting post ${options.id}`);
      validatePostId(options.id);
      this.logger.debug(LogGroup.VALIDATION, 'Post ID validation passed for deletion');

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [
          { name: 'Action', value: 'Delete-Post' },
          { name: 'Id', value: options.id.toString() },
        ],
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        this.logger.error(LogGroup.API, 'Delete-Post message failed - no message ID returned');
        return {
          success: false,
          data: 'Delete-Post message failed',
        };
      }

      this.logger.debug(LogGroup.API, `Post deletion message sent with ID: ${messageId}`);

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        const response = await this.parseMessageResponse(resultData, options.wallet);
        this.logger.info(LogGroup.API, `Post ${options.id} deleted successfully`);
        return response;
      } catch (resultError) {
        this.logger.warn(LogGroup.API, `Could not retrieve post deletion result, but message was sent: ${messageId}`);
        return {
          success: true,
          data: `Post ${options.id} deleted successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      this.logger.error(LogGroup.API, `Failed to delete post ${options.id}`, error);
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
      this.logger.info(LogGroup.AUTH, `Adding editors: ${options.accounts.join(', ')}`);
      validateRoleManagementOptions(options);
      this.logger.debug(LogGroup.VALIDATION, 'Role management options validation passed');

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Add-Editors' }],
        data: JSON.stringify({ accounts: options.accounts }),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        this.logger.error(LogGroup.AUTH, 'Add-Editors message failed - no message ID returned');
        return {
          success: false,
          data: 'Add-Editors message failed',
        };
      }

      this.logger.debug(LogGroup.AUTH, `Add editors message sent with ID: ${messageId}`);

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        const response = await this.parseMessageResponse(resultData, options.wallet);
        this.logger.info(LogGroup.AUTH, `Successfully added ${options.accounts.length} editors`);
        return response;
      } catch (resultError) {
        this.logger.warn(LogGroup.AUTH, `Could not retrieve add editors result, but message was sent: ${messageId}`);
        return {
          success: true,
          data: `Editors ${options.accounts.join(', ')} added successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      this.logger.error(LogGroup.AUTH, `Failed to add editors: ${options.accounts.join(', ')}`, error);
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
      this.logger.info(LogGroup.AUTH, `Removing editors: ${options.accounts.join(', ')}`);
      validateRoleManagementOptions(options);
      this.logger.debug(LogGroup.VALIDATION, 'Role management options validation passed');

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Remove-Editors' }],
        data: JSON.stringify({ accounts: options.accounts }),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        this.logger.error(LogGroup.AUTH, 'Remove-Editors message failed - no message ID returned');
        return {
          success: false,
          data: 'Remove-Editors message failed',
        };
      }

      this.logger.debug(LogGroup.AUTH, `Remove editors message sent with ID: ${messageId}`);

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        const response = await this.parseMessageResponse(resultData, options.wallet);
        this.logger.info(LogGroup.AUTH, `Successfully removed ${options.accounts.length} editors`);
        return response;
      } catch (resultError) {
        this.logger.warn(LogGroup.AUTH, `Could not retrieve remove editors result, but message was sent: ${messageId}`);
        return {
          success: true,
          data: `Editors ${options.accounts.join(', ')} removed successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      this.logger.error(LogGroup.AUTH, `Failed to remove editors: ${options.accounts.join(', ')}`, error);
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
      this.logger.info(LogGroup.AUTH, `Adding admins: ${options.accounts.join(', ')}`);
      validateRoleManagementOptions(options);
      this.logger.debug(LogGroup.VALIDATION, 'Role management options validation passed');

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Add-Admins' }],
        data: JSON.stringify({ accounts: options.accounts }),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        this.logger.error(LogGroup.AUTH, 'Add-Admins message failed - no message ID returned');
        return {
          success: false,
          data: 'Add-Admins message failed',
        };
      }

      this.logger.debug(LogGroup.AUTH, `Add admins message sent with ID: ${messageId}`);

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        const response = await this.parseMessageResponse(resultData, options.wallet);
        this.logger.info(LogGroup.AUTH, `Successfully added ${options.accounts.length} admins`);
        return response;
      } catch (resultError) {
        this.logger.warn(LogGroup.AUTH, `Could not retrieve add admins result, but message was sent: ${messageId}`);
        return {
          success: true,
          data: `Admins ${options.accounts.join(', ')} added successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      this.logger.error(LogGroup.AUTH, `Failed to add admins: ${options.accounts.join(', ')}`, error);
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
      this.logger.info(LogGroup.AUTH, `Removing admins: ${options.accounts.join(', ')}`);
      validateRoleManagementOptions(options);
      this.logger.debug(LogGroup.VALIDATION, 'Role management options validation passed');

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Remove-Admins' }],
        data: JSON.stringify({ accounts: options.accounts }),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        this.logger.error(LogGroup.AUTH, 'Remove-Admins message failed - no message ID returned');
        return {
          success: false,
          data: 'Remove-Admins message failed',
        };
      }

      this.logger.debug(LogGroup.AUTH, `Remove admins message sent with ID: ${messageId}`);

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        const response = await this.parseMessageResponse(resultData, options.wallet);
        this.logger.info(LogGroup.AUTH, `Successfully removed ${options.accounts.length} admins`);
        return response;
      } catch (resultError) {
        this.logger.warn(LogGroup.AUTH, `Could not retrieve remove admins result, but message was sent: ${messageId}`);
        return {
          success: true,
          data: `Admins ${options.accounts.join(', ')} removed successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      this.logger.error(LogGroup.AUTH, `Failed to remove admins: ${options.accounts.join(', ')}`, error);
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
      this.logger.debug(LogGroup.AUTH, 'Getting all editors');
      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Get-Editors' }],
      });

      const response = await this.parseMessageResponse(result);
      if (response.success && Array.isArray(response.data)) {
        this.logger.info(LogGroup.AUTH, `Retrieved ${response.data.length} editors`);
      }
      return response;
    } catch (error) {
      this.logger.error(LogGroup.AUTH, 'Failed to get editors', error);
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
      this.logger.debug(LogGroup.AUTH, 'Getting all admins');
      const result = await this.aoconnect.dryrun({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Get-Admins' }],
      });

      const response = await this.parseMessageResponse(result);
      if (response.success && Array.isArray(response.data)) {
        this.logger.info(LogGroup.AUTH, `Retrieved ${response.data.length} admins`);
      }
      return response;
    } catch (error) {
      this.logger.error(LogGroup.AUTH, 'Failed to get admins', error);
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
      this.logger.info(LogGroup.API, `Updating blog details: ${JSON.stringify(options.data)}`);
      validateBlogDetailsData(options.data);
      this.logger.debug(LogGroup.VALIDATION, 'Blog details validation passed');

      const messageId = await this.aoconnect.message({
        process: this.processId,
        tags: [{ name: 'Action', value: 'Set-Blog-Details' }],
        data: JSON.stringify(options.data),
        signer: this.getSigner(options.wallet),
      });

      if (!messageId) {
        this.logger.error(LogGroup.API, 'Set-Blog-Details message failed - no message ID returned');
        return {
          success: false,
          data: 'Set-Blog-Details message failed',
        };
      }

      this.logger.debug(LogGroup.API, `Blog details update message sent with ID: ${messageId}`);

      // Try to get the result of the message
      try {
        const resultData = await this.getMessageResult(messageId);
        const response = await this.parseDryrunResponse(resultData, options.wallet);
        this.logger.info(LogGroup.API, 'Blog details updated successfully');
        return response;
      } catch (resultError) {
        this.logger.warn(LogGroup.API, `Could not retrieve blog details update result, but message was sent: ${messageId}`);
        return {
          success: true,
          data: `Blog details updated successfully. Message ID: ${messageId}`,
        };
      }
    } catch (error) {
      this.logger.error(LogGroup.API, 'Failed to update blog details', error);
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Parse the response
   */
  private async parseResponse(
    result: any,
    recursiveParse: boolean = false,
    optionsWallet?: string
  ): Promise<ApiResponse<any>> {
    try {
      this.logger.debug(LogGroup.API, `Parsing response with ${result?.Messages?.length || 0} messages`);
      
      if (result && result.Messages && result.Messages.length > 0) {
        const wallet =
          optionsWallet ||
          (await (globalThis as any).arweaveWallet.getActiveAddress());
        let message;
        if (!wallet) {
          message = result.Messages[0];
          this.logger.debug(LogGroup.API, 'Using first message (no wallet specified)');
        } else {
          message = result.Messages.find((m: any) => m.Tags.Target === wallet);
          this.logger.debug(LogGroup.API, `Found message for wallet: ${wallet}`);
        }
        
        if (message?.Data) {
          this.logger.debug(LogGroup.API, 'Parsing message data as JSON: ', message.Data);
          const parsed = JSON.parse(message.Data);
          
          if (recursiveParse && typeof parsed.data === 'string') {
            this.logger.debug(LogGroup.API, 'Performing recursive JSON parse on data field: ', parsed.data);
            parsed.data = JSON.parse(parsed.data);
          }
          
          this.logger.debug(LogGroup.API, `Response parsed successfully: ${parsed.success ? 'success' : 'failure'}`);
          return {
            success: parsed.success,
            data: parsed.data || parsed,
          };
        }
      }

      this.logger.warn(LogGroup.API, 'Invalid response format from process - no valid messages found');
      return {
        success: false,
        data: 'Invalid response format from process',
      };
    } catch (error) {
      this.logger.error(LogGroup.API, 'Failed to parse response JSON', error);
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
  private async parseDryrunResponse(
    result: any,
    optionsWallet?: string
  ): Promise<ApiResponse<any>> {
    return await this.parseResponse(result, false, optionsWallet);
  }

  /**
   * Parse the response from message result operations
   */
  private async parseMessageResponse(
    result: any,
    optionsWallet?: string
  ): Promise<ApiResponse<any>> {
    return await this.parseResponse(result, true, optionsWallet);
  }

  /**
   * Parse the Info response from the AO process
   */
  private async parseInfoResponse(
    result: any,
    optionsWallet?: string
  ): Promise<ApiResponse<BlogInfo>> {
    try {
      this.logger.debug(LogGroup.API, 'Parsing blog info response');
      
      if (result && result.Messages && result.Messages.length > 0) {
        const message = result.Messages[0];
        this.logger.debug(LogGroup.API, 'Extracting blog info from message tags');

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
            this.logger.debug(LogGroup.API, 'Parsing additional blog info from Data field');
            const parsedData = JSON.parse(message.Data);
            if (parsedData.success && parsedData.data) {
              this.logger.debug(LogGroup.API, 'Merging parsed data with tag-based info');
              info.details = {
                title: parsedData.data.title || info.details.title,
                description:
                  parsedData.data.description || info.details.description,
                logo: parsedData.data.logo || info.details.logo,
              };
            }
          } catch (parseError) {
            this.logger.warn(LogGroup.API, 'Failed to parse Data field, using tag-based info only', parseError);
          }
        }

        this.logger.debug(LogGroup.API, `Blog info parsed successfully: ${info.name}`);
        return {
          success: true,
          data: info,
        };
      }

      this.logger.warn(LogGroup.API, 'Invalid blog info response format - no messages found');
      return {
        success: false,
        data: 'Invalid response format from process',
      };
    } catch (error) {
      this.logger.error(LogGroup.API, 'Failed to parse blog info response', error);
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
