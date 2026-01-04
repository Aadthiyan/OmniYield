# Wallet Connection Troubleshooting Guide

## Issue Summary
You're experiencing wallet connection issues because:
1. **Backend server has shut down** (Gunicorn workers terminated)
2. **Frontend cannot connect to the wallet** without proper configuration
3. **Environment variables may not be properly set**

## Quick Fix Steps

### Step 1: Verify Environment Configuration

#### Frontend Environment Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Check if `.env.local` exists:
   ```bash
   ls .env.local
   ```

3. If it doesn't exist, create it from the example:
   ```bash
   cp .env.example .env.local
   ```

4. Verify the `.env.local` file contains:
   ```env
   # API URL for backend
   NEXT_PUBLIC_API_URL=http://localhost:8000

   # QIE Wallet Configuration (Official Mainnet)
   NEXT_PUBLIC_QIE_NETWORK=mainnet
   NEXT_PUBLIC_QIE_RPC_URL=https://rpc-main1.qiblockchain.online/
   NEXT_PUBLIC_QIE_CHAIN_ID=5656
   ```

#### Backend Environment Setup
1. Navigate to the backend directory:
   ```bash
   cd ../backend
   ```

2. Check if `.env` exists in the root directory:
   ```bash
   cd ..
   ls .env
   ```

3. Verify it has the necessary database and Redis configurations

### Step 2: Restart Backend Server

#### Option A: Using Uvicorn (Development)
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Option B: Using Gunicorn (Production-like)
```bash
cd backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Step 3: Restart Frontend Server

1. Open a new terminal
2. Navigate to frontend:
   ```bash
   cd frontend
   ```

3. Install dependencies (if needed):
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Step 4: Test Wallet Connection

1. Open your browser to `http://localhost:3000`
2. Click "Connect Wallet"
3. Select "Private Key" or "Mnemonic Phrase"
4. Click "Connect"

## Common Issues and Solutions

### Issue 1: "Failed to connect wallet"

**Symptoms:**
- Error message when clicking "Connect"
- Console shows network errors

**Solutions:**
1. **Check RPC URL accessibility:**
   ```bash
   curl https://rpc-main1.qiblockchain.online/
   ```

2. **Verify environment variables are loaded:**
   - Open browser console
   - Type: `console.log(process.env.NEXT_PUBLIC_QIE_RPC_URL)`
   - Should show: `https://rpc-main1.qiblockchain.online/`

3. **Restart frontend server** after changing `.env.local`:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Issue 2: "Backend connection refused"

**Symptoms:**
- API calls fail
- Network errors in console
- Cannot fetch yield data

**Solutions:**
1. **Verify backend is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check backend logs** for errors

3. **Verify CORS settings** in `backend/app/main.py`

4. **Check firewall settings** (Windows Defender might block port 8000)

### Issue 3: "Wallet balance shows 0"

**Symptoms:**
- Wallet connects successfully
- Balance shows as "0" or "0.00"

**Solutions:**
This is **NORMAL** for a newly generated wallet. To get test tokens:

1. **Use QIE Testnet Faucet** (if available)
2. **Transfer tokens** from another wallet
3. **For development**, you can use the wallet address to request tokens

### Issue 4: "Environment variables not loading"

**Symptoms:**
- `undefined` when checking env vars
- Default values being used

**Solutions:**
1. **Ensure `.env.local` is in the `frontend` directory** (not root)

2. **Verify variable names** start with `NEXT_PUBLIC_`:
   ```env
   NEXT_PUBLIC_QIE_RPC_URL=https://rpc-main1.qiblockchain.online/
   ```

3. **Restart the Next.js dev server** (environment variables are loaded at startup)

4. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Issue 5: "TypeError: Cannot read properties of null"

**Symptoms:**
- JavaScript errors in console
- Wallet service fails to initialize

**Solutions:**
1. **Check browser console** for specific error details

2. **Verify ethers.js is installed**:
   ```bash
   npm list ethers
   ```

3. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Network Configuration

### QIE Mainnet (Default)
- **Network**: mainnet
- **RPC URL**: https://rpc-main1.qiblockchain.online/
- **Chain ID**: 5656
- **Gas Fees**: Near-zero (suitable for development)

### QIE Testnet (Alternative)
- **Network**: testnet
- **RPC URL**: https://rpc1testnet.qie.digital
- **Chain ID**: 1983

To switch to testnet, update `.env.local`:
```env
NEXT_PUBLIC_QIE_NETWORK=testnet
NEXT_PUBLIC_QIE_RPC_URL=https://rpc1testnet.qie.digital
NEXT_PUBLIC_QIE_CHAIN_ID=1983
```

## Debugging Tips

### 1. Enable Verbose Logging

Add to `qieWalletService.ts` (line 200):
```typescript
console.log('🔗 QIE Wallet Service Initialized:');
console.log(`   Network: ${config.network}`);
console.log(`   RPC URL: ${config.rpcUrl}`);
console.log(`   Chain ID: ${config.chainId}`);
```

### 2. Check Browser Console

Open Developer Tools (F12) and check:
- **Console tab**: For JavaScript errors
- **Network tab**: For failed API calls
- **Application tab**: For localStorage/sessionStorage issues

### 3. Test RPC Connection

Create a test script `test-rpc.js`:
```javascript
const { ethers } = require('ethers');

async function testRPC() {
  const provider = new ethers.JsonRpcProvider('https://rpc-main1.qiblockchain.online/');
  try {
    const network = await provider.getNetwork();
    console.log('✅ Connected to network:', network);
    
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Current block:', blockNumber);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testRPC();
```

Run it:
```bash
node test-rpc.js
```

### 4. Verify Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "database": "healthy",
  "redis": "healthy"
}
```

## Security Considerations

⚠️ **IMPORTANT**: 
- Never commit `.env.local` to version control
- Never share private keys or mnemonics
- Use environment variables for sensitive data
- In production, use proper wallet management solutions

## Next Steps After Connection

Once wallet is connected:
1. **Verify wallet address** is displayed correctly
2. **Check balance** (may be 0 for new wallets)
3. **Test yield opportunities** fetching
4. **Try depositing** (if you have tokens)

## Getting Help

If issues persist:
1. **Check browser console** for detailed error messages
2. **Review backend logs** for API errors
3. **Verify network connectivity** to QIE RPC
4. **Check QIE blockchain status** (network might be down)
5. **Review the QIE documentation** for network-specific issues

## Contact Support

For QIE-specific issues:
- QIE Documentation: [Check official docs]
- QIE Support: [Contact QIE team]
- Network Status: [Check QIE status page]
