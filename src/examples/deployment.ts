import {
  InkwellBlogSDK,
  DeployOptions,
  BlogInfo,
  BlogDetails,
  BlogPost,
} from '../index';
import Arweave from 'arweave';

// Example: Deploy and use a new Inkwell Blog process
async function deployAndUseBlog() {
  try {
    // Initialize Arweave
    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    });

        // Load or generate wallet
    let wallet: any;
    const walletPath = 'wallet.json';
    
    try {
      // Try to load existing wallet
      const fs = require('fs');
      if (fs.existsSync(walletPath)) {
        console.log(`📁 Loading wallet from ${walletPath}...`);
        const walletData = fs.readFileSync(walletPath, 'utf8');
        wallet = JSON.parse(walletData);
      } else {
        console.log('🔑 Generating new wallet...');
        wallet = await arweave.wallets.generate();
        
        // Save wallet to file
        fs.writeFileSync(walletPath, JSON.stringify(wallet, null, 2));
        console.log(`💾 Wallet saved to ${walletPath}`);
      }
    } catch (error) {
      console.log('🔑 Generating new wallet due to error...');
      wallet = await arweave.wallets.generate();
      
      // Try to save wallet to file
      try {
        const fs = require('fs');
        fs.writeFileSync(walletPath, JSON.stringify(wallet, null, 2));
        console.log(`💾 Wallet saved to ${walletPath}`);
      } catch (saveError) {
        console.warn('⚠️  Could not save wallet to file:', saveError instanceof Error ? saveError.message : String(saveError));
      }
    }
    
    console.log('Wallet address:', await arweave.wallets.getAddress(wallet));

    // Deploy a new Inkwell Blog process
    console.log('\n=== Deploying Inkwell Blog Process ===');

    const deployOptions: DeployOptions = {
      name: 'my-blog',
      wallet: wallet,
      contractPath: './lua-process/inkwell_blog.lua', // Path to your process file
      luaPath: './lua-process/?.lua', // Path to Lua modules
      tags: [
        { name: 'Blog-Name', value: 'My Personal Blog' },
        { name: 'Author', value: '@myhandle' },
      ],
      retry: {
        count: 5,
        delay: 2000,
      },
      minify: true, // Minify the contract for smaller size
      silent: false, // Show deployment progress
    };

    const deployResult = await InkwellBlogSDK.deploy(deployOptions);

    console.log('✅ Blog process deployed successfully!');
    console.log(`   Process ID: ${deployResult.processId}`);
    console.log(
      `   Process URL: https://www.ao.link/#/entity/${deployResult.processId}`
    );

    if (deployResult.messageId) {
      console.log(
        `   Deployment Message: https://www.ao.link/#/message/${deployResult.messageId}`
      );
    }

    // Initialize the SDK with the new process
    console.log('\n=== Initializing SDK ===');
    const blogSDK = new InkwellBlogSDK({
      processId: deployResult.processId,
      wallet: wallet,
    });

    // Get initial blog info
    console.log('\n=== Getting Blog Info ===');
    const infoResponse = await blogSDK.getInfo();

    if (infoResponse.success) {
      const info = infoResponse.data as BlogInfo;
      console.log('✅ Blog info retrieved:');
      console.log(`   Name: ${info.name}`);
      console.log(`   Author: ${info.author}`);
      console.log(`   Title: ${info.blogTitle}`);
      console.log(`   Description: ${info.blogDescription}`);
    } else {
      console.log('⚠️  Failed to get blog info:', infoResponse.data);
    }

    // Set up the blog details
    console.log('\n=== Setting Blog Details ===');
    const blogDetailsResponse = await blogSDK.setBlogDetails({
      data: {
        title: 'My Personal Blog',
        description: 'A blog about technology, life, and everything in between',
        logo: 'https://example.com/logo.png',
      },
    });

    if (blogDetailsResponse.success) {
      const blogDetailsResponseData = blogDetailsResponse.data as BlogDetails;
      console.log('✅ Blog details set successfully!');
      console.log('   Title:', blogDetailsResponseData.title);
      console.log('   Description:', blogDetailsResponseData.description);
    } else {
      console.error('❌ Failed to set blog details:', blogDetailsResponse.data);
    }

    // Create your first blog post
    console.log('\n=== Creating First Blog Post ===');
    const createPostResponse = await blogSDK.createPost({
      data: {
        title: 'Welcome to My Blog!',
        description: 'This is my first blog post using Inkwell Blog',
        body: `# Welcome to My Blog!

This is my first blog post created with the @inkwell.ar/sdk.

## Features
- **Easy Deployment**: Deployed with just a few lines of code
- **Role-based Access**: Secure editor and admin roles
- **Full CRUD**: Create, read, update, and delete posts
- **Customizable**: Set your own blog details

## Getting Started
The @inkwell.ar/sdk makes it easy to create and manage your own blog on the Arweave network.

Created at: ${new Date().toISOString()}`,
        published_at: Date.now(),
        last_update: Date.now(),
        labels: ['welcome', 'first-post', 'inkwell'],
        authors: ['@myhandle'],
      },
    });

    if (createPostResponse.success) {
      const post = createPostResponse.data as BlogPost;
      console.log('✅ First blog post created successfully!');
      console.log(`   Post ID: ${post.id}`);
      console.log(`   Title: ${post.title}`);
      console.log(
        `   Published: ${new Date(post.published_at).toLocaleString()}`
      );
    } else {
      console.error('❌ Failed to create blog post:', createPostResponse.data);
    }

    // Get all posts to verify
    console.log('\n=== Fetching All Posts ===');
    const postsResponse = await blogSDK.getAllPosts({ ordered: true });

    if (postsResponse.success) {
      const posts = postsResponse.data as BlogPost[];
      console.log(`✅ Found ${posts.length} post(s)`);
      posts.forEach((post) => {
        console.log(`   - ${post.title} (ID: ${post.id})`);
      });
    } else {
      console.error('❌ Failed to fetch posts:', postsResponse.data);
    }

    console.log(
      '\n🎉 Blog setup complete! Your blog is now live on the Arweave network.'
    );
    console.log(
      `📖 View your blog: https://www.ao.link/#/entity/${deployResult.processId}`
    );
  } catch (error) {
    console.error('❌ Error in deployment process:', error);
  }
}

