# QIE Wallet Integration Guide

## Overview
The application now connects to the **QIE Wallet** instead of using mock wallet data. When you click "Connect Wallet", it will establish a real connection to the QIE blockchain network.

## Changes Made

### 1. Updated `useWallet.ts` Hook
- **Before**: Used mock wallet data with a hardcoded address
- **After**: Connects to actual QIE wallet using `qieWalletService`
- The hook now calls `qieWalletService.connectWallet()` and retrieves real wallet information

### 2. Updated `qieWalletService.ts`
- Configured to use QIE Testnet RPC URL: `https://rpc1testnet.qie.digital`
- Chain ID set to: `1983` (QIE Testnet)
- Supports environment variable configuration for flexibility

### 3. Updated `ConnectWalletModal.tsx`
- Modal now clearly states "Connect QIE Wallet"
- Updated description to reflect QIE wallet integration

### 4. Created Frontend Environment Configuration
- Created `.env.example` file with QIE configuration
- Includes QIE RPC URL, Chain ID, and network settings

## Environment Setup

### For Development

1. **Copy the environment example file:**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **The `.env.local` file should contain:**
   ```env
   # API URL for backend
   NEXT_PUBLIC_API_URL=http://localhost:8000

   # QIE Wallet Configuration
   NEXT_PUBLIC_QIE_NETWORK=testnet
   NEXT_PUBLIC_QIE_RPC_URL=https://rpc1testnet.qie.digital
   NEXT_PUBLIC_QIE_CHAIN_ID=1983
   ```

3. **Restart your development server** to load the new environment variables:
   ```bash
   npm run dev
   ```

### For Production

Set the following environment variables in your deployment platform (Vercel, Netlify, etc.):

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_QIE_NETWORK=testnet
NEXT_PUBLIC_QIE_RPC_URL=https://rpc1testnet.qie.digital
NEXT_PUBLIC_QIE_CHAIN_ID=1983
```

## How It Works

### Connection Flow

1. User clicks "Connect Wallet" button
2. `ConnectWalletModal` opens with wallet type options:
   - **Private Key**: Connect using a private key
   - **Mnemonic Phrase**: Connect using a 12-word seed phrase
   - **Hardware Wallet**: (Coming soon)

3. User selects a wallet type and clicks "Connect"
4. The `useWallet` hook calls `qieWalletService.connectWallet(type)`
5. The service:
   - Initializes connection to QIE testnet
   - Creates/imports wallet based on selected type
   - Retrieves wallet balance and information
   - Returns wallet details to the application

6. Wallet information is stored in the global state
7. User sees success notification with wallet address

### Wallet Types

#### Private Key
- Generates a new random wallet with a private key
- **Note**: In production, you'd import an existing private key

#### Mnemonic Phrase
- Generates a new wallet with a 12-word mnemonic phrase
- **Note**: In production, you'd import an existing mnemonic

#### Hardware Wallet
- Currently not implemented
- Will support Ledger/Trezor integration in the future

## Testing the Integration

### Quick Test

1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open the application in your browser
3. Click "Connect Wallet"
4. Select "Private Key" or "Mnemonic Phrase"
5. Click "Connect"
6. You should see:
   - A success notification
   - Your wallet address displayed
   - Your wallet balance (from QIE testnet)

### Expected Behavior

- **Network**: QIE Testnet
- **Chain ID**: 1983
- **RPC URL**: https://rpc1testnet.qie.digital
- **Wallet Address**: Randomly generated (or imported)
- **Balance**: Retrieved from QIE testnet

## Troubleshooting

### Issue: "Failed to connect wallet"
**Solution**: 
- Check that `.env.local` file exists in the `frontend` directory
- Verify the QIE RPC URL is accessible
- Restart the development server

### Issue: "Wallet not connected"
**Solution**:
- Ensure you clicked "Connect" in the modal
- Check browser console for errors
- Verify environment variables are loaded

### Issue: Balance shows as "0"
**Solution**:
- This is normal for a newly generated wallet
- You need to fund the wallet with testnet tokens
- Use a QIE testnet faucet to get test tokens

## Next Steps

### For Production Use

1. **Implement Private Key Import**: Allow users to import their existing private keys
2. **Add Mnemonic Import**: Allow users to import their 12-word seed phrases
3. **Secure Storage**: Implement secure storage for wallet credentials
4. **Hardware Wallet Support**: Integrate Ledger/Trezor support
5. **Network Switching**: Allow users to switch between testnet and mainnet

### Security Considerations

⚠️ **Important Security Notes**:

- Never store private keys in plain text
- Never commit private keys to version control
- Use environment variables for sensitive data
- Consider using browser wallet extensions (MetaMask-like) for better security
- Implement proper encryption for stored credentials

## API Reference

### `qieWalletService.connectWallet(type)`
Connects to QIE wallet with specified type.

**Parameters:**
- `type`: `'privateKey' | 'mnemonic' | 'hardware'`

**Returns:** `Promise<QIEWallet>`

### `qieWalletService.getWalletInfo()`
Retrieves current wallet information.

**Returns:** `Promise<WalletInfo | null>`

### `qieWalletService.disconnectWallet()`
Disconnects the current wallet.

**Returns:** `Promise<void>`

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify environment configuration
3. Review the QIE blockchain documentation
4. Contact QIE support for network-specific issues
