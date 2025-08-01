# @inkwell.ar/sdk

A TypeScript SDK for interacting with the Inkwell Blog CRUD AO process using aoconnect. Published as `@inkwell.ar/sdk`.

## Features

- 🔐 **Role-based Access Control**: Support for Editor and Admin roles
- 📝 **Full CRUD Operations**: Create, read, update, and delete blog posts
- 👥 **User Management**: Add/remove editors and admins
- 🎨 **Blog Customization**: Set blog title, description, and logo
- 🚀 **Easy Deployment**: Deploy your own blog process with one command
- ✅ **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🛡️ **Input Validation**: Built-in validation for all inputs
- 🔄 **Error Handling**: Comprehensive error handling and response parsing

## Installation

```bash
npm install @inkwell.ar/sdk
```

Or using yarn:

```bash
yarn add @inkwell.ar/sdk
```

## Quick Start

```typescript
import { InkwellBlogSDK } from '@inkwell.ar/sdk';

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
import { InkwellBlogSDK } from '@inkwell.ar/sdk';

const blogSDK = new InkwellBlogSDK({
  processId: string,        // Required: Your AO process ID
  wallet?: any,            // Optional: Arweave wallet for authenticated operations
  aoconnect?: any          // Optional: Custom aoconnect instance
});
```

**Browser Wallet Support**: In browser environments, if no wallet is provided, the SDK will automatically use `globalThis.arweaveWallet` if available.

### Public Methods (No Authentication Required)

#### `getInfo()`
Get blog information including name, author, and details.

