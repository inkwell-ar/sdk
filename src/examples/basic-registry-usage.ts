import { BlogRegistrySDK } from '../index';
import { Role } from '../types';

// Basic registry usage example - demonstrates read-only functions
async function basicRegistryUsage() {
  try {
    console.log('🔍 Basic Registry Usage Example\n');

    // Initialize the registry SDK (uses hardcoded registry process ID)
    const registry = new BlogRegistrySDK();

    // Example wallet address to check
    // const walletAddress = 'example-wallet-address-here';
    const walletAddress = 'rUl58p0Y0f77kTnm2m121ePOHEnLUpLVdgz8oENkObo';

    console.log(`📋 Checking permissions for wallet: ${walletAddress}\n`);

    // 1. Get all blogs this wallet has access to
    console.log('1. Getting all blogs for wallet...');
    const allBlogs = await registry.getWalletBlogs(walletAddress);
    console.log(`   Found ${allBlogs.length} blogs with access`);

    if (allBlogs.length > 0) {
      allBlogs.forEach((blog, index) => {
        console.log(`   ${index + 1}. Blog ID: ${blog.blog_id}`);
        console.log(`      Roles: ${blog.roles.join(', ')}`);
        console.log(
          `      Last Updated: ${new Date(blog.last_updated * 1000).toLocaleString()}`
        );
      });
    }
    console.log('');

    // 2. Get blogs this wallet can admin
    console.log('2. Getting admin blogs...');
    const adminBlogs = await registry.getAdminBlogs(walletAddress);
    console.log(`   Found ${adminBlogs.length} blogs with admin access`);

    if (adminBlogs.length > 0) {
      adminBlogs.forEach((blog, index) => {
        console.log(`   ${index + 1}. Blog ID: ${blog.blog_id}`);
        console.log(
          `      Last Updated: ${new Date(blog.last_updated * 1000).toLocaleString()}`
        );
      });
    }
    console.log('');

    // 3. Get blogs this wallet can edit
    console.log('3. Getting editable blogs...');
    const editableBlogs = await registry.getEditableBlogs(walletAddress);
    console.log(`   Found ${editableBlogs.length} blogs with edit access`);

    if (editableBlogs.length > 0) {
      editableBlogs.forEach((blog, index) => {
        console.log(`   ${index + 1}. Blog ID: ${blog.blog_id}`);
        console.log(`      Roles: ${blog.roles.join(', ')}`);
        console.log(
          `      Last Updated: ${new Date(blog.last_updated * 1000).toLocaleString()}`
        );
      });
    }
    console.log('');

    // 4. Check specific permissions for a blog
    const exampleBlogId = 'example-blog-process-id';
    console.log(`4. Checking specific permissions for blog: ${exampleBlogId}`);

    const canEdit = await registry.canEditBlog(walletAddress, exampleBlogId);
    const canAdmin = await registry.canAdminBlog(walletAddress, exampleBlogId);

    console.log(`   Can edit: ${canEdit ? '✅ Yes' : '❌ No'}`);
    console.log(`   Can admin: ${canAdmin ? '✅ Yes' : '❌ No'}`);
    console.log('');

    // 5. Check specific role
    console.log('5. Checking specific role...');
    const hasEditorRole = await registry.checkWalletRole(
      walletAddress,
      exampleBlogId,
      Role.EDITOR
    );
    const hasAdminRole = await registry.checkWalletRole(
      walletAddress,
      exampleBlogId,
      Role.ADMIN
    );

    console.log(`   Has ${Role.EDITOR}: ${hasEditorRole ? '✅ Yes' : '❌ No'}`);
    console.log(`   Has ${Role.ADMIN}: ${hasAdminRole ? '✅ Yes' : '❌ No'}`);
    console.log('');

    // 6. Get registry statistics
    console.log('6. Getting registry statistics...');
    const stats = await registry.getRegistryStats();
    console.log(`   Total wallets: ${stats.wallet_count}`);
    console.log(`   Total blogs: ${stats.blog_count}`);
    console.log(`   Total permissions: ${stats.total_permissions}`);
    console.log(`   Registry version: ${stats.version}`);
    console.log('');

    // 7. Get all wallets with access to a specific blog
    console.log(`7. Getting all wallets with access to blog: ${exampleBlogId}`);
    const blogWallets = await registry.getBlogWallets(exampleBlogId);
    console.log(`   Found ${blogWallets.length} wallets with access`);

    if (blogWallets.length > 0) {
      blogWallets.forEach((wallet, index) => {
        console.log(`   ${index + 1}. Wallet: ${wallet.wallet}`);
        console.log(`      Roles: ${wallet.roles.join(', ')}`);
        console.log(
          `      Last Updated: ${new Date(wallet.last_updated * 1000).toLocaleString()}`
        );
      });
    }
    console.log('');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Total blogs accessible: ${allBlogs.length}`);
    console.log(`   Admin blogs: ${adminBlogs.length}`);
    console.log(`   Editable blogs: ${editableBlogs.length}`);
    console.log(`   Registry total blogs: ${stats.blog_count}`);
    console.log(`   Registry total wallets: ${stats.wallet_count}`);

    return {
      walletAddress,
      allBlogs,
      adminBlogs,
      editableBlogs,
      canEdit,
      canAdmin,
      hasEditorRole,
      hasAdminRole,
      stats,
      blogWallets,
    };
  } catch (error) {
    console.error('❌ Error in basic registry usage:', error);
    throw error;
  }
}

// Example of checking multiple wallets
async function checkMultipleWallets() {
  try {
    console.log('👥 Checking Multiple Wallets Example\n');

    const registry = new BlogRegistrySDK();
    const wallets = [
      'wallet-1-address',
      'wallet-2-address',
      'wallet-3-address',
    ];

    const results: {
      wallet: string;
      allBlogs: number;
      adminBlogs: number;
      editableBlogs: number;
    }[] = [];

    for (const wallet of wallets) {
      console.log(`🔍 Checking wallet: ${wallet}`);

      const allBlogs = await registry.getWalletBlogs(wallet);
      const adminBlogs = await registry.getAdminBlogs(wallet);
      const editableBlogs = await registry.getEditableBlogs(wallet);

      console.log(`   Total blogs: ${allBlogs.length}`);
      console.log(`   Admin blogs: ${adminBlogs.length}`);
      console.log(`   Editable blogs: ${editableBlogs.length}`);
      console.log('');

      results.push({
        wallet,
        allBlogs: allBlogs.length,
        adminBlogs: adminBlogs.length,
        editableBlogs: editableBlogs.length,
      });
    }

    console.log('📊 Summary for all wallets:');
    results.forEach((result) => {
      console.log(
        `   ${result.wallet}: ${result.allBlogs} total, ${result.adminBlogs} admin, ${result.editableBlogs} editable`
      );
    });

    return results;
  } catch (error) {
    console.error('❌ Error checking multiple wallets:', error);
    throw error;
  }
}

// Example of permission checking before actions
async function permissionCheckExample(walletAddress: string, blogId: string) {
  try {
    console.log('🔐 Permission Check Example\n');

    const registry = new BlogRegistrySDK();

    console.log(`Checking permissions for wallet: ${walletAddress}`);
    console.log(`On blog: ${blogId}\n`);

    // Check permissions
    const canEdit = await registry.canEditBlog(walletAddress, blogId);
    const canAdmin = await registry.canAdminBlog(walletAddress, blogId);

    console.log('📋 Permission Results:');
    console.log(`   Can edit: ${canEdit ? '✅ Yes' : '❌ No'}`);
    console.log(`   Can admin: ${canAdmin ? '✅ Yes' : '❌ No'}`);
    console.log('');

    // Simulate actions based on permissions
    console.log('🎯 Available Actions:');

    if (canAdmin) {
      console.log('   ✅ Can manage blog settings');
      console.log('   ✅ Can add/remove editors and admins');
      console.log('   ✅ Can edit posts');
      console.log('   ✅ Can view blog');
    } else if (canEdit) {
      console.log('   ❌ Cannot manage blog settings');
      console.log('   ❌ Cannot add/remove editors and admins');
      console.log('   ✅ Can edit posts');
      console.log('   ✅ Can view blog');
    } else {
      console.log('   ❌ Cannot manage blog settings');
      console.log('   ❌ Cannot add/remove editors and admins');
      console.log('   ❌ Cannot edit posts');
      console.log('   ✅ Can view blog (public)');
    }

    return {
      walletAddress,
      blogId,
      canEdit,
      canAdmin,
    };
  } catch (error) {
    console.error('❌ Error in permission check:', error);
    throw error;
  }
}

export { basicRegistryUsage, checkMultipleWallets, permissionCheckExample };

basicRegistryUsage();
