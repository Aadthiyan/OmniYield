# Production Deployment Guide - Render & Vercel

**Date:** December 12, 2025  
**Status:** Ready for Deployment

---

## Overview

This guide walks through deploying the DeFi Yield Aggregator as a fully functional website:
- **Backend & Database:** Render.com
- **Frontend:** Vercel
- **Database:** PostgreSQL (Render)
- **Cache:** Redis (Render)

---

## Part 1: Backend Deployment on Render

### Step 1: Prepare Your Backend Repository

1. **Ensure you have in the backend directory:**
   - ✅ `requirements.txt` - Updated with gunicorn & psycopg2
   - ✅ `Procfile` - Render startup command
   - ✅ `runtime.txt` - Python version specification
   - ✅ `start.sh` - Startup script
   - ✅ `backend/app/main.py` - FastAPI application

2. **Update backend config for production:**
   ```python
   # backend/app/config.py - Ensure DATABASE_URL is read from environment
   from pydantic_settings import BaseSettings
   
   class Settings(BaseSettings):
       DATABASE_URL: str = "postgresql://user:password@localhost/dbname"
       REDIS_URL: str = "redis://localhost:6379"
       ENVIRONMENT: str = "development"
       # ... other settings
   
   settings = Settings()
   ```

### Step 2: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Click "New" → "Web Service"

### Step 3: Connect Your GitHub Repository

1. Select "Public Git repository"
2. Enter repository URL: `https://github.com/your-username/your-repo`
3. Click "Continue"

### Step 4: Configure Web Service

**Basic Settings:**
- **Name:** `defi-yield-backend`
- **Environment:** Python 3
- **Build Command:** 
  ```bash
  pip install -r backend/requirements.txt
  ```
- **Start Command:**
  ```bash
  gunicorn backend.app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000}
  ```
- **Plan:** Standard ($7/month)

### Step 5: Add Environment Variables

Click "Advanced" and add the following variables:

```
ENVIRONMENT=production
LOG_LEVEL=info
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]
REDIS_URL=redis://:[password]@[host]:[port]
SECRET_KEY=[generate-random-secret]
JWT_SECRET_KEY=[generate-random-jwt-secret]
QIE_RPC_URL=https://rpc1testnet.qie.digital
QIE_CHAIN_ID=1983
FRONTEND_URL=https://[your-vercel-domain]
CORS_ORIGINS=https://[your-vercel-domain],https://www.[your-vercel-domain]
```

**Generate Secure Secrets:**
```bash
# In Python shell:
import secrets
print(secrets.token_urlsafe(32))  # Run twice for both secrets
```

### Step 6: Create PostgreSQL Database

1. On Render dashboard, click "New" → "PostgreSQL"
2. **Configuration:**
   - **Name:** `defi-yield-db`
   - **Database:** `defi_yield`
   - **User:** `defi_user`
   - **Region:** Select closest to your users
   - **Plan:** Standard ($15/month)

3. Note the **Internal Database URL** from the database page
4. Add to backend web service environment:
   ```
   DATABASE_URL=[Internal Database URL]
   ```

### Step 7: Create Redis Cache

1. On Render dashboard, click "New" → "Redis"
2. **Configuration:**
   - **Name:** `defi-yield-cache`
   - **Region:** Same as database
   - **Plan:** Standard ($7/month)

3. Note the **Internal Redis URL**
4. Add to backend environment:
   ```
   REDIS_URL=[Internal Redis URL]
   ```

### Step 8: Deploy Backend

1. Click "Create Web Service"
2. Render will automatically detect changes to your repository
3. Monitor the deploy logs in real-time
4. Once deployed, note your backend URL: `https://defi-yield-backend.onrender.com`

### Step 9: Run Database Migrations (if using Alembic)

In Render Shell (accessible from dashboard):
```bash
cd backend
alembic upgrade head
```

---

## Part 2: Frontend Deployment on Vercel

### Step 1: Prepare Frontend for Vercel

Files already created:
- ✅ `frontend/vercel.json` - Vercel configuration
- ✅ `frontend/next.config.js` - Next.js configuration
- ✅ `frontend/package.json` - Dependencies

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"

