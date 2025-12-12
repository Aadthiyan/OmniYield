require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  const rpc = process.env.QIE_RPC_URL;
  if (!rpc) {
    console.error('QIE_RPC_URL not set in .env. Set it or supply as env var before running.');
    process.exit(1);
  }

  const funderKey = process.env.FUND_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!funderKey) {
    console.error('FUND_PRIVATE_KEY or PRIVATE_KEY not set in .env. This script needs a funded account to send from.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/fund_wallet.js <recipientAddress> [amountInEther]');
    process.exit(1);
  }

  const recipient = args[0];
  const amount = args[1] || '0.1'; // default 0.1 native token

  const provider = new ethers.JsonRpcProvider(rpc);
  const funder = new ethers.Wallet(funderKey, provider);

  console.log('Funder address:', funder.address);
  const funderBalance = await provider.getBalance(funder.address);
  console.log('Funder balance (wei):', funderBalance.toString());
  console.log('Funder balance (ETH):', ethers.formatEther(funderBalance));

  const tx = await funder.sendTransaction({
    to: recipient,
    value: ethers.parseEther(amount)
  });

  console.log('Transaction sent. Hash:', tx.hash);
  console.log('Waiting for confirmation...');
  const receipt = await tx.wait();
  console.log('Transaction confirmed in block', receipt.blockNumber);
  console.log('Gas used:', receipt.gasUsed.toString());
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exitCode = 1;
});
