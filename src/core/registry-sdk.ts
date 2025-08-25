import { connect } from '@permaweb/aoconnect';
import { BLOG_REGISTRY_PROCESS_ID } from '../config/registry';
import { Role, LogLevel, RegistrySDKConfig } from '../types';
import { Logger, LogGroup } from '../utils/logger';

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

export class InkwellRegistrySDK {
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
      `Initialized BlogRegistrySDK with process ID: ${this.registryProcessId}`
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
    this.logger.debug(LogGroup.REGISTRY, `Getting blogs for wallet: ${wallet}`);

    const result = await this.aoconnect.dryrun({
      process: this.registryProcessId,
      data: '',
      tags: [
        { name: 'Action', value: 'Get-Wallet-Blogs' },
        { name: 'Wallet-Address', value: wallet },
      ],
    });

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
  }

  /**
   * Get all wallets with permissions for a specific blog
   */
  async getBlogWallets(blogId: string): Promise<WalletPermission[]> {
    const result = await this.aoconnect.dryrun({
      process: this.registryProcessId,
      data: '',
      tags: [
        { name: 'Action', value: 'Get-Blog-Wallets' },
        { name: 'Blog-ID', value: blogId },
      ],
    });

    const response = JSON.parse(result.Messages[0].Data);
    if (!response.success) {
      throw new Error(response.data);
    }

    return response.data;
  }

  /**
   * Check if a wallet has a specific role for a blog
   */
  async checkWalletRole(
    wallet: string,
    blogId: string,
    role: string
  ): Promise<boolean> {
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
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<RegistryStats> {
    const result = await this.aoconnect.dryrun({
      process: this.registryProcessId,
      data: '',
      tags: [{ name: 'Action', value: 'Get-Registry-Stats' }],
    });

    const response = JSON.parse(result.Messages[0].Data);
    if (!response.success) {
      throw new Error(response.data);
    }

    return response.data;
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
    const allBlogs = await this.getWalletBlogs(wallet);
    return allBlogs.filter((blog) => blog.roles.includes(Role.ADMIN));
  }

  /**
   * Get all blogs that a wallet can edit
   */
  async getEditableBlogs(wallet: string): Promise<BlogPermission[]> {
    const allBlogs = await this.getWalletBlogs(wallet);
    return allBlogs.filter(
      (blog) =>
        blog.roles.includes(Role.EDITOR) || blog.roles.includes(Role.ADMIN)
    );
  }

  /**
   * Check if a wallet can admin a specific blog
   */
  async canAdminBlog(wallet: string, blogId: string): Promise<boolean> {
    return this.checkWalletRole(wallet, blogId, Role.ADMIN);
  }

  /**
   * Check if a wallet can edit a specific blog
   */
  async canEditBlog(wallet: string, blogId: string): Promise<boolean> {
    const canEdit = await this.checkWalletRole(wallet, blogId, Role.EDITOR);
    const canAdmin = await this.checkWalletRole(wallet, blogId, Role.ADMIN);
    return canEdit || canAdmin;
  }
}
