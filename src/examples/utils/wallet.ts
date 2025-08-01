import Arweave from 'arweave';

const arweave = new Arweave({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

export async function loadOrGenerateWallet(walletPath: string = 'wallet.json') {
  // Load or generate wallet
  let wallet: any;

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
      console.warn(
        '⚠️  Could not save wallet to file:',
        saveError instanceof Error ? saveError.message : String(saveError)
      );
    }
  }
  const walletAddress = await arweave.wallets.getAddress(wallet);
  return { wallet, walletAddress };
}