// Example: Deploy with custom configuration
async function deployWithCustomConfig() {
  try {
    console.log('\n=== Deploying with Custom Configuration ===');

    const deployOptions: DeployOptions = {
      name: 'custom-blog',
      contractPath: './lua-process/inkwell_blog.lua',
      luaPath: './lua-process/?.lua',
      tags: [
        { name: 'Blog-Type', value: 'Technology' },
        { name: 'Language', value: 'English' },
      ],
      minify: true,
      // Custom transformer to modify the contract before deployment
      contractTransformer: (source: string) => {
        // Example: Add a custom comment to the contract
        return `-- Custom Blog Instance\n-- Deployed at: ${new Date().toISOString()}\n${source}`;
      },
      retry: {
        count: 3,
        delay: 1000,
      },
    };

    const result = await InkwellBlogSDK.deploy(deployOptions);

    console.log('✅ Custom blog deployed!');
    console.log(`   Process ID: ${result.processId}`);

    return result.processId;
  } catch (error) {
    console.error('❌ Custom deployment failed:', error);
    throw error;
  }
}

// Example: Deploy multiple blogs
async function deployMultipleBlogs() {
  try {
    console.log('\n=== Deploying Multiple Blogs ===');

    const blogConfigs = [
      {
        name: 'tech-blog',
        tags: [{ name: 'Category', value: 'Technology' }],
      },
      {
        name: 'personal-blog',
        tags: [{ name: 'Category', value: 'Personal' }],
      },
      {
        name: 'travel-blog',
        tags: [{ name: 'Category', value: 'Travel' }],
      },
    ];

    const deployedBlogs: { name: string; processId: string; url: string }[] =
      [];

    for (const config of blogConfigs) {
      console.log(`\nDeploying ${config.name}...`);

      const result = await InkwellBlogSDK.deploy({
        name: config.name,
        contractPath: './lua-process/inkwell_blog.lua',
        luaPath: './lua-process/?.lua',
        tags: config.tags,
        minify: true,
        silent: true,
      });

      deployedBlogs.push({
        name: config.name,
        processId: result.processId,
        url: `https://www.ao.link/#/entity/${result.processId}`,
      });

      console.log(`✅ ${config.name} deployed: ${result.processId}`);
    }

    console.log('\n📋 Deployed Blogs Summary:');
    deployedBlogs.forEach((blog) => {
      console.log(`   ${blog.name}: ${blog.url}`);
    });

    return deployedBlogs;
  } catch (error) {
    console.error('❌ Multiple deployment failed:', error);
    throw error;
  }
}

// Run examples
if (require.main === module) {
  console.log('=== @inkwell.ar/sdk - Deployment Examples ===\n');

  deployAndUseBlog()
    .then(() => {
      console.log('\n=== Running Custom Deployment Example ===');
      return deployWithCustomConfig();
    })
    .then(() => {
      console.log('\n=== Running Multiple Deployment Example ===');
      return deployMultipleBlogs();
    })
    .then(() => {
      console.log('\n🎉 All deployment examples completed successfully!');
    })
    .catch(console.error);
}
