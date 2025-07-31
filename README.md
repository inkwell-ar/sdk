# Inkwell Blog SDK

A TypeScript SDK for interacting with the Inkwell Blog CRUD AO process using aoconnect.

## Features

- 🔐 **Role-based Access Control**: Support for Editor and Admin roles
- 📝 **Full CRUD Operations**: Create, read, update, and delete blog posts
- 👥 **User Management**: Add/remove editors and admins
- ✅ **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🛡️ **Input Validation**: Built-in validation for all inputs
- 🔄 **Error Handling**: Comprehensive error handling and response parsing

## Installation

```bash
npm install inkwell-blog-sdk
```

## Quick Start

```typescript
import { InkwellBlogSDK } from 'inkwell-blog-sdk';

// Initialize the SDK
const blogSDK = new InkwellBlogSDK({
  processId: 'your-ao-process-id-here'
});

// Get all posts
const response = await blogSDK.getAllPosts({ ordered: true });
if (response.success) {
  console.log('Posts:', response.data);
}
```

## API Reference

### Initialization

```typescript
import { InkwellBlogSDK } from 'inkwell-blog-sdk';

const blogSDK = new InkwellBlogSDK({
  processId: string,        // Required: Your AO process ID
  wallet?: any,            // Optional: Arweave wallet for authenticated operations
  aoconnect?: any          // Optional: Custom aoconnect instance
});
```

### Public Methods (No Authentication Required)

#### `getAllPosts(options?)`
Get all blog posts.

```typescript
const response = await blogSDK.getAllPosts({ 
  ordered: true // Optional: Sort by published_at (newest first)
});
```

#### `getPost(options)`
Get a specific post by ID.

```typescript
const response = await blogSDK.getPost({ 
  id: 1 
});
```

#### `getUserRoles()`
Get roles for the current wallet.

```typescript
const response = await blogSDK.getUserRoles();
```

### Editor Methods (Requires Editor Role)

#### `createPost(options)`
Create a new blog post.

```typescript
const response = await blogSDK.createPost({
  data: {
    title: 'My Blog Post',
    description: 'A brief description',
    body: 'Full post content...',
    published_at: Date.now(),
    last_update: Date.now(),
    labels: ['tag1', 'tag2'],
    authors: ['@author1', '@author2']
  }
});
```

#### `updatePost(options)`
Update an existing blog post.

```typescript
const response = await blogSDK.updatePost({
  id: 1,
  data: {
    title: 'Updated Title',
    description: 'Updated description',
    // ... other fields
  }
});
```

#### `deletePost(options)`
Delete a blog post.

```typescript
const response = await blogSDK.deletePost({ 
  id: 1 
});
```

### Admin Methods (Requires Admin Role)

#### `addEditors(options)`
Add new editors to the blog.

```typescript
const response = await blogSDK.addEditors({
  accounts: ['editor-address-1', 'editor-address-2']
});
```

#### `removeEditors(options)`
Remove editors from the blog.

```typescript
const response = await blogSDK.removeEditors({
  accounts: ['editor-address-to-remove']
});
```

#### `addAdmins(options)`
Add new admins to the blog.

```typescript
const response = await blogSDK.addAdmins({
  accounts: ['admin-address-1', 'admin-address-2']
});
```

#### `removeAdmins(options)`
Remove admins from the blog.

```typescript
const response = await blogSDK.removeAdmins({
  accounts: ['admin-address-to-remove']
});
```

#### `getEditors()`
Get all current editors.

```typescript
const response = await blogSDK.getEditors();
```

#### `getAdmins()`
Get all current admins.

```typescript
const response = await blogSDK.getAdmins();
```

## Data Types

### BlogPost
```typescript
interface BlogPost {
  id: number;
  title: string;
  description: string;
  body?: string;
  published_at: number;
  last_update: number;
  labels?: string[];
  authors: string[];
}
```

### ApiResponse
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
}
```

### CreatePostData
```typescript
interface CreatePostData {
  title: string;
  description: string;
  body?: string;
  published_at: number;
  last_update: number;
  labels?: string[];
  authors: string[];
}
```

## Examples

### Basic Usage
```typescript
import { InkwellBlogSDK } from 'inkwell-blog-sdk';

const blogSDK = new InkwellBlogSDK({
  processId: 'your-process-id'
});

// Get all posts
const postsResponse = await blogSDK.getAllPosts({ ordered: true });
if (postsResponse.success) {
  postsResponse.data.forEach(post => {
    console.log(`${post.title} by ${post.authors.join(', ')}`);
  });
}
```

### With Wallet Authentication
```typescript
import { InkwellBlogSDK } from 'inkwell-blog-sdk';
import Arweave from 'arweave';

const arweave = Arweave.init();
const wallet = await arweave.wallets.generate(); // Or load existing wallet

const blogSDK = new InkwellBlogSDK({
  processId: 'your-process-id',
  wallet: wallet
});

// Create a new post (requires Editor role)
const createResponse = await blogSDK.createPost({
  data: {
    title: 'My First Post',
    description: 'Hello World!',
    body: 'This is my first blog post.',
    published_at: Date.now(),
    last_update: Date.now(),
    authors: ['@myhandle']
  }
});
```

### Error Handling
```typescript
try {
  const response = await blogSDK.createPost({
    data: invalidData
  });
  
  if (!response.success) {
    console.error('Operation failed:', response.data);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Role System

The blog uses a role-based access control system:

- **Public**: Anyone can read posts and check their own roles
- **Editor**: Can create, update, and delete posts
- **Admin**: Can manage roles (add/remove editors and admins)

### Checking Roles
```typescript
const rolesResponse = await blogSDK.getUserRoles();
if (rolesResponse.success) {
  const roles = rolesResponse.data;
  
  if (roles.includes('EDITOR_ROLE')) {
    // User can create/edit posts
  }
  
  if (roles.includes('DEFAULT_ADMIN_ROLE')) {
    // User can manage roles
  }
}
```

## Error Handling

The SDK provides comprehensive error handling:

1. **Validation Errors**: Invalid input data
2. **Permission Errors**: Insufficient role permissions
3. **Network Errors**: Connection issues with AO
4. **Process Errors**: Errors from the AO process itself

All methods return an `ApiResponse` object with:
- `success`: Boolean indicating if the operation succeeded
- `data`: The result data or error message

## Development

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## License

MIT

## Author

[@7i7o](https://github.com/7i7o) 