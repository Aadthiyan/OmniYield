// Test QIE RPC Connection
const { ethers } = require('ethers');

async function testQIERPC() {
    console.log('🧪 Testing QIE RPC Connection...\n');

    const networks = [
        {
            name: 'QIE Mainnet',
            rpcUrl: 'https://rpc-main1.qiblockchain.online/',
            chainId: 5656
        },
        {
            name: 'QIE Testnet',
            rpcUrl: 'https://rpc1testnet.qie.digital',
            chainId: 1983
        }
    ];

    for (const network of networks) {
        console.log(`\n📡 Testing ${network.name}...`);
        console.log(`   RPC URL: ${network.rpcUrl}`);
        console.log(`   Chain ID: ${network.chainId}`);

        try {
            const provider = new ethers.JsonRpcProvider(network.rpcUrl);

            // Test 1: Get network info
            console.log('   ⏳ Fetching network info...');
            const networkInfo = await provider.getNetwork();
            console.log(`   ✅ Network ChainId: ${networkInfo.chainId}`);

            // Test 2: Get latest block
            console.log('   ⏳ Fetching latest block...');
            const blockNumber = await provider.getBlockNumber();
            console.log(`   ✅ Latest Block: ${blockNumber}`);

            // Test 3: Get gas price
            console.log('   ⏳ Fetching gas price...');
            const feeData = await provider.getFeeData();
            const gasPriceGwei = ethers.formatUnits(feeData.gasPrice || 0, 'gwei');
            console.log(`   ✅ Gas Price: ${gasPriceGwei} Gwei`);

            // Test 4: Generate a test wallet and check balance
            console.log('   ⏳ Testing wallet balance query...');
            const testWallet = ethers.Wallet.createRandom();
            const balance = await provider.getBalance(testWallet.address);
            console.log(`   ✅ Test wallet balance: ${ethers.formatEther(balance)} QIE`);
            console.log(`   ✅ Test wallet address: ${testWallet.address}`);

            console.log(`\n✅ ${network.name} is ACCESSIBLE and WORKING!`);

        } catch (error) {
            console.error(`\n❌ ${network.name} FAILED:`);
            console.error(`   Error: ${error.message}`);
            if (error.code) {
                console.error(`   Error Code: ${error.code}`);
            }
        }
    }

    console.log('\n\n🏁 RPC Connection Test Complete!\n');
}

// Run the test
testQIERPC().catch(console.error);
