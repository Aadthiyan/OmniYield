require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

function toJsonSafe(obj) {
  return JSON.stringify(obj, null, 2);
}

async function main() {
  console.log('Creating a new random test wallet (for QIE testnet)');
  const wallet = ethers.Wallet.createRandom();

  console.log('\n--- WALLET ---');
  console.log('Address:', wallet.address);
  console.log('Private Key:', wallet.privateKey);
  if (wallet.mnemonic) {
    console.log('Mnemonic:', wallet.mnemonic.phrase);
  }

  // Optionally check balance on QIE if QIE_RPC_URL is provided
  const rpc = process.env.QIE_RPC_URL;
  if (rpc) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const balance = await provider.getBalance(wallet.address);
      console.log('Balance (wei):', balance.toString());
      try {
        const human = ethers.formatEther(balance);
        console.log('Balance (ETH):', human);
      } catch (e) {
        // ignore formatting issues
      }
    } catch (err) {
      console.log('Could not query QIE RPC at', rpc, '\nError:', err.message);
    }
  } else {
    console.log('\nNote: QIE_RPC_URL not set in .env — balance check skipped.');
  }

  // Save locally if --save <path> provided
  const args = process.argv.slice(2);
  const saveIndex = args.indexOf('--save');
  if (saveIndex !== -1 && args[saveIndex + 1]) {
    const outPath = args[saveIndex + 1];
    const payload = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic ? wallet.mnemonic.phrase : null,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(outPath, toJsonSafe(payload), { encoding: 'utf8', flag: 'w' });
    console.log('\nSaved wallet to', outPath, '\nMake sure this file is stored securely and NOT committed to git.');
  } else {
    console.log('\nTip: you can save this wallet to a file with `node scripts/create_test_wallet.js --save ./my-wallet.json`');
  }

  console.log('\nSecurity Reminder: Treat the private key and mnemonic like a password. Do NOT share them or commit them. Use a testnet/throwaway account for development.');
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exitCode = 1;
});
