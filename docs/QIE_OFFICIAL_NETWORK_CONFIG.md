# QIE Blockchain - Official Network Configuration

## ✅ **OFFICIAL QIE NETWORK INFORMATION**

Based on official QIE documentation from https://docs.qie.digital/ and https://www.qie.digital/

---

## 🟢 **QIE MAINNET** (Production)

### Network Details:
- **Network Name**: QIE Blockchain
- **Chain ID**: `5656` (0x1618)
- **Native Token**: QIE
- **Block Explorer**: https://mainnet.qiblockchain.online

### RPC Endpoints:
- **Primary**: `https://rpc-main1.qiblockchain.online/`
- **Secondary**: `https://rpc-main2.qiblockchain.online/`
- **Alternative**: `https://5656.rpc.thirdweb.com`

### Key Features:
- ✅ EVM Compatible
- ✅ Up to 25,000 TPS (Transactions Per Second)
- ✅ Near-zero gas fees
- ✅ Fast transaction finality
- ✅ Delegated Proof of Stake (dPoS)
- ✅ Supports both EVM and Cosmos ecosystems

---

## 🔵 **QIE TESTNET** (Development)

### Important Note:
The official QIE documentation **does not clearly specify a separate testnet** with distinct Chain ID and RPC endpoints. 

### Possible Scenarios:

#### Option 1: No Separate Testnet
QIE may not have a traditional separate testnet. Developers might use:
- **Local development networks** (Hardhat, Ganache)
- **QIE Mainnet with test transactions** (since fees are near-zero)

#### Option 2: Testnet Exists but Not Publicly Documented
Some blockchains have testnets that are:
- Only available to validators
- Accessible through private channels
- Not yet publicly launched

---

## 🎯 **RECOMMENDED CONFIGURATION**

### For Your Application:

Since the official documentation doesn't specify a testnet, I recommend:

### **Development Environment** (Use Mainnet with Caution):
```env
# QIE Mainnet Configuration
NEXT_PUBLIC_QIE_NETWORK=mainnet
NEXT_PUBLIC_QIE_RPC_URL=https://rpc-main1.qiblockchain.online/
NEXT_PUBLIC_QIE_CHAIN_ID=5656
```

**⚠️ Important**: 
- QIE has **near-zero gas fees**, so using mainnet for development is feasible
- Create a **separate development wallet** with minimal funds
- Never use production wallets for testing

### **Alternative: Local Development**:
```env
# Local Hardhat/Ganache Network
NEXT_PUBLIC_QIE_NETWORK=localhost
NEXT_PUBLIC_QIE_RPC_URL=http://localhost:8545
NEXT_PUBLIC_QIE_CHAIN_ID=31337
```

---

## 📋 **UPDATED .env.local FILE**

Replace your current configuration with:

```env
# Frontend Environment Configuration

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# QIE Blockchain Configuration - MAINNET
NEXT_PUBLIC_QIE_NETWORK=mainnet
NEXT_PUBLIC_QIE_RPC_URL=https://rpc-main1.qiblockchain.online/
NEXT_PUBLIC_QIE_CHAIN_ID=5656

# Blockchain Configuration
NEXT_PUBLIC_INFURA_KEY=31e4e2d5e05448eab438c812bb50fc5f
NEXT_PUBLIC_ALCHEMY_KEY=RTdmzmXcuNJaSpn7FJLEo
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=f4fd0b5b524597a78d80b8e057ea762d

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aW5maW5pdGUtYWFyZHZhcmstNDkuY2xlcmsuYWNjb3VudHMuZGV2JA
```

---

## 🔍 **How to Verify**

After updating your `.env.local` and restarting the dev server, check the browser console:

```
🔗 QIE Wallet Service Initialized:
   Network: mainnet
   RPC URL: https://rpc-main1.qiblockchain.online/
   Chain ID: 5656
   Using QIE MAINNET
```

---

## 🛡️ **Security Best Practices for Mainnet Development**

Since you'll be using mainnet:

1. **Use a Development Wallet**:
   - Create a new wallet specifically for development
   - Fund it with minimal QIE tokens
   - Never use your production/investment wallet

2. **Test Thoroughly**:
   - Test all transactions carefully
   - Double-check addresses before sending
   - Start with very small amounts

3. **Monitor Gas Fees**:
   - QIE has near-zero fees, but still monitor costs
   - Set reasonable gas limits

4. **Use Version Control Wisely**:
   - Never commit private keys
   - Use `.env.local` (gitignored)
   - Keep sensitive data secure

---

## 📚 **QIE Blockchain Resources**

- **Official Website**: https://www.qie.digital/
- **Documentation**: https://docs.qie.digital/
- **Block Explorer**: https://mainnet.qiblockchain.online
- **Developer Docs**: https://docs.qie.digital/developer-docs

---

## 🤔 **About the Previous "Testnet" Configuration**

The previous configuration with:
- Chain ID: 1983
- RPC: https://rpc1testnet.qie.digital

**Was likely incorrect** or based on outdated information. The official QIE documentation does not reference these values.

---

## ✅ **Next Steps**

1. **Update your `.env.local`** with the mainnet configuration above
2. **Restart your development server**:
   ```bash
   npm run dev
   ```
3. **Create a new development wallet** with minimal funds
4. **Test the wallet connection**
5. **Verify you're connected to QIE Mainnet** (Chain ID: 5656)

---

## 💡 **Need a Testnet?**

If you absolutely need a testnet environment:

1. **Contact QIE Support**: Ask about testnet availability
2. **Use Local Network**: Set up Hardhat/Ganache locally
3. **Fork Mainnet**: Use Hardhat to fork QIE mainnet locally

---

## 📞 **Support**

For official information about QIE testnet:
- Check QIE Discord/Telegram community
- Contact QIE support team
- Review latest documentation updates
