# Production Deployment Checklist

## Pre-Deployment (Do Locally First)

### Backend Preparation
- [ ] Verify Python version 3.11.7 installed: `python --version`
- [ ] Install dependencies: `pip install -r backend/requirements.txt`
- [ ] Check `requirements.txt` includes:
  - [ ] fastapi
  - [ ] uvicorn
  - [ ] gunicorn (new)
  - [ ] psycopg2-binary (new)
  - [ ] sqlalchemy
  - [ ] python-dotenv

- [ ] Verify files exist:
  - [ ] `backend/Procfile`
  - [ ] `backend/runtime.txt`
  - [ ] `backend/start.sh`
  - [ ] `backend/app/main.py`

- [ ] Test backend locally:
  ```bash
  cd backend
  python -m uvicorn app.main:app --reload
  ```
  - [ ] Server starts on port 8000
  - [ ] Health check works: `curl http://localhost:8000/health`
  - [ ] API docs available: `http://localhost:8000/docs`

### Frontend Preparation
- [ ] Verify Node.js version: `node --version` (should be 18.x)
- [ ] Install dependencies: `npm install --legacy-peer-deps`
- [ ] Verify file exists: `frontend/vercel.json`
- [ ] Test build locally: `npm run build`
  - [ ] Build succeeds without errors
  - [ ] `.next` directory created
  
- [ ] Test start locally: `npm start`
  - [ ] Frontend loads on http://localhost:3000
  - [ ] All pages load correctly
  - [ ] No console errors

### Database Preparation (Local PostgreSQL)
- [ ] PostgreSQL installed and running
- [ ] Create test database:
  ```sql
  CREATE DATABASE defi_yield_test;
  CREATE USER defi_user WITH PASSWORD 'password';
  ALTER ROLE defi_user SET client_encoding TO 'utf8';
  ALTER ROLE defi_user SET default_transaction_isolation TO 'read committed';
  ALTER ROLE defi_user SET default_transaction_deferrable TO on;
  ALTER ROLE defi_user SET default_transaction_readonly TO off;
  GRANT ALL PRIVILEGES ON DATABASE defi_yield_test TO defi_user;
  ```

- [ ] Update `.env` for local testing:
  ```
  DATABASE_URL=postgresql://defi_user:password@localhost:5432/defi_yield_test
  ```

- [ ] Run migrations (if using Alembic):
  ```bash
  cd backend
  alembic upgrade head
  ```

### Environment Setup
- [ ] Create `.env` file with all variables
- [ ] Generate secure secrets:
  ```python
  import secrets
  print(secrets.token_urlsafe(32))
  ```
  - [ ] SECRET_KEY generated
  - [ ] JWT_SECRET_KEY generated

---

## Render Deployment

### Create Render Account
- [ ] Sign up at render.com
- [ ] Link GitHub account
- [ ] Authorize repository access

### Deploy PostgreSQL Database
- [ ] Click "New" → "PostgreSQL"
- [ ] Configuration:
  - [ ] Name: `defi-yield-db`
  - [ ] Database: `defi_yield`
  - [ ] User: `defi_user`
  - [ ] Region: Selected
  - [ ] Plan: Standard
- [ ] Copy **Internal Database URL**
- [ ] Store it safely (needed for backend)
- [ ] Wait for database to be ready (~5 minutes)

### Deploy Redis Cache
- [ ] Click "New" → "Redis"
- [ ] Configuration:
  - [ ] Name: `defi-yield-cache`
  - [ ] Region: Same as database
  - [ ] Plan: Standard
- [ ] Copy **Internal Redis URL**
- [ ] Store it safely (needed for backend)
- [ ] Wait for Redis to be ready (~2 minutes)

### Deploy Backend Web Service
- [ ] Click "New" → "Web Service"
- [ ] Select GitHub repository
- [ ] Configuration:
  - [ ] Name: `defi-yield-backend`
  - [ ] Environment: Python 3
  - [ ] Build Command: `pip install -r backend/requirements.txt`
  - [ ] Start Command: `gunicorn backend.app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000}`
  - [ ] Plan: Standard

- [ ] Add Environment Variables (marked as "secret" if sensitive):
  ```
  ENVIRONMENT=production
  LOG_LEVEL=info
  DATABASE_URL=[PostgreSQL Internal URL from above]
  REDIS_URL=[Redis Internal URL from above]
  SECRET_KEY=[generated secret]
  JWT_SECRET_KEY=[generated JWT secret]
  QIE_RPC_URL=https://rpc1testnet.qie.digital
  QIE_CHAIN_ID=1983
  FRONTEND_URL=https://[your-vercel-domain]
  CORS_ORIGINS=https://[your-vercel-domain]
  ```

- [ ] Click "Create Web Service"
- [ ] Monitor deployment logs
- [ ] Wait for deployment to complete (~5-10 minutes)
- [ ] Copy backend URL: `https://defi-yield-backend.onrender.com`
- [ ] Test backend health:
  ```bash
  curl https://defi-yield-backend.onrender.com/health
  ```

### Run Database Migrations (if needed)
- [ ] Click on web service → Shell (or use CLI)
- [ ] Run migrations:
  ```bash
  cd backend
  alembic upgrade head
  ```

### Test Backend Endpoints
- [ ] Test GET /health: Should return 200
- [ ] Test GET /api/v1/yield/strategies: Should return strategies or []
- [ ] Test POST /api/auth/login: Should validate credentials
- [ ] Check logs for any errors

---

## Vercel Deployment

