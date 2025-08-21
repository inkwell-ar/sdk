import { InkwellBlogSDK, BlogRegistrySDK } from '../index';

// Basic usage example
async function basicUsage() {
  try {
    // Deploy a new blog
    console.log('🚀 Deploying blog...');
    const deployResult = await InkwellBlogSDK.deploy({
      name: 'my-blog'
    });
    
    console.log('✅ Blog deployed:', deployResult.processId);
    
    // Initialize SDKs
    const blog = new InkwellBlogSDK({
      processId: deployResult.processId
    });
    
    const registry = new BlogRegistrySDK();
    
    // Get blog info
    const info = await blog.getInfo();
    console.log('📝 Blog info:', info.data);
    
    // Get registry stats
    const stats = await registry.getRegistryStats();
    console.log('📊 Registry stats:', stats);
    
    // Check permissions for a wallet
    const walletAddress = 'example-wallet-address';
    const canEdit = await registry.canEditBlog(walletAddress, deployResult.processId);
    const canAdmin = await registry.canAdminBlog(walletAddress, deployResult.processId);
    
    console.log(`Wallet ${walletAddress}:`);
    console.log(`  Can edit: ${canEdit}`);
    console.log(`  Can admin: ${canAdmin}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

export { basicUsage };
