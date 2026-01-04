# QIE Browser Extension Integration Guide

## Overview
The application now supports connecting to the **QIE Wallet Browser Extension** instead of generating mock wallets. When you click "Connect Wallet", it will automatically detect and connect to your installed QIE extension.

## What Changed

### ✅ Browser Extension Detection
The wallet service now:
1. **Detects QIE Extension**: Checks for `window.qie` provider
2. **Falls back to Ethereum Provider**: Checks for `window.ethereum` if QIE uses standard interface
3. **Uses RPC as fallback**: If no extension is detected, falls back to mock wallet generation

### ✅ Real Wallet Connection
- Connects to your actual QIE wallet extension
- Retrieves your real wallet address and balance
- Uses the extension's signer for transactions
- Supports all extension features (network switching, token management)

## How to Connect

### Step 1: Install QIE Wallet Extension
1. Ensure you have the QIE Wallet browser extension installed
2. The extension should be active and unlocked

### Step 2: Connect to Your Application
1. Open your application at `http://localhost:3000`
2. Click "Connect Wallet" button
3. Select any wallet type (the extension will be used automatically if detected)
4. Click "Connect"

### Step 3: Approve Connection in Extension
1. The QIE extension popup will appear
2. Review the connection request
3. Click "Connect" or "Approve" in the extension
4. Your wallet will be connected!

## What You'll See

### In Browser Console
```
🔗 QIE Wallet Service Initialized:
   Network: mainnet
   RPC URL: https://rpc-main1.qiblockchain.online/
   Chain ID: 5656
   Using QIE MAINNET ✅

🔌 QIE Extension detected!
🔗 Connecting to QIE Extension Wallet...
✅ Connected to QIE Extension: 0x1234...5678
🔍 Fetching wallet info for: 0x1234...5678
🌐 Using provider type: Extension
✅ Balance retrieved: 1.234 QIE
```

### In Your Application
- ✅ Wallet address from your extension
- ✅ Real balance from QIE blockchain
- ✅ Network information
- ✅ Success notification

## Extension Detection Logic

The service checks for providers in this order:

### 1. QIE Extension (`window.qie`)
```typescript
if (window.qie) {
  // Use QIE extension provider
  this.provider = new ethers.BrowserProvider(window.qie);
  this.isExtensionWallet = true;
}
```

### 2. Ethereum Provider (`window.ethereum`)
```typescript
else if (window.ethereum) {
  // Use Ethereum-compatible provider
  this.provider = new ethers.BrowserProvider(window.ethereum);
  this.isExtensionWallet = true;
}
```

### 3. RPC Fallback
```typescript
else {
  // No extension detected, use RPC
  this.provider = new ethers.JsonRpcProvider(rpcUrl);
  this.isExtensionWallet = false;
}
```

## Features Supported

### ✅ Wallet Connection
- Automatic extension detection
- Account access request
- Real wallet address retrieval

### ✅ Balance Queries
- Real-time balance from blockchain
- Network information
- Chain ID verification

### ✅ Transaction Signing
- Transactions are signed by the extension
- User approval required for each transaction
- Gas estimation from extension

### ✅ Network Management
- Switch networks via extension
- Verify correct network connection
- Handle network mismatch

### ✅ Token Management
- Add custom tokens to extension
- View token balances
- Manage token list

## Troubleshooting

### Issue: "No extension detected"

**Symptoms:**
- Console shows: `📡 No extension detected, using RPC provider`
- Mock wallet is generated instead of using extension

**Solutions:**

1. **Verify Extension is Installed:**
   - Check your browser extensions
   - Look for "QIE Wallet" or similar
   - Ensure it's enabled

2. **Check Extension is Unlocked:**
   - Open the extension
   - Enter your password if locked
   - Ensure it's ready to use

3. **Refresh the Page:**
   - Extensions load after page load sometimes
   - Hard refresh (Ctrl+Shift+R)
   - Try again

