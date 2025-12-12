# YieldX - Authentication System

## 🔐 Overview

YieldX uses a robust **Email & Password** authentication system for user accounts. Wallet connection is treated as an optional "add-on" feature for users who want to interact with DeFi protocols.

## 📋 User Flow

### 1. **Public Landing Page** (`/landing`)
- The entry point for unauthenticated users.
- Features separate "Log In" and "Sign Up" buttons.
- No wallet connection required to browse or sign up.

### 2. **Authentication**
- **Sign Up** (`/signup`): Create an account with Name, Email, and Password.
- **Log In** (`/login`): Access account with Email and Password.
- **Session**: Managed via JWT tokens (stored in localStorage).

### 3. **Dashboard Access** (`/dashboard`)
- Only accessible after successful login.
- Access to:
  - Portfolio
  - Strategies
  - Settings
  - Security

### 4. **Wallet Connection (Optional)**
- Once logged in, users can connect their Web3 wallet (MetaMask, etc.) via the Header.
- Wallet connection enables:
  - Checking balances
  - Executing transactions
  - Bridge operations
- Wallet state is independent of the user account session.

## 🛡️ Route Protection

### Protected Routes
The `ProtectedRoute` component ensures only authenticated users can access the app.

- **Checks**: Presence of `user` object in Global Store.
- **Redirects**: 
  - If not logged in -> Redirect to `/login`
  - If logged in -> Allow access

## 📁 Key Files

- `src/app/login/page.tsx` - Login Form
- `src/app/signup/page.tsx` - Registration Form
- `src/hooks/useAuth.ts` - Auth logic (API calls, state updates)
- `src/hooks/useWallet.ts` - Wallet logic (Connect/Disconnect)
- `src/components/Auth/ProtectedRoute.tsx` - Route Guard
- `backend/app/routers/auth_routes.py` - Backend Auth API

## 🔧 Backend Implementation

- **Model**: `User` model with `email`, `password_hash`, `name`.
- **API**: 
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
- **Security**: 
  - Passwords hashed with bcrypt
  - JWT tokens for session validation

## 🚀 Future Enhancements

- **Email Verification**: Send verification emails on signup.
- **Password Reset**: Implement "Forgot Password" flow via email.
- **2FA**: Add Two-Factor Authentication for extra security.
- **Wallet Auth**: Allow linking wallet for "Login with Wallet" as an alternative.

---

**Built with ❤️ by the YieldX Team**
