import {
  InkwellBlogSDK,
  CreatePostData,
  BlogPost,
  BlogDetails,
  RoleUpdateResult,
} from '../index';
import { BLOG_PROCESS_ID, EDITOR_ADDRESS } from './utils/constants';
import { loadOrGenerateWallet } from './utils/wallet';

// Example: Using the SDK with a wallet for authenticated operations
async function authenticatedUsage() {
  const { wallet, walletAddress } = await loadOrGenerateWallet('wallet.json');
  console.log('Wallet address:', walletAddress);

  // Initialize the SDK with wallet for authenticated operations
  const blogSDK = new InkwellBlogSDK({
    processId: BLOG_PROCESS_ID,
    wallet: wallet,
  });

  try {
    // Check user roles first
    console.log('Checking user roles...');
    const rolesResponse = await blogSDK.getUserRoles(walletAddress);

    console.log('> rolesResponse: ', JSON.stringify(rolesResponse, null, 2));

    if (rolesResponse.success) {
      const roles: string[] = rolesResponse.data as string[];
      console.log(`User roles: ${roles.join(', ')}`);

      // Check if user has admin role
      if (roles.includes('DEFAULT_ADMIN_ROLE')) {
        console.log('User has admin role - can manage roles');
        await adminOperationsWithWallet(blogSDK, wallet);
      } else {
        console.log('User does not have admin role - cannot manage roles');
      }

      // Check if user has editor role
      if (roles.includes('EDITOR_ROLE')) {
        console.log('User has editor role - can create/edit posts');
        await createPostWithWallet(blogSDK, wallet);
      } else {
        console.log(
          'User does not have editor role - cannot create/edit posts'
        );
      }
    } else {
      console.error('Failed to fetch user roles:', rolesResponse.data);
    }
  } catch (error) {
    console.error('Error in authenticated usage:', error);
  }
}

// Example: Creating a post with wallet authentication
async function createPostWithWallet(blogSDK: InkwellBlogSDK, wallet: any) {
  const newPostData: CreatePostData = {
    title: 'Authenticated Blog Post',
    description: 'This post was created using wallet authentication',
    body: `# Authenticated Post

This is a blog post created with wallet authentication using the @inkwell.ar/sdk.

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
    const response = await blogSDK.createPost({
      data: newPostData,
      wallet: wallet,
    });

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
async function adminOperationsWithWallet(blogSDK: InkwellBlogSDK, wallet: any) {
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
      wallet: wallet,
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
    const newEditorAddress = EDITOR_ADDRESS;
    console.log(`\nAdding new editor: ${newEditorAddress}`);

    const addEditorResponse = await blogSDK.addEditors({
      accounts: [newEditorAddress],
      wallet: wallet,
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
    const editorToRemove = EDITOR_ADDRESS;
    console.log(`\nRemoving editor: ${editorToRemove}`);

    const removeEditorResponse = await blogSDK.removeEditors({
      accounts: [editorToRemove],
      wallet: wallet,
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
  const { wallet } = await loadOrGenerateWallet('wallet.json');

  const blogSDK = new InkwellBlogSDK({
    processId: BLOG_PROCESS_ID,
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

    const response = await blogSDK.createPost({
      data: invalidPostData as any,
      wallet: wallet,
    });

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
  console.log('=== @inkwell.ar/sdk - Authenticated Examples ===\n');

  authenticatedUsage()
    .then(() => {
      console.log('\n=== Error Handling Examples ===');
      return errorHandlingExample();
    })
    .then(() => console.log('\nAll examples completed'))
    .catch(console.error);
}