```typescript
const response = await blogSDK.getInfo();
// Returns: { name, author, blogTitle, blogDescription, blogLogo, details }
```

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
  },
  wallet: yourWallet // Optional: will use browser wallet if not provided
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
  },
  wallet: yourWallet // Optional: will use browser wallet if not provided
});
```

#### `deletePost(options)`
Delete a blog post.

```typescript
const response = await blogSDK.deletePost({ 
  id: 1,
  wallet: yourWallet // Optional: will use browser wallet if not provided
});
```

### Admin Methods (Requires Admin Role)

#### `addEditors(options)`
Add new editors to the blog.

```typescript
const response = await blogSDK.addEditors({
  accounts: ['editor-address-1', 'editor-address-2'],
  wallet: yourWallet // Optional: will use browser wallet if not provided
});
```

#### `removeEditors(options)`
Remove editors from the blog.

```typescript
const response = await blogSDK.removeEditors({
  accounts: ['editor-address-to-remove'],
  wallet: yourWallet // Optional: will use browser wallet if not provided
});
```

#### `addAdmins(options)`
Add new admins to the blog.

```typescript
const response = await blogSDK.addAdmins({
  accounts: ['admin-address-1', 'admin-address-2'],
  wallet: yourWallet // Optional: will use browser wallet if not provided
});
```

#### `removeAdmins(options)`
Remove admins from the blog.

```typescript
const response = await blogSDK.removeAdmins({
  accounts: ['admin-address-to-remove'],
  wallet: yourWallet // Optional: will use browser wallet if not provided
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

#### `setBlogDetails(options)`
Set blog details (title, description, logo). Admin role required.

```typescript
const response = await blogSDK.setBlogDetails({
  data: {
    title: 'My Blog Title',
    description: 'My blog description',
    logo: 'https://example.com/logo.png'
  },
  wallet: yourWallet // Optional: will use browser wallet if not provided
});
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
  data: T | string; // T for successful operations, string for error messages
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

### BlogDetails
```typescript
interface BlogDetails {
  title: string;
  description: string;
  logo: string;
}
```

### BlogInfo
```typescript
interface BlogInfo {
  name: string;
  author: string;
  blogTitle: string;
  blogDescription: string;
  blogLogo: string;
  details: BlogDetails;
}
```

### UpdateBlogDetailsData
```typescript
interface UpdateBlogDetailsData {
  title?: string;
  description?: string;
  logo?: string;
}
```

## Deployment

The SDK includes built-in deployment functionality using [ao-deploy](https://github.com/pawanpaudel93/ao-deploy).

### Deploy a New Blog Process

```typescript
import { InkwellBlogSDK } from '@inkwell.ar/sdk';

// Deploy a new blog process
const deployResult = await InkwellBlogSDK.deploy({
  name: 'my-blog',
  wallet: yourWallet,
  contractPath: './lua-process/inkwell_blog.lua',
  luaPath: './lua-process/?.lua',
  tags: [
    { name: 'Blog-Name', value: 'My Personal Blog' },
    { name: 'Author', value: '@myhandle' }
  ],
  minify: true
});

console.log('Process ID:', deployResult.processId);
console.log('View at:', `https://www.ao.link/#/entity/${deployResult.processId}`);

// Initialize SDK with the new process
const blogSDK = new InkwellBlogSDK({
  processId: deployResult.processId,
  wallet: yourWallet
});
```

### Deployment Options

```typescript
interface DeployOptions {
  name?: string;                    // Process name (default: 'inkwell-blog')
  wallet?: string | any;            // Arweave wallet
  contractPath?: string;            // Path to process file
  luaPath?: string;                 // Path to Lua modules
  tags?: Array<{ name: string; value: string }>; // Custom tags
  retry?: { count: number; delay: number }; // Retry configuration
  minify?: boolean;                 // Minify contract (default: true)
  contractTransformer?: (source: string) => string; // Custom source transformer
  onBoot?: boolean;                 // Load on boot (default: false)
  silent?: boolean;                 // Disable logging (default: false)
  blueprints?: string[];            // Blueprints to use
  forceSpawn?: boolean;             // Force new process (default: false)
}
```

## Examples

### Basic Usage
```typescript
import { InkwellBlogSDK } from '@inkwell.ar/sdk';

const blogSDK = new InkwellBlogSDK({
  processId: 'your-process-id'
});

// Get blog information
const infoResponse = await blogSDK.getInfo();
if (infoResponse.success) {
  const info = infoResponse.data;
  console.log(`Blog: ${info.name} by ${info.author}`);
  console.log(`Title: ${info.blogTitle}`);
  console.log(`Description: ${info.blogDescription}`);
}

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
import { InkwellBlogSDK } from '@inkwell.ar/sdk';
import Arweave from 'arweave';

const arweave = Arweave.init();

// Load or generate wallet (automatically saves to wallet.json)
let wallet: any;
const walletPath = 'wallet.json';

try {
  const fs = require('fs');
  if (fs.existsSync(walletPath)) {
    console.log('Loading existing wallet...');
    const walletData = fs.readFileSync(walletPath, 'utf8');
    wallet = JSON.parse(walletData);
  } else {
    console.log('Generating new wallet...');
    wallet = await arweave.wallets.generate();
    fs.writeFileSync(walletPath, JSON.stringify(wallet, null, 2));
    console.log('Wallet saved to wallet.json');
  }
} catch (error) {
  console.log('Generating new wallet due to error...');
  wallet = await arweave.wallets.generate();
}

const blogSDK = new InkwellBlogSDK({
  processId: 'your-process-id',
  wallet: wallet
});
```

// Set blog details (requires Admin role)
const blogDetailsResponse = await blogSDK.setBlogDetails({
  data: {
    title: 'My Personal Blog',
    description: 'A blog about technology and life',
    logo: 'https://example.com/logo.png'
  },
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
  },
  wallet: wallet
});
```

### Error Handling
```typescript
try {
  const response = await blogSDK.createPost({
    data: invalidData,
    wallet: wallet
  });
  
  if (!response.success) {
    console.error('Operation failed:', response.data);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Wallet Management

### Node.js Environment
The SDK examples automatically handle wallet management:

- **Default wallet file**: `wallet.json` in the project root
- **Auto-generation**: If no wallet exists, a new one is generated and saved
- **Persistence**: Wallet is saved to file for future use
- **Error handling**: Falls back to generating a new wallet if file operations fail

**⚠️ Security Note**: The `wallet.json` file contains your private keys. Keep it secure and never commit it to version control.

### Browser Environment
In browser environments, the SDK supports automatic browser wallet detection:

```typescript
// No wallet needed - SDK will use browser wallet automatically
const response = await blogSDK.createPost({
  data: {
    title: 'My Post',
    description: 'Post description',
    body: 'Post content...',
    published_at: Date.now(),
    last_update: Date.now(),
    authors: ['@myhandle']
  }
  // wallet parameter is optional in browser
});
```

**Browser Wallet Support**: The SDK automatically detects and uses `globalThis.arweaveWallet` if available, making wallet management seamless in browser applications.

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

## Message Result Retrieval

The SDK automatically attempts to retrieve the actual result of message operations:

1. **Message Sent**: First, the message is sent to the AO process
2. **Result Retrieval**: The SDK then attempts to get the result using the message ID
3. **Fallback**: If result retrieval fails, a success message with the message ID is returned

This provides the best of both worlds:
- **Immediate feedback**: You know the message was sent successfully
- **Actual data**: When possible, you get the parsed result from the process
- **Graceful degradation**: If result retrieval fails, you still get confirmation

### Return Types

Write operations can return either the actual data or a success message:

```typescript
// createPost and updatePost can return:
type CreatePostResponse = ApiResponse<BlogPost | string>;

// addEditors, removeEditors, addAdmins, removeAdmins can return:
type RoleResponse = ApiResponse<RoleUpdateResult[] | string>;

// setBlogDetails can return:
type BlogDetailsResponse = ApiResponse<BlogDetails | string>;

// deletePost always returns:
type DeleteResponse = ApiResponse<string>;
```

### Handling Dual Return Types

```typescript
const response = await blogSDK.createPost({ data: postData });

if (response.success) {
  if (typeof response.data === 'object' && response.data !== null) {
    // Got the actual post data
    const post = response.data as BlogPost;
    console.log(`Post ID: ${post.id}`);
    console.log(`Title: ${post.title}`);
  } else {
    // Got a success message
    console.log(`Message: ${response.data}`);
  }
}
```

## Error Handling

The SDK provides comprehensive error handling:

1. **Validation Errors**: Invalid input data
2. **Permission Errors**: Insufficient role permissions
3. **Network Errors**: Connection issues with AO
4. **Process Errors**: Errors from the AO process itself
5. **Wallet Errors**: Missing or invalid wallet configuration

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

### Publishing to npm

Before publishing, make sure to:

1. **Build the package:**
   ```bash
   npm run build
   ```

2. **Test the build:**
   ```bash
   npm test
   ```

3. **Check package contents:**
   ```bash
   npm pack --dry-run
   ```

4. **Publish to npm:**
   ```bash
   npm publish
   ```

The `prepublishOnly` script will automatically run the build before publishing.

## Package Contents

The npm package includes:
- **Compiled TypeScript** - Ready-to-use JavaScript files in `dist/`
- **Type Definitions** - Full TypeScript support with `.d.ts` files
- **Lua Process Files** - The `lua-process/` directory with your AO process files
- **Documentation** - This README file

The package excludes:
- Source TypeScript files (`src/`)
- Examples and tests
- Development configuration files
- Build artifacts

## License

MIT

## Author

[@7i7o](https://github.com/7i7o) 