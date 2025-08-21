import { connect } from '@permaweb/aoconnect';
import { BLOG_REGISTRY_PROCESS_ID } from '../config/registry';

export interface BlogPermission {
  blog_id: string;
  roles: string[];
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

export class BlogRegistrySDK {
     private aoconnect: any;
     private registryProcessId: string;

   constructor(ao?: any, registryProcessId?: string) {
     this.aoconnect = ao || connect({ MODE: 'legacy' });
     this.registryProcessId = registryProcessId || BLOG_REGISTRY_PROCESS_ID;
     
     if (this.registryProcessId === 'YOUR_REGISTRY_PROCESS_ID_HERE') {
       throw new Error('Registry process ID not configured. Please run the deployment script first: npm run deploy:registry');
     }
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
    const result = await this.aoconnect.dryrun({
      Target: this.registryProcessId,
      Action: 'Get-Wallet-Blogs',
      Tags: [
        { name: 'Wallet-Address', value: wallet }
      ]
    });

    const response = JSON.parse(result.Messages[0].Data);
    if (!response.success) {
      throw new Error(response.data);
    }

    return response.data;
  }

  /**
   * Get all wallets with permissions for a specific blog
   */
  async getBlogWallets(blogId: string): Promise<WalletPermission[]> {
    const result = await this.aoconnect.dryrun({
      Target: this.registryProcessId,
      Action: 'Get-Blog-Wallets',
      Tags: [
        { name: 'Blog-ID', value: blogId }
      ]
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
    const result = await this.aoconnect.dryrun({
      Target: this.registryProcessId,
      Action: 'Check-Wallet-Role',
      Tags: [
        { name: 'Wallet-Address', value: wallet },
        { name: 'Blog-ID', value: blogId },
        { name: 'Role', value: role }
      ]
    });

    const response = JSON.parse(result.Messages[0].Data);
    if (!response.success) {
      throw new Error(response.data.error);
    }

    return response.data.has_role;
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<RegistryStats> {
    const result = await this.aoconnect.dryrun({
      Target: this.registryProcessId,
      Action: 'Get-Registry-Stats'
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
    return allBlogs.filter(blog => 
      blog.roles.includes('DEFAULT_ADMIN_ROLE')
    );
  }

  /**
   * Get all blogs that a wallet can edit
   */
  async getEditableBlogs(wallet: string): Promise<BlogPermission[]> {
    const allBlogs = await this.getWalletBlogs(wallet);
    return allBlogs.filter(blog => 
      blog.roles.includes('EDITOR_ROLE') || blog.roles.includes('DEFAULT_ADMIN_ROLE')
    );
  }

  /**
   * Check if a wallet can admin a specific blog
   */
  async canAdminBlog(wallet: string, blogId: string): Promise<boolean> {
    return this.checkWalletRole(wallet, blogId, 'DEFAULT_ADMIN_ROLE');
  }

  /**
   * Check if a wallet can edit a specific blog
   */
  async canEditBlog(wallet: string, blogId: string): Promise<boolean> {
    const canEdit = await this.checkWalletRole(wallet, blogId, 'EDITOR_ROLE');
    const canAdmin = await this.checkWalletRole(wallet, blogId, 'DEFAULT_ADMIN_ROLE');
    return canEdit || canAdmin;
  }
}