### Step 3: Import GitHub Repository

1. Select your GitHub repository
2. Click "Import"

### Step 4: Configure Project

**Project Settings:**
- **Framework Preset:** Next.js
- **Root Directory:** `frontend` (if monorepo) or blank if frontend is at root
- **Build Command:** `next build`
- **Output Directory:** `.next`
- **Install Command:** `npm install --legacy-peer-deps`

### Step 5: Set Environment Variables

Click "Environment Variables" and add:

```
NEXT_PUBLIC_API_URL=https://defi-yield-backend.onrender.com
```

**Important:** The `NEXT_PUBLIC_` prefix makes this available in the browser.

### Step 6: Deploy Frontend

1. Click "Deploy"
2. Vercel will build and deploy automatically
3. Once complete, note your frontend URL: `https://[project-name].vercel.app`

### Step 7: Update Backend CORS

Update the backend environment variable:
```
CORS_ORIGINS=https://[project-name].vercel.app,https://www.[project-name].vercel.app
FRONTEND_URL=https://[project-name].vercel.app
```

Then redeploy the backend on Render.

---

## Part 3: Domain Setup (Optional but Recommended)

### Add Custom Domain to Vercel

1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain (e.g., `yieldx.com`)
3. Follow Vercel's DNS instructions
4. Wait for DNS propagation (usually 24-48 hours)

### Add Custom Domain to Render

1. In Render backend settings, go to Custom Domain
2. Add your backend domain (e.g., `api.yieldx.com`)
3. Update DNS records

---

## Part 4: Post-Deployment Checklist

### Backend Verification

- [ ] Backend is running: `curl https://defi-yield-backend.onrender.com/health`
- [ ] Database is connected: Check Render logs
- [ ] Redis is working: Check connection in logs
- [ ] CORS is configured: Frontend can call backend
- [ ] Environment variables are set: Check in Render dashboard

### Frontend Verification

- [ ] Frontend loads: Visit your Vercel URL
- [ ] API calls work: Check Network tab in DevTools
- [ ] Images and styles load: Page looks correct
- [ ] Authentication works: Try login/signup

### Integration Testing

1. **Test Login:**
   ```bash
   curl -X POST https://defi-yield-backend.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Test Strategies:**
   ```bash
   curl https://defi-yield-backend.onrender.com/api/v1/yield/strategies
   ```

3. **Test Frontend API Integration:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Perform action in frontend (e.g., click "Load Strategies")
   - Verify API call is successful

---

## Part 5: Monitoring & Logs

### View Render Backend Logs

1. Go to Render dashboard → Select web service
2. Click "Logs" tab
3. Monitor for errors in real-time

### View Vercel Frontend Logs

1. Go to Vercel dashboard → Select project
2. Click "Deployments"
3. Click on latest deployment → "View Build Logs"
4. For runtime errors, use Vercel's Analytics

### Set Up Alerts

**Render:**
- Go to Settings → Notifications
- Enable email alerts for failures

**Vercel:**
- Go to Settings → Git → Auto Git LFS
- Enable deployment notifications

---

## Part 6: Environment Variables Reference

### Backend (Render Web Service)

```
# Deployment
ENVIRONMENT=production
LOG_LEVEL=info
PORT=8000

# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# Cache
REDIS_URL=redis://:password@host:port

# Security
SECRET_KEY=<generate-with-secrets.token_urlsafe()>
JWT_SECRET_KEY=<generate-with-secrets.token_urlsafe()>

# Blockchain
QIE_RPC_URL=https://rpc1testnet.qie.digital
QIE_CHAIN_ID=1983

# CORS
CORS_ORIGINS=https://yourfrontend.vercel.app
FRONTEND_URL=https://yourfrontend.vercel.app

