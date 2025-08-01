#!/usr/bin/env node

import { BlogDetails, BlogPost, InkwellBlogSDK } from '../src/index';
import Arweave from 'arweave';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    console.log('🚀 Inkwell Blog Deployment Script\n');

    // Initialize Arweave
    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    });

    // Load or generate wallet
    const walletPath = process.argv[2] || 'wallet.json';
    let wallet: any;

    try {
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
        fs.writeFileSync(walletPath, JSON.stringify(wallet, null, 2));
        console.log(`💾 Wallet saved to ${walletPath}`);
      } catch (saveError) {
        console.warn('⚠️  Could not save wallet to file:', saveError instanceof Error ? saveError.message : String(saveError));
      }
    }

    const walletAddress = await arweave.wallets.getAddress(wallet);
    console.log(`👤 Wallet address: ${walletAddress}\n`);

    // Get blog name from command line or prompt
    const blogName = process.argv[3] || 'my-inkwell-blog';
    console.log(`📝 Blog name: ${blogName}`);

    // Check if process files exist
    const contractPath = './lua-process/inkwell_blog.lua';
    const accessControlPath = './lua-process/access_control.lua';

    if (!fs.existsSync(contractPath)) {
      console.error(`❌ Contract file not found: ${contractPath}`);
      console.log(
        'Please make sure you have the inkwell_blog.lua file in the lua-process directory.'
      );
      process.exit(1);
    }

    if (!fs.existsSync(accessControlPath)) {
      console.error(`❌ Access control file not found: ${accessControlPath}`);
      console.log(
        'Please make sure you have the access_control.lua file in the lua-process directory.'
      );
      process.exit(1);
    }

    console.log('✅ Process files found\n');

    // Deploy the blog process
    console.log('🚀 Deploying Inkwell Blog process...');

    const deployResult = await InkwellBlogSDK.deploy({
      name: blogName,
      wallet: wallet,
      contractPath: contractPath,
      luaPath: './lua-process/?.lua',
      tags: [
        { name: 'Blog-Name', value: blogName },
        { name: 'Deployed-By', value: '@inkwell.ar/sdk' },
        { name: 'Deployment-Date', value: new Date().toISOString() },
      ],
      retry: {
        count: 5,
        delay: 3000,
      },
      minify: true,
      silent: false,
    });

    console.log('\n✅ Blog process deployed successfully!');
    console.log(`   Process ID: ${deployResult.processId}`);
    console.log(
      `   Process URL: https://www.ao.link/#/entity/${deployResult.processId}`
    );

    if (deployResult.messageId) {
      console.log(
        `   Deployment Message: https://www.ao.link/#/message/${deployResult.messageId}`
      );
    }

    // Initialize SDK with the new process
    console.log('\n🔧 Initializing SDK...');
    const blogSDK = new InkwellBlogSDK({
      processId: deployResult.processId,
      wallet: wallet,
    });

    // Set default blog details
    console.log('\n📝 Setting default blog details...');
    const blogDetailsResponse = await blogSDK.setBlogDetails({
      data: {
        title: `${blogName.charAt(0).toUpperCase() + blogName.slice(1)}`,
        description: 'A blog powered by @inkwell.ar/sdk',
        logo: '',
      },
    });

    if (blogDetailsResponse.success) {
      const blogDetailsResponseData = blogDetailsResponse.data as BlogDetails;
      console.log('✅ Blog details set successfully!');
      console.log(`   Title: ${blogDetailsResponseData.title}`);
      console.log(`   Description: ${blogDetailsResponseData.description}`);
    } else {
      console.log('⚠️  Failed to set blog details:', blogDetailsResponse.data);
    }

    // Create a welcome post
    console.log('\n📄 Creating welcome post...');
    const createPostResponse = await blogSDK.createPost({
      data: {
        title: 'Welcome to My Blog!',
        description: 'This is my first blog post created with @inkwell.ar/sdk',
        body: `# Welcome to My Blog!

This is your first blog post created with the @inkwell.ar/sdk.

## Features
- **Decentralized**: Built on Arweave and AO
- **Role-based Access**: Secure editor and admin roles
- **Full CRUD**: Create, read, update, and delete posts
- **Customizable**: Set your own blog details

## Getting Started
You can now:
1. Create new posts using the SDK
2. Manage editors and admins
3. Customize your blog details
4. Build your own frontend

Created at: ${new Date().toISOString()}`,
        published_at: Date.now(),
        last_update: Date.now(),
        labels: ['welcome', 'first-post', 'inkwell'],
        authors: [walletAddress],
      },
    });

    if (createPostResponse.success) {
      const post = createPostResponse.data as BlogPost;
      console.log('✅ Welcome post created successfully!');
      console.log(`   Post ID: ${post.id}`);
      console.log(`   Title: ${post.title}`);
    } else {
      console.log(
        '⚠️  Failed to create welcome post:',
        createPostResponse.data
      );
    }

    // Save deployment info to file
    const deploymentInfo = {
      processId: deployResult.processId,
      messageId: deployResult.messageId,
      walletAddress: walletAddress,
      blogName: blogName,
      deployedAt: new Date().toISOString(),
      urls: {
        process: `https://www.ao.link/#/entity/${deployResult.processId}`,
        message: deployResult.messageId
          ? `https://www.ao.link/#/message/${deployResult.messageId}`
          : null,
      },
    };

    const deploymentFile = `deployment-${blogName}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to ${deploymentFile}`);

    // Display usage instructions
    console.log(
      '\n🎉 Deployment complete! Your blog is now live on the Arweave network.'
    );
    console.log('\n📖 Next steps:');
    console.log(
      '1. View your blog:',
      `https://www.ao.link/#/entity/${deployResult.processId}`
    );
    console.log('2. Use the SDK to interact with your blog:');
    console.log(`
   import { InkwellBlogSDK } from '@inkwell.ar/sdk';
   
   const blogSDK = new InkwellBlogSDK({
     processId: '${deployResult.processId}',
     wallet: yourWallet
   });
   
   // Get blog information
   const info = await blogSDK.getInfo();
   console.log('Blog:', info.data.name, 'by', info.data.author);
   
   // Get all posts
   const posts = await blogSDK.getAllPosts();
   
   // Create a new post
   await blogSDK.createPost({
     data: {
       title: 'My New Post',
       description: 'Post description',
       body: 'Post content...',
       published_at: Date.now(),
       last_update: Date.now(),
       authors: ['${walletAddress}']
     }
   });
    `);
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run the deployment script
if (require.main === module) {
  main();
}
