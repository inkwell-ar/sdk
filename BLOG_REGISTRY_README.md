# Blog Registry System

A decentralized registry system for tracking wallet permissions across multiple Inkwell blogs. This system maintains a centralized index of which wallets can admin or edit which blogs, ensuring consistency and providing easy querying capabilities.

## Overview

The Blog Registry system consists of:

1. **Blog Registry Process** (`blog_registry.lua`) - A centralized AO process that maintains the permission mappings
2. **Enhanced Blog Process** (`inkwell_blog.lua`) - Modified blog process with automatic registry synchronization
3. **TypeScript SDK** (`blog-registry-sdk.ts`) - Client library for interacting with the registry

## Features

- **Centralized Permission Tracking**: Maintains a registry of all wallet-blog permission relationships
- **Automatic Synchronization**: Blog processes automatically sync permission changes with the registry
- **Bidirectional Mapping**: Supports both wallet→blog and blog→wallet queries
- **Role-based Permissions**: Tracks `DEFAULT_ADMIN_ROLE` and `EDITOR_ROLE` permissions
- **Security-First Design**: Only blog processes can modify their own permissions using `msg.From`
- **Read-Only SDK**: TypeScript SDK provides read-only access for security
- **Statistics**: Provides registry-wide statistics and analytics
- **TypeScript SDK**: Full TypeScript support with type safety

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Blog Process  │    │  Blog Registry  │    │  TypeScript SDK │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │AccessControl│ │    │ │wallet_blogs │ │    │ │BlogRegistry │ │
│ │             │ │    │ │             │ │    │ │SDK          │ │
│ │ ┌─────────┐ │ │    │ │ ┌─────────┐ │ │    │ │             │ │
│ │ │DEFAULT  │ │ │    │ │ │wallet1  │ │ │    │ │ ┌─────────┐ │ │
│ │ │ADMIN    │ │ │    │ │ │├─blog1  │ │ │    │ │ │register │ │ │
│ │ │EDITOR   │ │ │    │ │ │├─blog2  │ │ │    │ │ │getWallet│ │ │
│ │ └─────────┘ │ │    │ │ └─────────┘ │ │    │ │ │checkRole│ │ │
│ └─────────────┘ │    │ │ ┌─────────┐ │ │    │ │ └─────────┘ │ │
│                 │    │ │ │blog1    │ │ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ │ │├─wallet1│ │ │    └─────────────────┘
│ │Registry Sync│ │    │ │ │├─wallet2│ │ │
│ │             │ │    │ │ └─────────┘ │ │
│ │ ┌─────────┐ │ │    │ └─────────────┘ │
│ │ │sync     │ │ │    └─────────────────┘
│ │ │remove   │ │ │
│ │ └─────────┘ │ │
│ └─────────────┘ │
└─────────────────┘
```

## Setup

### 1. Deploy the Blog Registry Process

Deploy the blog registry process using the provided script:

```bash
# Deploy the registry (requires wallet)
npm run deploy:registry [wallet-path]
```

This script will:
- Deploy the registry process to AO using ao-deploy
- Test the deployment with a dry run
- Save the process ID to `src/config/registry.ts`
- Output the process ID for verification
- Generate configuration files automatically

### 2. Deploy Blog Processes

Once the registry is deployed, you can deploy blog processes that will automatically use the registry:

```typescript
import { InkwellBlogSDK } from '@inkwell.ar/sdk';

// Deploy a new blog (automatically configured with registry)
const result = await InkwellBlogSDK.deploy({
  name: 'my-blog'
});

console.log('Blog deployed:', result.processId);
```

### 3. Use the Registry SDK

```typescript
import { BlogRegistrySDK } from '@inkwell.ar/sdk';

// Initialize with hardcoded registry process ID
const registry = new BlogRegistrySDK();

// Check permissions
const canEdit = await registry.canEditBlog('wallet-address', 'blog-process-id');
const canAdmin = await registry.canAdminBlog('wallet-address', 'blog-process-id');

// Get user's blogs
const userBlogs = await registry.getWalletBlogs('wallet-address');
const adminBlogs = await registry.getAdminBlogs('wallet-address');
const editableBlogs = await registry.getEditableBlogs('wallet-address');

// Get registry statistics
const stats = await registry.getRegistryStats();
```

## Usage Examples

### Basic Permission Queries

```typescript
// Get all blogs a wallet has access to
const blogs = await registry.getWalletBlogs('wallet_address');

// Check if a wallet can edit a specific blog
const canEdit = await registry.canEditBlog('wallet_address', 'blog_id');

// Check if a wallet can admin a specific blog
const canAdmin = await registry.canAdminBlog('wallet_address', 'blog_id');

// Check specific role
const hasEditorRole = await registry.checkWalletRole('wallet_address', 'blog_id', 'EDITOR_ROLE');
```

### User Dashboard

```typescript
// Get all blogs a user can admin
const adminBlogs = await registry.getAdminBlogs('wallet_address');

