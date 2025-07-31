import { InkwellBlogSDK, BlogPost, CreatePostData } from '../index';

// Example: Basic usage of the Inkwell Blog SDK
async function basicUsage() {
  // Initialize the SDK with your process ID
  const blogSDK = new InkwellBlogSDK({
    processId: 'your-process-id-here'
  });

  try {
    // Get blog information (public - no authentication required)
    console.log('Fetching blog information...');
    const infoResponse = await blogSDK.getInfo();
    
    if (infoResponse.success) {
      const info = infoResponse.data;
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
      const posts: BlogPost[] = allPostsResponse.data;
      console.log(`Found ${posts.length} posts`);
      posts.forEach(post => {
        console.log(`- ${post.title} (ID: ${post.id})`);
      });
    } else {
      console.error('Failed to fetch posts:', allPostsResponse.data);
    }

    // Get a specific post
    console.log('\nFetching post with ID 1...');
    const postResponse = await blogSDK.getPost({ id: 1 });
    
    if (postResponse.success) {
      const post: BlogPost = postResponse.data;
      console.log(`Post: ${post.title}`);
      console.log(`Description: ${post.description}`);
      console.log(`Authors: ${post.authors.join(', ')}`);
    } else {
      console.error('Failed to fetch post:', postResponse.data);
    }

    // Get user roles (public - shows roles for current wallet)
    console.log('\nFetching user roles...');
    const rolesResponse = await blogSDK.getUserRoles();
    
    if (rolesResponse.success) {
      const roles: string[] = rolesResponse.data;
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
    processId: 'your-process-id-here'
  });

  const newPostData: CreatePostData = {
    title: 'My First Blog Post',
    description: 'This is a sample blog post created using the Inkwell SDK',
    body: 'This is the full content of the blog post. You can write markdown or plain text here.',
    published_at: Date.now(),
    last_update: Date.now(),
    labels: ['sample', 'tutorial'],
    authors: ['@7i7o']
  };

  try {
    console.log('Creating new post...');
    const response = await blogSDK.createPost({ data: newPostData });
    
    if (response.success) {
      const post: BlogPost = response.data;
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
    processId: 'your-process-id-here'
  });

  try {
    // Get all editors
    console.log('Fetching all editors...');
    const editorsResponse = await blogSDK.getEditors();
    
    if (editorsResponse.success) {
      const editors: string[] = editorsResponse.data;
      console.log(`Editors: ${editors.join(', ')}`);
    } else {
      console.error('Failed to fetch editors:', editorsResponse.data);
    }

    // Get all admins
    console.log('\nFetching all admins...');
    const adminsResponse = await blogSDK.getAdmins();
    
    if (adminsResponse.success) {
      const admins: string[] = adminsResponse.data;
      console.log(`Admins: ${admins.join(', ')}`);
    } else {
      console.error('Failed to fetch admins:', adminsResponse.data);
    }

    // Add a new editor
    console.log('\nAdding new editor...');
    const addEditorResponse = await blogSDK.addEditors({
      accounts: ['new-editor-address']
    });
    
    if (addEditorResponse.success) {
      const results = addEditorResponse.data;
      results.forEach(result => {
        if (result.success) {
          console.log(`Successfully added editor: ${result.account}`);
        } else {
          console.error(`Failed to add editor ${result.account}:`, result.error);
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
  console.log('=== Inkwell Blog SDK Examples ===\n');
  
  basicUsage()
    .then(() => console.log('\nBasic usage completed'))
    .catch(console.error);
} 