# Optional: AI/ML Models
MODEL_PATH=/tmp/models
```

### Frontend (Vercel)

```
NEXT_PUBLIC_API_URL=https://defi-yield-backend.onrender.com
```

---

## Part 7: Troubleshooting

### Backend Won't Deploy

**Issue:** Build fails on Render
**Solution:**
1. Check Render logs for specific error
2. Verify all dependencies in `requirements.txt`
3. Ensure `Procfile` syntax is correct
4. Try: `pip install --upgrade pip`

**Issue:** Database connection fails
**Solution:**
1. Verify `DATABASE_URL` environment variable
2. Ensure PostgreSQL service is running
3. Check network access rules in Render

### Frontend Won't Load

**Issue:** "Cannot reach backend"
**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check backend is actually running
3. Verify CORS settings on backend
4. Check browser console for specific error

**Issue:** Vercel build fails
**Solution:**
1. Check Vercel build logs
2. Run locally: `npm run build`
3. Verify `frontend/next.config.js` is valid
4. Clear Vercel cache: Settings → Deployments → Clear Cache

### API Calls Return CORS Errors

**Solution:**
1. Update backend `CORS_ORIGINS` environment variable
2. Redeploy backend after updating
3. Test with curl:
   ```bash
   curl -H "Origin: https://yourfrontend.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://defi-yield-backend.onrender.com/api/v1/yield/strategies
   ```

---

## Part 8: Scaling & Performance

### Optimize Backend Performance

1. **Increase Workers:** In Render Procfile, increase `--workers` value
2. **Use Connection Pooling:** Configure SQLAlchemy pool sizes
3. **Cache Strategies:** Use Redis for frequently accessed data
4. **Database Optimization:** Add indexes to frequently queried columns

### Optimize Frontend Performance

1. **Enable Image Optimization:** Vercel does this automatically
2. **Code Splitting:** Next.js does this automatically
3. **Environment-Specific Builds:** Vercel supports this
4. **Analytics:** Use Vercel Analytics to monitor performance

### Monitor Costs

**Render:**
- Web Service: $7/month
- PostgreSQL: $15/month
- Redis: $7/month
- **Total: ~$29/month**

**Vercel:**
- Pro plan (needed for custom domains): $20/month
- Or Free tier if using vercel.app domain

---

## Part 9: Security Best Practices

- ✅ Use environment variables for all secrets
- ✅ Enable HTTPS (automatic on both platforms)
- ✅ Restrict database access to backend only
- ✅ Use strong JWT secrets
- ✅ Enable database SSL connections
- ✅ Set up rate limiting on backend
- ✅ Monitor logs for suspicious activity
- ✅ Regular backups of PostgreSQL database
- ✅ Rotate secrets periodically

### Backup PostgreSQL Database

In Render shell:
```bash
pg_dump -U [username] [database] > backup.sql
```

---

## Part 10: Continuous Deployment

### Auto-Deploy on Git Push

**Both Render and Vercel:**
- Automatically redeploy when you push to your GitHub repository
- Branch-specific deployments available
- Preview deployments for pull requests

### Manual Redeploy

**Render:**
1. Dashboard → Select service
2. Click "Manual Deploy" → Select branch
3. Deploy will start automatically

**Vercel:**
1. Dashboard → Select project
2. Click "Deployments"
3. Click three dots on deployment → "Redeploy"

---

## Quick Start Commands

### Local Testing Before Deployment

```bash
# Backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (in separate terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Then visit:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Generate Environment Files

```bash
# Create .env file template
cp .env.example .env

# Fill in with real values for production
# NEVER commit .env to Git!
```

---

## Support & Next Steps

1. **Monitor Deployments:** Check logs daily for first week
2. **Test All Features:** Verify login, portfolio, strategies work
3. **Set Up CI/CD:** Consider GitHub Actions for testing
4. **Add Monitoring:** Sentry for error tracking
5. **Database Backups:** Configure automatic backups
6. **SSL Certificates:** Both platforms handle automatically

---

## Files Created for Deployment

1. ✅ `backend/requirements.txt` - Updated with gunicorn & psycopg2
2. ✅ `backend/Procfile` - Render startup configuration
3. ✅ `backend/runtime.txt` - Python version specification
4. ✅ `backend/start.sh` - Startup script
5. ✅ `frontend/vercel.json` - Vercel configuration
6. ✅ `render.yaml` - Complete Render infrastructure definition

---

**Status:** ✅ Ready for production deployment!