### Create Vercel Account
- [ ] Sign up at vercel.com
- [ ] Link GitHub account
- [ ] Authorize repository access

### Deploy Frontend
- [ ] Click "New Project"
- [ ] Select GitHub repository
- [ ] Configuration:
  - [ ] Framework: Next.js
  - [ ] Root Directory: `frontend` (if monorepo) or blank
  - [ ] Build Command: `next build`
  - [ ] Output Directory: `.next`
  - [ ] Install Command: `npm install --legacy-peer-deps`

- [ ] Add Environment Variables:
  ```
  NEXT_PUBLIC_API_URL=https://defi-yield-backend.onrender.com
  ```

- [ ] Click "Deploy"
- [ ] Monitor deployment logs
- [ ] Wait for deployment to complete (~3-5 minutes)
- [ ] Copy frontend URL from deployment page

### Test Frontend
- [ ] Visit frontend URL in browser
- [ ] Page should load without errors
- [ ] Check browser console (F12 → Console) for errors
- [ ] Verify styles load correctly
- [ ] Test API integration (F12 → Network tab, perform action)

---

## Post-Deployment Integration

### Update Backend CORS
- [ ] Go to Render dashboard → Backend service
- [ ] Update environment variable:
  ```
  CORS_ORIGINS=https://[vercel-domain],https://www.[vercel-domain]
  FRONTEND_URL=https://[vercel-domain]
  ```
- [ ] Redeploy backend (Manual Deploy button)
- [ ] Wait for redeployment to complete

### Test Full Integration
- [ ] Open frontend in browser
- [ ] Try to login (check Network tab for API call)
- [ ] API should respond with 200/400 (not CORS error)
- [ ] Try to load strategies
- [ ] Verify all API calls succeed

---

## Monitoring & Verification

### Backend Monitoring (Render)
- [ ] View logs regularly: Dashboard → Service → Logs
- [ ] Check for errors: Look for red/orange lines
- [ ] Monitor resource usage: Dashboard → Metrics
- [ ] Set up alerts: Settings → Notifications

### Frontend Monitoring (Vercel)
- [ ] View deployments: Dashboard → Deployments
- [ ] Check build logs: Latest deployment → View Build Logs
- [ ] Monitor performance: Analytics tab
- [ ] Check error tracking: Settings → Monitoring

### Database Monitoring (Render)
- [ ] Check PostgreSQL status: Databases tab
- [ ] View connection metrics: Database → Metrics
- [ ] Monitor disk usage: Should be increasing as you add data

### Health Checks
- [ ] Every day for first week: Run health checks
  ```bash
  curl https://defi-yield-backend.onrender.com/health
  ```
- [ ] Check frontend loads: Visit your Vercel URL
- [ ] Test key features: Login, view strategies, etc.

---

## Common Issues & Solutions

### Backend Won't Deploy
- [ ] Check Python version in `runtime.txt` (should be 3.11.7)
- [ ] Verify `Procfile` has no Windows line endings (save as Unix)
- [ ] Check all dependencies in `requirements.txt`
- [ ] Try viewing full build log from Render dashboard

### Frontend Won't Deploy
- [ ] Check `vercel.json` for valid JSON syntax
- [ ] Verify `next.config.js` is valid
- [ ] Check for build errors: `npm run build` locally
- [ ] Clear Vercel cache and redeploy

### API Calls Fail with CORS Error
- [ ] Verify backend `CORS_ORIGINS` includes frontend URL
- [ ] Check frontend `NEXT_PUBLIC_API_URL` is correct
- [ ] Redeploy backend after updating CORS
- [ ] Test with curl:
  ```bash
  curl -H "Origin: https://your-frontend.vercel.app" \
       -H "Access-Control-Request-Method: GET" \
       -X OPTIONS \
       https://defi-yield-backend.onrender.com/api/v1/yield/strategies
  ```

### Database Connection Fails
- [ ] Verify `DATABASE_URL` is set correctly in backend env vars
- [ ] Check database is running in Render (should show "Connected")
- [ ] Try connecting from terminal:
  ```bash
  psql "[DATABASE_URL]"
  ```
- [ ] Check error logs in backend

---

## Rollback Plan

If something goes wrong:

### Render Rollback
1. Go to Render dashboard → Select service
2. Click "Deployments"
3. Find previous working deployment
4. Click three dots → "Redeploy"

### Vercel Rollback
1. Go to Vercel dashboard → Deployments
2. Find previous working deployment
3. Click "Rollback"

---

## Success Criteria

You know it's working when:

- [x] Backend health check returns 200
- [x] Frontend loads without errors
- [x] API calls from frontend to backend succeed
- [x] Login/signup forms work
- [x] Strategies load and display
- [x] No CORS errors in browser console
- [x] No 500 errors in backend logs
- [x] Database queries are fast (<100ms)
- [x] Frontend pages load quickly
- [x] All images and styles render correctly

---

## Estimated Costs

**Monthly:**
- Render Web Service: $7
- PostgreSQL Database: $15
- Redis Cache: $7
- **Render Total: $29**

- Vercel Pro (for custom domain): $20 (optional, free tier available)
- **Vercel Total: $0-20**

**Grand Total: $29-49/month**

---

## Next Steps After Deployment

1. Set up domain names (optional)
2. Configure email service for notifications
3. Set up monitoring and alerting
4. Create database backup strategy
5. Plan for scaling if needed
6. Set up CI/CD pipeline with GitHub Actions
7. Add error tracking (Sentry)
8. Monitor costs and optimize

---

**Last Updated:** December 12, 2025  
**Status:** ✅ Ready for Production Deployment
