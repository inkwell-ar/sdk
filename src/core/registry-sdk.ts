import { connect } from '@permaweb/aoconnect';
import { BLOG_REGISTRY_PROCESS_ID } from '../config/registry';
import {
  Role,
  LogLevel,
  RegistrySDKConfig,
  RegistrySDK,
  BlogPermission,
  WalletPermission,
  RegistryStats,
} from '../types';
import { Logger, LogGroup } from '../utils/logger';

export class InkwellRegistrySDK implements RegistrySDK {
  private aoconnect: any;
  private registryProcessId: string;
  private logger: Logger;

  constructor(config?: RegistrySDKConfig) {
    this.aoconnect = config?.aoconnect || connect({ MODE: 'legacy' });
    this.registryProcessId =
      config?.registryProcessId || BLOG_REGISTRY_PROCESS_ID;
    this.logger = new Logger({ level: config?.logLevel || LogLevel.WARN });

    if (this.registryProcessId === 'YOUR_REGISTRY_PROCESS_ID_HERE') {
      this.logger.error(
        LogGroup.REGISTRY,
        'Registry process ID not configured'
      );
      throw new Error(
        'Registry process ID not configured. Please run the deployment script first: npm run deploy:registry'
      );
    }

    this.logger.info(
      LogGroup.REGISTRY,
      `Initialized InkwellRegistrySDK with process ID: ${this.registryProcessId}`
    );
  }

  /**
   * Note: Write operations (register, remove, update) are only available to blog processes
   * for security reasons. The registry uses msg.From as the blog ID to ensure only
   * the actual blog process can modify its own permissions.
   */

  /**
   * Get all blogs a wallet has permissions for
   */
  async getWalletBlogs(wallet: string): Promise<BlogPermission[]> {
    try {
      this.logger.debug(LogGroup.REGISTRY, `Getting blogs for wallet: ${wallet}`);

      const result = await this.aoconnect.dryrun({
        process: this.registryProcessId,
        data: '',
        tags: [
          { name: 'Action', value: 'Get-Wallet-Blogs' },
          { name: 'Wallet-Address', value: wallet },
        ],
      });

      this.logger.debug(LogGroup.REGISTRY, 'Parsing wallet blogs response', result.Messages[0].Data);
      const response = JSON.parse(result.Messages[0].Data);
      if (!response.success) {
        this.logger.error(
          LogGroup.REGISTRY,
          `Failed to get wallet blogs: ${response.data}`
        );
        throw new Error(response.data);
      }

      this.logger.debug(
        LogGroup.REGISTRY,
        `Found ${response.data.length} blogs for wallet`
      );
      return response.data;
    } catch (error) {
      this.logger.error(LogGroup.REGISTRY, `Error getting wallet blogs for ${wallet}`, error);
      throw error;
    }
  }

  /**
   * Get all wallets with permissions for a specific blog
   */
  async getBlogWallets(blogId: string): Promise<WalletPermission[]> {
    try {
      this.logger.debug(LogGroup.REGISTRY, `Getting wallets for blog: ${blogId}`);
      
      const result = await this.aoconnect.dryrun({
        process: this.registryProcessId,
        data: '',
        tags: [
          { name: 'Action', value: 'Get-Blog-Wallets' },
          { name: 'Blog-ID', value: blogId },
        ],
      });

      this.logger.debug(LogGroup.REGISTRY, 'Parsing blog wallets response', result.Messages[0].Data);
      const response = JSON.parse(result.Messages[0].Data);
      if (!response.success) {
        this.logger.error(LogGroup.REGISTRY, `Failed to get blog wallets: ${response.data}`);
        throw new Error(response.data);
      }

      this.logger.debug(LogGroup.REGISTRY, `Found ${response.data.length} wallets for blog`);
      return response.data;
    } catch (error) {
      this.logger.error(LogGroup.REGISTRY, `Error getting blog wallets for ${blogId}`, error);
      throw error;
    }
  }

