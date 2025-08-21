import { InkwellBlogSDK, BlogRegistrySDK } from '../index';

/**
 * Example of deploying a blog in a browser environment
 * This works in both browser and Node.js environments
 */
export async function browserDeploymentExample() {
  try {
    console.log('🚀 Starting browser deployment example...');

    // Deploy a new blog (works in browser!)
    // No wallet needed if browser wallet is connected
    console.log('📝 Deploying new blog...');
    const result = await InkwellBlogSDK.deploy({
      name: 'My Browser Blog'
      // wallet: wallet // Optional - will use browser wallet if not provided
    });

    console.log('✅ Blog deployed successfully!');
    console.log('📋 Process ID:', result.processId);
    console.log('📋 Message ID:', result.messageId);

    // Initialize the blog SDK
    const blogSDK = new InkwellBlogSDK({
      processId: result.processId
    });

    // Initialize the registry SDK
    const registry = new BlogRegistrySDK();

    // Get blog info
    console.log('📖 Getting blog info...');
    const info = await blogSDK.getInfo();
    if (info.success) {
      console.log('📋 Blog Info:', info.data);
    }

    // Get registry stats
    console.log('📊 Getting registry stats...');
    const stats = await registry.getRegistryStats();
    console.log('📋 Registry Stats:', stats);

    // Check if the deploying wallet has admin permissions
    console.log('🔐 Checking permissions...');
    const canAdmin = await registry.canAdminBlog('deploying-wallet-address', result.processId);
    console.log('📋 Can Admin:', canAdmin);

    console.log('🎉 Browser deployment example completed successfully!');
    return result;

  } catch (error) {
    console.error('❌ Browser deployment example failed:', error);
    throw error;
  }
}

/**
 * Example of using an existing blog in a browser environment
 */
export async function existingBlogExample(processId: string) {
  try {
    console.log('📖 Starting existing blog example...');

    // Initialize with existing blog process ID
    const blogSDK = new InkwellBlogSDK({
      processId: processId
    });

    // Initialize the registry SDK
    const registry = new BlogRegistrySDK();

    // Get all posts
    console.log('📝 Getting all posts...');
    const response = await blogSDK.getAllPosts({ ordered: true });
    if (response.success) {
      console.log('📋 Posts:', response.data);
    } else {
      console.log('📋 No posts found or error:', response.data);
    }

    // Get blog info
    console.log('📖 Getting blog info...');
    const info = await blogSDK.getInfo();
    if (info.success) {
      console.log('📋 Blog Info:', info.data);
    }

    // Get registry stats
    console.log('📊 Getting registry stats...');
    const stats = await registry.getRegistryStats();
    console.log('📋 Registry Stats:', stats);

    console.log('🎉 Existing blog example completed successfully!');

  } catch (error) {
    console.error('❌ Existing blog example failed:', error);
    throw error;
  }
}

// Export for use in other files
export default {
  browserDeploymentExample,
  existingBlogExample
};
