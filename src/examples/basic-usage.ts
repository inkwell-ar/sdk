import {
  InkwellBlogSDK,
  BlogPost,
  CreatePostData,
  BlogInfo,
  RoleUpdateResult,
} from '../index';
import {
  BLOG_PROCESS_ID,
  EDITOR_ADDRESS,
  OWNER_ADDRESS,
} from './utils/constants';
import { loadOrGenerateWallet } from './utils/wallet';

const { wallet } = await loadOrGenerateWallet('wallet-mock.json');

// Example: Basic usage of the @inkwell.ar/sdk
async function basicUsage() {
  // Initialize the SDK with your process ID
  const blogSDK = new InkwellBlogSDK({
    processId: BLOG_PROCESS_ID,
  });

  try {
    // Get blog information (public - no authentication required)
    console.log('Fetching blog information...');
    const infoResponse = await blogSDK.getInfo();

    if (infoResponse.success) {
      const info = infoResponse.data as BlogInfo;
      console.log(`Blog: ${info.name}`);
      console.log(`Author: ${info.author}`);
      console.log(`Title: ${info.blogTitle}`);
      console.log(`Description: ${info.blogDescription}`);
      if (info.blogLogo) {
        console.log(`Logo: ${info.blogLogo}`);
      }
    } else {
      console.error('Failed to fetch blog info:', infoResponse.data);
    }

    // Get all posts (public - no authentication required)
    console.log('\nFetching all posts...');
    const allPostsResponse = await blogSDK.getAllPosts({ ordered: true });

    if (allPostsResponse.success) {
      const posts: BlogPost[] = allPostsResponse.data as BlogPost[];
      console.log(`Found ${posts.length} posts`);
      posts.forEach((post) => {
        console.log(`- ${post.title} (ID: ${post.id})`);
      });
    } else {
      console.error('Failed to fetch posts:', allPostsResponse.data);
    }

    // Get a specific post
    console.log('\nFetching post with ID 1...');
    const postResponse = await blogSDK.getPost({ id: 1 });

    if (postResponse.success) {
      const post: BlogPost = postResponse.data as BlogPost;
      console.log(`Post: ${post.title}`);
      console.log(`Description: ${post.description}`);
      console.log(`Authors: ${post.authors.join(', ')}`);
    } else {
      console.error('Failed to fetch post:', postResponse.data);
    }

    // Get user roles (public - shows roles for current wallet)
    console.log('\nFetching user roles...');
    const rolesResponse = await blogSDK.getUserRoles(OWNER_ADDRESS);

    if (rolesResponse.success) {
      const roles: string[] = rolesResponse.data as string[];
      console.log(`User roles: ${roles.join(', ')}`);
    } else {
      console.error('Failed to fetch user roles:', rolesResponse.data);
    }
  } catch (error) {
    console.error('Error in basic usage:', error);
  }
}

// Example: Creating a new post (requires Editor role)
async function createPostExample() {
  const blogSDK = new InkwellBlogSDK({
    processId: BLOG_PROCESS_ID,
  });

  const newPostData: CreatePostData = {
    title: 'My First Blog Post',
    description: 'This is a sample blog post created using the @inkwell.ar/sdk',
    body: 'This is the full content of the blog post. You can write markdown or plain text here.',
    published_at: Date.now(),
    last_update: Date.now(),
    labels: ['sample', 'tutorial'],
    authors: ['@7i7o'],
  };

  try {
    console.log('Creating new post...');
    const response = await blogSDK.createPost({
      data: newPostData,
      wallet: wallet,
    });

    if (response.success) {
      const post: BlogPost = response.data as BlogPost;
      console.log(`Post created successfully! ID: ${post.id}`);
      console.log(`Title: ${post.title}`);
    } else {
      console.error('Failed to create post:', response.data);
    }
  } catch (error) {
    console.error('Error creating post:', error);
  }
}

// Example: Admin operations (requires Admin role)
async function adminOperationsExample() {
  const blogSDK = new InkwellBlogSDK({
    processId: BLOG_PROCESS_ID,
  });

  try {
    // Get all editors
    console.log('Fetching all editors...');
    const editorsResponse = await blogSDK.getEditors();

    if (editorsResponse.success) {
      const editors: string[] = editorsResponse.data as string[];
      console.log(`Editors: ${editors.join(', ')}`);
    } else {
      console.error('Failed to fetch editors:', editorsResponse.data);
    }

    // Get all admins
    console.log('\nFetching all admins...');
    const adminsResponse = await blogSDK.getAdmins();

    if (adminsResponse.success) {
      const admins: string[] = adminsResponse.data as string[];
      console.log(`Admins: ${admins.join(', ')}`);
    } else {
      console.error('Failed to fetch admins:', adminsResponse.data);
    }

    // Add a new editor
    console.log('\nAdding new editor...');
    const addEditorResponse = await blogSDK.addEditors({
      accounts: [EDITOR_ADDRESS],
      wallet: wallet,
    });

    if (addEditorResponse.success) {
      const results = addEditorResponse.data as RoleUpdateResult[];
      results.forEach((result) => {
        if (result.success) {
          console.log(`Successfully added editor: ${result.account}`);
        } else {
          console.error(
            `Failed to add editor ${result.account}:`,
            result.error
          );
        }
      });
    } else {
      console.error('Failed to add editors:', addEditorResponse.data);
    }
  } catch (error) {
    console.error('Error in admin operations:', error);
  }
}

// Run examples
if (require.main === module) {
  console.log('=== @inkwell.ar/sdk Examples ===\n');

  basicUsage()
    .then(() => console.log('\nBasic usage completed'))
    .catch(console.error);

  createPostExample()
    .then(() => console.log('\nCreate post example completed'))
    .catch(console.error);

  adminOperationsExample()
    .then(() => console.log('\nAdmin operations example completed'))
    .catch(console.error);
}