  /**
   * Check if a wallet has a specific role for a blog
   */
  async checkWalletRole(
    wallet: string,
    blogId: string,
    role: string
  ): Promise<boolean> {
    try {
      this.logger.debug(
        LogGroup.AUTH,
        `Checking if wallet ${wallet} has role ${role} for blog ${blogId}`
      );

      const result = await this.aoconnect.dryrun({
        process: this.registryProcessId,
        data: '',
        tags: [
          { name: 'Action', value: 'Check-Wallet-Role' },
          { name: 'Wallet-Address', value: wallet },
          { name: 'Blog-ID', value: blogId },
          { name: 'Role', value: role },
        ],
      });

      this.logger.debug(LogGroup.AUTH, 'Parsing role check response', result.Messages[0].Data);
      const response = JSON.parse(result.Messages[0].Data);
      if (!response.success) {
        this.logger.error(
          LogGroup.AUTH,
          `Role check failed: ${response.data.error}`
        );
        throw new Error(response.data.error);
      }

      this.logger.debug(
        LogGroup.AUTH,
        `Role check result: ${response.data.has_role}`
      );
      return response.data.has_role;
    } catch (error) {
      this.logger.error(LogGroup.AUTH, `Error checking wallet role for ${wallet}`, error);
      throw error;
    }
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<RegistryStats> {
    try {
      this.logger.debug(LogGroup.REGISTRY, 'Getting registry statistics');
      
      const result = await this.aoconnect.dryrun({
        process: this.registryProcessId,
        data: '',
        tags: [{ name: 'Action', value: 'Get-Registry-Stats' }],
      });

      this.logger.debug(LogGroup.REGISTRY, 'Parsing registry stats response', result.Messages[0].Data);
      const response = JSON.parse(result.Messages[0].Data);
      if (!response.success) {
        this.logger.error(LogGroup.REGISTRY, `Failed to get registry stats: ${response.data}`);
        throw new Error(response.data);
      }

      this.logger.info(LogGroup.REGISTRY, `Registry stats: ${response.data.blog_count} blogs, ${response.data.wallet_count} wallets`);
      return response.data;
    } catch (error) {
      this.logger.error(LogGroup.REGISTRY, 'Error getting registry statistics', error);
      throw error;
    }
  }

  /**
   * Note: Bulk operations and sync operations are only available to blog processes
   * for security reasons. The registry uses msg.From as the blog ID to ensure only
   * the actual blog process can modify its own permissions.
   */

  /**
   * Get all blogs that a wallet can admin
   */
  async getAdminBlogs(wallet: string): Promise<BlogPermission[]> {
    try {
      this.logger.debug(LogGroup.AUTH, `Getting admin blogs for wallet: ${wallet}`);
      const allBlogs = await this.getWalletBlogs(wallet);
      const adminBlogs = allBlogs.filter((blog) => blog.roles.includes(Role.ADMIN));
      this.logger.info(LogGroup.AUTH, `Found ${adminBlogs.length} admin blogs for wallet`);
      return adminBlogs;
    } catch (error) {
      this.logger.error(LogGroup.AUTH, `Error getting admin blogs for ${wallet}`, error);
      throw error;
    }
  }

  /**
   * Get all blogs that a wallet can edit
   */
  async getEditableBlogs(wallet: string): Promise<BlogPermission[]> {
    try {
      this.logger.debug(LogGroup.AUTH, `Getting editable blogs for wallet: ${wallet}`);
      const allBlogs = await this.getWalletBlogs(wallet);
      const editableBlogs = allBlogs.filter(
        (blog) =>
          blog.roles.includes(Role.EDITOR) || blog.roles.includes(Role.ADMIN)
      );
      this.logger.info(LogGroup.AUTH, `Found ${editableBlogs.length} editable blogs for wallet`);
      return editableBlogs;
    } catch (error) {
      this.logger.error(LogGroup.AUTH, `Error getting editable blogs for ${wallet}`, error);
      throw error;
    }
  }

  /**
   * Check if a wallet can admin a specific blog
   */
  async canAdminBlog(wallet: string, blogId: string): Promise<boolean> {
    try {
      this.logger.debug(LogGroup.AUTH, `Checking admin permission for wallet ${wallet} on blog ${blogId}`);
      const canAdmin = await this.checkWalletRole(wallet, blogId, Role.ADMIN);
      this.logger.debug(LogGroup.AUTH, `Admin check result: ${canAdmin}`);
      return canAdmin;
    } catch (error) {
      this.logger.error(LogGroup.AUTH, `Error checking admin permission for ${wallet}`, error);
      throw error;
    }
  }

  /**
   * Check if a wallet can edit a specific blog
   */
  async canEditBlog(wallet: string, blogId: string): Promise<boolean> {
    try {
      this.logger.debug(LogGroup.AUTH, `Checking edit permission for wallet ${wallet} on blog ${blogId}`);
      const canEdit = await this.checkWalletRole(wallet, blogId, Role.EDITOR);
      const canAdmin = await this.checkWalletRole(wallet, blogId, Role.ADMIN);
      const result = canEdit || canAdmin;
      this.logger.debug(LogGroup.AUTH, `Edit check result: ${result} (editor: ${canEdit}, admin: ${canAdmin})`);
      return result;
    } catch (error) {
      this.logger.error(LogGroup.AUTH, `Error checking edit permission for ${wallet}`, error);
      throw error;
    }
  }
}
