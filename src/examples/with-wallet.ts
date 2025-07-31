import {
  InkwellBlogSDK,
  CreatePostData,
  BlogPost,
  BlogDetails,
  RoleUpdateResult,
} from '../index';
import Arweave from 'arweave';

// Example: Using the SDK with a wallet for authenticated operations
async function authenticatedUsage() {
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
      console.warn('⚠️  Could not save wallet to file:', saveError.message);
    }
  }
  
  console.log('Wallet address:', await arweave.wallets.getAddress(wallet));

  // Initialize the SDK with wallet for authenticated operations
  const blogSDK = new InkwellBlogSDK({
    processId: 'your-process-id-here',
    wallet: wallet,
  });

  try {
    // Check user roles first
    console.log('Checking user roles...');
    const rolesResponse = await blogSDK.getUserRoles();

    if (rolesResponse.success) {
      const roles: string[] = rolesResponse.data as string[];
      console.log(`User roles: ${roles.join(', ')}`);

      // Check if user has editor role
      if (roles.includes('EDITOR_ROLE')) {
        console.log('User has editor role - can create/edit posts');
        await createPostWithWallet(blogSDK);
      } else {
        console.log(
          'User does not have editor role - cannot create/edit posts'
        );
      }

      // Check if user has admin role
      if (roles.includes('DEFAULT_ADMIN_ROLE')) {
        console.log('User has admin role - can manage roles');
        await adminOperationsWithWallet(blogSDK);
      } else {
        console.log('User does not have admin role - cannot manage roles');
      }
    } else {
      console.error('Failed to fetch user roles:', rolesResponse.data);
    }
  } catch (error) {
    console.error('Error in authenticated usage:', error);
  }
}

// Example: Creating a post with wallet authentication
async function createPostWithWallet(blogSDK: InkwellBlogSDK) {
  const newPostData: CreatePostData = {
    title: 'Authenticated Blog Post',
    description: 'This post was created using wallet authentication',
    body: `# Authenticated Post

This is a blog post created with wallet authentication using the Inkwell SDK.

## Features
- Created with authenticated wallet
- Full markdown support
- Timestamped creation

Created at: ${new Date().toISOString()}`,
    published_at: Date.now(),
    last_update: Date.now(),
    labels: ['authenticated', 'sdk', 'example'],
    authors: ['@7i7o'],
  };

  try {
    console.log('\nCreating authenticated post...');
    const response = await blogSDK.createPost({ data: newPostData });

    if (response.success) {
      const post = response.data as BlogPost;
      console.log(`✅ Post created successfully!`);
      console.log(`   ID: ${post.id}`);
      console.log(`   Title: ${post.title}`);
      console.log(
        `   Published: ${new Date(post.published_at).toLocaleString()}`
      );
    } else {
      console.error('❌ Failed to create post:', response.data);
    }
  } catch (error) {
    console.error('❌ Error creating post:', error);
  }
}

// Example: Admin operations with wallet authentication
async function adminOperationsWithWallet(blogSDK: InkwellBlogSDK) {
  try {
    // Get current editors and admins
    console.log('\n=== Current Role Members ===');

    const editorsResponse = await blogSDK.getEditors();
    if (editorsResponse.success) {
      const editorsResponseData = editorsResponse.data as string[];
      console.log(`Editors: ${editorsResponseData.join(', ')}`);
    }

    const adminsResponse = await blogSDK.getAdmins();
    if (adminsResponse.success) {
      const adminsResponseData = adminsResponse.data as string[];
      console.log(`Admins: ${adminsResponseData.join(', ')}`);
    }

    // Set blog details
    console.log('\n=== Setting Blog Details ===');
    const blogDetailsResponse = await blogSDK.setBlogDetails({
      data: {
        title: 'My Authenticated Blog',
        description: 'A blog managed with wallet authentication',
        logo: 'https://example.com/authenticated-logo.png',
      },
    });

    if (blogDetailsResponse.success) {
      const blogDetailsResponseData = blogDetailsResponse.data as BlogDetails;
      console.log('✅ Blog details updated successfully!');
      console.log(`   Title: ${blogDetailsResponseData.title}`);
      console.log(`   Description: ${blogDetailsResponseData.description}`);
      console.log(`   Logo: ${blogDetailsResponseData.logo}`);
    } else {
      console.error(
        '❌ Failed to update blog details:',
        blogDetailsResponse.data
      );
    }

    // Example: Add a new editor (replace with actual address)
    const newEditorAddress = 'new-editor-address-here';
    console.log(`\nAdding new editor: ${newEditorAddress}`);

    const addEditorResponse = await blogSDK.addEditors({
      accounts: [newEditorAddress],
    });

    if (addEditorResponse.success) {
      const results = addEditorResponse.data as RoleUpdateResult[];
      results.forEach((result) => {
        if (result.success) {
          console.log(`✅ Successfully added editor: ${result.account}`);
        } else {
          console.error(
            `❌ Failed to add editor ${result.account}:`,
            result.error
          );
        }
      });
    } else {
      console.error('❌ Failed to add editors:', addEditorResponse.data);
    }

    // Example: Remove an editor (replace with actual address)
    const editorToRemove = 'editor-to-remove-here';
    console.log(`\nRemoving editor: ${editorToRemove}`);

    const removeEditorResponse = await blogSDK.removeEditors({
      accounts: [editorToRemove],
    });

    if (removeEditorResponse.success) {
      const results = removeEditorResponse.data as RoleUpdateResult[];
      results.forEach((result) => {
        if (result.success) {
          console.log(`✅ Successfully removed editor: ${result.account}`);
        } else {
          console.error(
            `❌ Failed to remove editor ${result.account}:`,
            result.error
          );
        }
      });
    } else {
      console.error('❌ Failed to remove editors:', removeEditorResponse.data);
    }
  } catch (error) {
    console.error('❌ Error in admin operations:', error);
  }
}

// Example: Error handling and validation
async function errorHandlingExample() {
  const blogSDK = new InkwellBlogSDK({
    processId: 'your-process-id-here',
  });

  try {
    // Example of validation error
    console.log('\n=== Validation Error Example ===');

    const invalidPostData = {
      title: '', // Invalid: empty title
      description: 'This should fail validation',
      published_at: Date.now(),
      last_update: Date.now(),
      authors: [], // Invalid: empty authors array
    };

    const response = await blogSDK.createPost({ data: invalidPostData as any });

    if (!response.success) {
      console.log('✅ Validation error caught:', response.data);
    }

    // Example of invalid post ID
    console.log('\n=== Invalid ID Example ===');

    const invalidIdResponse = await blogSDK.getPost({ id: -1 });

    if (!invalidIdResponse.success) {
      console.log('✅ Invalid ID error caught:', invalidIdResponse.data);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run examples
if (require.main === module) {
  console.log('=== Inkwell Blog SDK - Authenticated Examples ===\n');

  authenticatedUsage()
    .then(() => {
      console.log('\n=== Error Handling Examples ===');
      return errorHandlingExample();
    })
    .then(() => console.log('\nAll examples completed'))
    .catch(console.error);
}
