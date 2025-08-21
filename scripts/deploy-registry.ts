import { deployContract } from 'ao-deploy';
import { readFileSync } from 'fs';
import { join } from 'path';
import { loadOrGenerateWallet } from '../src/examples/utils/wallet';

async function deployRegistry() {
  try {
    console.log('🚀 Deploying Blog Registry...');

    // Load or generate wallet
    const walletPath = process.argv[2] || 'wallet.json';
    const { wallet, walletAddress } = await loadOrGenerateWallet(walletPath);
    console.log(`👤 Wallet address: ${walletAddress}\n`);

    // Read the registry Lua file
    const registryPath = join(__dirname, '../lua-process/blog_registry.lua');

    console.log('📄 Registry source loaded');

    const defaultOptions = {
      name: 'Inkwell-Blog-Registry',
      contractPath: registryPath,
      luaPath: './lua-process/?.lua',
      tags: [
        { name: 'App-Name', value: 'Inkwell-Blog-Registry' },
        { name: 'App-Version', value: '1.0.0' },
        { name: 'Name', value: 'Inkwell Blog Registry' },
        { name: 'Author', value: '@7i7o' },
        { name: 'Version', value: '1.0.0' },
      ],
      retry: {
        count: 10,
        delay: 3000,
      },
      minify: true,
      onBoot: false,
      silent: false,
      forceSpawn: false,
    };

    // Deploy the registry process using ao-deploy
    const result = await deployContract({
      ...defaultOptions,
      wallet: wallet,
    });

    console.log('✅ Registry deployed successfully!');
    console.log('📋 Process ID:', result.processId);
    console.log('📋 Message ID:', result.messageId);

    // Output the process ID in a format that can be easily copied
    console.log('\n🔗 Registry Process ID (copy this):');
    console.log('='.repeat(50));
    console.log(result.processId);
    console.log('='.repeat(50));

    // Test the registry deployment
    console.log('\n🧪 Testing registry deployment...');

    const { connect } = require('@permaweb/aoconnect');
    const aoconnect = connect({ MODE: 'legacy' });

    const testResult = await aoconnect.dryrun({
      Target: result.processId,
      Action: 'Info',
    });

    if (testResult.Messages && testResult.Messages.length > 0) {
      const response = JSON.parse(testResult.Messages[0].Data);
      if (response.success) {
        console.log('✅ Registry test successful!');
        console.log('📊 Registry stats:', response.data);
      } else {
        console.log('❌ Registry test failed:', response.data);
      }
    } else {
      console.log('❌ No response from registry test');
    }

    // Generate configuration snippet
    console.log('\n📝 Configuration snippet for SDK:');
    console.log('='.repeat(50));
    console.log(`// Add this to your SDK configuration
export const BLOG_REGISTRY_PROCESS_ID = '${result.processId}';
`);
    console.log('='.repeat(50));

    // Save to a config file
    const configContent = `// Auto-generated registry configuration
// Generated on: ${new Date().toISOString()}
// Process ID: ${result.processId}
// Message ID: ${result.messageId}

export const BLOG_REGISTRY_PROCESS_ID = '${result.processId}';

// Registry configuration
export const REGISTRY_CONFIG = {
  processId: '${result.processId}',
  name: 'Inkwell Blog Registry',
  version: '1.0.0',
  deployedAt: '${new Date().toISOString()}'
};
`;

    const configPath = join(__dirname, '../src/config/registry.ts');
    const fs = require('fs');
    const path = require('path');

    // Ensure config directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, configContent);
    console.log(`\n💾 Configuration saved to: ${configPath}`);

    return {
      processId: result.processId,
      messageId: result.messageId,
      configPath,
    };
  } catch (error) {
    console.error('❌ Failed to deploy registry:', error);
    throw error;
  }
}

// Run the deployment if this script is executed directly
if (require.main === module) {
  deployRegistry()
    .then((result) => {
      console.log('\n🎉 Registry deployment completed successfully!');
      console.log('📋 Summary:');
      console.log(`   Process ID: ${result.processId}`);
      console.log(`   Config file: ${result.configPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Registry deployment failed:', error);
      process.exit(1);
    });
}

export { deployRegistry };