4. **Check Browser Console:**
   ```javascript
   // Open DevTools console and type:
   console.log('QIE:', window.qie);
   console.log('Ethereum:', window.ethereum);
   ```
   - If both are `undefined`, extension is not injecting providers

### Issue: "Connection request not appearing"

**Symptoms:**
- Click "Connect" but no popup appears
- No error message shown

**Solutions:**

1. **Check Popup Blockers:**
   - Disable popup blockers for localhost
   - Allow popups from your application

2. **Extension Permissions:**
   - Check extension has permission to access the site
   - Grant necessary permissions

3. **Try Manual Connection:**
   - Open extension manually
   - Look for "Connect to Site" option
   - Approve the connection

### Issue: "Wrong network connected"

**Symptoms:**
- Extension shows different network than expected
- Chain ID mismatch error

**Solutions:**

1. **Switch Network in Extension:**
   - Open QIE extension
   - Switch to QIE Mainnet (Chain ID: 5656)
   - Or QIE Testnet (Chain ID: 1983)

2. **Update Environment Variables:**
   ```env
   NEXT_PUBLIC_QIE_NETWORK=mainnet
   NEXT_PUBLIC_QIE_CHAIN_ID=5656
   ```

3. **Use Network Switcher:**
   - Application can request network switch
   - Extension will prompt for approval

### Issue: "Balance shows as 0"

**Symptoms:**
- Wallet connects successfully
- Balance shows "0" or "0.00"

**Solutions:**

This is **NORMAL** if your wallet has no QIE tokens. To get tokens:

1. **Transfer from another wallet**
2. **Use a QIE faucet** (if available)
3. **Purchase QIE tokens** (if on mainnet)

## Extension Provider API

The QIE extension should support these standard methods:

### Account Access
```javascript
await window.qie.request({
  method: 'eth_requestAccounts'
});
```

### Network Switching
```javascript
await window.qie.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x1618' }] // 5656 in hex
});
```

### Add Token
```javascript
await window.qie.request({
  method: 'wallet_watchAsset',
  params: {
    type: 'ERC20',
    options: {
      address: tokenAddress,
      symbol: symbol,
      decimals: decimals,
      image: imageUrl
    }
  }
});
```

### Send Transaction
```javascript
await signer.sendTransaction({
  to: recipientAddress,
  value: ethers.parseEther(amount),
  data: data
});
```

## Testing Without Extension

If you don't have the extension installed, the application will:

1. **Detect no extension**
2. **Log warning**: `⚠️ QIE Extension not detected, generating mock wallet`
3. **Generate mock wallet** for testing
4. **Use RPC provider** for blockchain interaction

This allows development and testing without requiring the extension.

## Security Considerations

### ✅ Extension Benefits
- Private keys never leave the extension
- User approval required for all transactions
- Secure key storage by extension
- No private key exposure to application

### ⚠️ Important Notes
- Always verify the extension is legitimate
- Check extension permissions before approving
- Never share your seed phrase
- Keep extension updated

## Next Steps

1. **Install QIE Extension** (if not already installed)
2. **Unlock your wallet** in the extension
3. **Refresh the application** page
4. **Click "Connect Wallet"**
5. **Approve connection** in extension popup
6. **Start using** your real QIE wallet!

## Support

### Extension Not Working?
1. Check browser console for errors
2. Verify extension is installed and active
3. Try refreshing the page
4. Check extension documentation

### Need Help?
- Review browser console logs
- Check extension popup for messages
- Verify network configuration
- Contact QIE support for extension issues

## Summary

✅ **Extension Support Added**: Application now detects and connects to QIE browser extension  
✅ **Real Wallet Connection**: Uses your actual wallet address and balance  
✅ **Transaction Signing**: All transactions signed by extension  
✅ **Fallback Support**: Works with or without extension installed  

The application is now ready to connect to your real QIE wallet! 🎉