// Get all blogs a user can edit
const editableBlogs = await registry.getEditableBlogs('wallet_address');

// Display user's blog access
console.log(`Admin blogs: ${adminBlogs.length}`);
console.log(`Editable blogs: ${editableBlogs.length}`);
```

### User Dashboard

```typescript
// Get all blogs a user can admin
const adminBlogs = await registry.getAdminBlogs('wallet_address');

// Get all blogs a user can edit
const editableBlogs = await registry.getEditableBlogs('wallet_address');

// Display user's blog access
console.log(`Admin blogs: ${adminBlogs.length}`);
console.log(`Editable blogs: ${editableBlogs.length}`);
```

### Registry Statistics

```typescript
// Get registry statistics
const stats = await registry.getRegistryStats();
console.log(`Total wallets: ${stats.wallet_count}`);
console.log(`Total blogs: ${stats.blog_count}`);
console.log(`Total permissions: ${stats.total_permissions}`);
console.log(`Registry version: ${stats.version}`);
```

### Get Blog Wallets

```typescript
// Get all wallets with access to a specific blog
const wallets = await registry.getBlogWallets('blog_process_id');
wallets.forEach(wallet => {
  console.log(`Wallet: ${wallet.wallet}, Roles: ${wallet.roles.join(', ')}`);
});
```

## API Reference

### BlogRegistrySDK Methods

#### Read-Only Operations

- `getWalletBlogs(wallet)` - Get all blogs a wallet has access to
- `getBlogWallets(blogId)` - Get all wallets with access to a blog
- `checkWalletRole(wallet, blogId, role)` - Check specific role
- `canAdminBlog(wallet, blogId)` - Check admin permissions
- `canEditBlog(wallet, blogId)` - Check edit permissions
- `getAdminBlogs(wallet)` - Get admin-only blogs
- `getEditableBlogs(wallet)` - Get editable blogs
- `getRegistryStats()` - Get registry statistics

#### Note on Write Operations

Write operations (register, remove, update, bulk operations, sync) are only available to blog processes for security reasons. The registry uses `msg.From` as the blog ID to ensure only the actual blog process can modify its own permissions.

### Registry Process Actions

#### Public Actions (Read-Only)

- `Info` - Get registry information and statistics
- `Get-Wallet-Blogs` - Get blogs for a wallet
- `Get-Blog-Wallets` - Get wallets for a blog
- `Check-Wallet-Role` - Check specific role
- `Get-Registry-Stats` - Get statistics

#### Blog-Only Actions (Write Operations)

These actions can only be called by blog processes. The registry uses `msg.From` as the blog ID for security.

- `Register-Wallet-Permissions` - Register permissions (blog process only)
- `Remove-Wallet-Permissions` - Remove permissions (blog process only)
- `Update-Wallet-Roles` - Update roles (blog process only)
- `Bulk-Register-Permissions` - Bulk operations (blog process only)

### Blog Process Actions

#### New Actions

- `Sync-With-Registry` - Sync blog permissions with registry

## Data Structures

### BlogPermission

```typescript
interface BlogPermission {
  blog_id: string;
  roles: string[];
  last_updated: number;
}
```

### WalletPermission

```typescript
interface WalletPermission {
  wallet: string;
  roles: string[];
  last_updated: number;
}
```

### RegistryStats

```typescript
interface RegistryStats {
  version: string;
  wallet_count: number;
  blog_count: number;
  total_permissions: number;
}
```

## Security Considerations

1. **Permission Validation**: Always validate permissions on the blog process side
2. **Registry Trust**: The registry is for convenience and indexing, not primary authorization
3. **Blog-Only Write Access**: Only blog processes can modify their own permissions using `msg.From`
4. **Read-Only SDK**: The TypeScript SDK only provides read operations for security
5. **Role Validation**: Only valid roles (`DEFAULT_ADMIN_ROLE`, `EDITOR_ROLE`) are accepted
6. **Automatic Sync**: Blog processes automatically sync permission changes with the registry

## Best Practices

1. **Regular Sync**: Use the sync functionality to ensure registry consistency
2. **Permission Checks**: Always check permissions before performing actions
3. **Bulk Operations**: Use bulk operations for efficiency when managing multiple permissions
4. **Error Handling**: Implement proper error handling for network issues
5. **Caching**: Consider caching frequently accessed permission data

## Troubleshooting

### Common Issues

1. **Registry Not Found**: Ensure the registry process ID is correct
2. **Sync Failures**: Check network connectivity and process availability
3. **Permission Mismatches**: Use sync functionality to resolve inconsistencies
4. **Invalid Roles**: Ensure only valid role names are used

### Debugging

```typescript
// Get registry statistics to verify connectivity
const stats = await registry.getRegistryStats();
console.log('Registry stats:', stats);

// Check specific permissions
const hasRole = await registry.checkWalletRole('wallet', 'blog', 'EDITOR_ROLE');
console.log('Has role:', hasRole);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
