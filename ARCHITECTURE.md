# Production Architecture & Deployment Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      End User's Browser                      │
│                    (Desktop/Mobile)                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS
                           │
        ┌──────────────────▼─────────────────┐
        │     Vercel CDN (Frontend)          │
        │  defi-yield.vercel.app             │
        │  ┌─────────────────────────────┐   │
        │  │ Next.js React Application   │   │
        │  │ - Dashboard                 │   │
        │  │ - Strategies                │   │
        │  │ - Portfolio                 │   │
        │  │ - Bridge                    │   │
        │  │ - Settings                  │   │
        │  └─────────────────────────────┘   │
        └──────────────────┬──────────────────┘
                           │
                           │ HTTPS API Calls
                           │ CORS Enabled
                           │
        ┌──────────────────▼────────────────────────────────┐
        │     Render.com - Cloud Infrastructure             │
        │                                                   │
        │  ┌────────────────────────────────────────────┐  │
        │  │  Backend Web Service (Python/FastAPI)      │  │
        │  │  defi-yield-backend.onrender.com:8000      │  │
        │  │                                            │  │
        │  │  • /api/v1/yield/* endpoints              │  │
        │  │  • /api/v1/bridge/* endpoints             │  │
        │  │  • /api/auth/* endpoints                  │  │
        │  │  • Business Logic & Optimization          │  │
        │  └────────┬─────────────────────┬────────────┘  │
        │           │                     │                │
        │  ┌────────▼─────────┐  ┌────────▼────────────┐  │
        │  │  PostgreSQL DB   │  │   Redis Cache       │  │
        │  │  (Persistent)    │  │   (Session/Cache)   │  │
        │  │                  │  │                     │  │
        │  │ • Strategies     │  │ • Token Cache       │  │
        │  │ • User Data      │  │ • Session Data      │  │
        │  │ • Analytics      │  │ • Yield Data        │  │
        │  │ • Transactions   │  │ • Rate Limiting     │  │
        │  └──────────────────┘  └─────────────────────┘  │
        └─────────────────────────────────────────────────┘
                           │
                           │ Blockchain RPC Calls
                           │ (Web3 Integration)
                           │
        ┌──────────────────▼──────────────────┐
        │   QIE Testnet Blockchain             │
        │   https://rpc1testnet.qie.digital    │
        │   Chain ID: 1983                     │
        │                                      │
        │ • Smart Contracts                   │
        │ • Transactions                      │
        │ • Token Transfers                   │
        └──────────────────────────────────────┘
```

---

## Data Flow

### 1. User Interaction Flow
```
User Action (Click Button)
    │
    ▼
React Component
    │
    ▼
useAuth/usePortfolio Hook
    │
    ▼
apiService (Axios)
    │
    ▼
HTTP Request (CORS enabled)
    │
    ▼
Backend FastAPI Endpoint
    │
    ▼
Database Query / Blockchain Call
    │
    ▼
Response JSON
    │
    ▼
Update Component State
    │
    ▼
Re-render UI
```

### 2. Authentication Flow
```
User Login
    │
    ▼
POST /api/auth/login
    │
    ▼
Backend validates credentials
    │
    ▼
Generate JWT token
    │
    ▼
Return token + user data
    │
    ▼
Frontend stores token in localStorage
    │
    ▼
Future requests include Authorization header
    │
    ▼
Backend validates token in all requests
```

### 3. Database Persistence
```
Frontend Action
    │
    ▼
API Request to Backend
    │
    ▼
SQLAlchemy ORM
    │
    ▼
PostgreSQL Query
    │
    ▼
Data stored/retrieved
    │
    ▼
Response to Frontend
    │
    ▼
Update UI
```

---

## Deployment Stages

### Stage 1: Local Development (Your Machine)
```
Localhost:3000 ──┐
                 │
            Your Machine
                 │
Localhost:8000 ──┘
```

### Stage 2: Staging/Testing (Before Production)
```
Test Database Setup
    │
    ▼
Deploy Backend to Staging Branch
    │
    ▼
Deploy Frontend to Preview URL
    │
    ▼
Run Integration Tests
```

### Stage 3: Production (Live)
```
┌─────────────────┐
│   Vercel CDN    │ ◄─── Automatic deployment on Git push
│  Frontend Live  │
└────────┬────────┘
         │
    ┌────▼─────┐
    │           │
    │ API Call  │
    │           │
┌───▼────────┐
│  Render    │ ◄─── Automatic deployment on Git push
│  Backend   │
└───┬────────┘
    │
    ├──────┬──────┐
    │      │      │
┌───▼──┐ ┌─┴──┐ ┌┴──────┐
│  DB  │ │Cch │ │  Logs │
└──────┘ └────┘ └───────┘
```

---

## Environment Configuration

### Development (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://user:pass@localhost:5432/dev_db
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
```

### Production (Render Environment Variables)
```
NEXT_PUBLIC_API_URL=https://defi-yield-backend.onrender.com
DATABASE_URL=postgresql://prod_user:***@db.internal:5432/prod_db
REDIS_URL=redis://:***@cache.internal:6379
ENVIRONMENT=production
```

---

## Security Layers

```
┌─────────────────────────────────────┐
│     HTTPS/TLS Encryption            │
│  (All data encrypted in transit)    │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│     API Authentication (JWT)        │
│  (Token verified on every request)  │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│     CORS Policy Enforcement         │
│  (Only allowed domains can access)  │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│     Rate Limiting                   │
│  (Redis-based request throttling)   │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│     Database Password Protection    │
│  (Strong credentials in secrets)    │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│     Blockchain RPC Safety           │
│  (Validated smart contract calls)   │
└─────────────────────────────────────┘
```

---

## Deployment Pipeline

```
┌─────────────────┐
│  Git Repository │
│  (GitHub)       │
└────────┬────────┘
         │ Push to main branch
         │
    ┌────▼─────────┐
    │               │
    │  GitHub Webhook
    │               │
    ├───────┬───────┤
    │       │       │
┌───▼──┐ ┌─▼────┐
│Render│ │Vercel│
│ Ops  │ │ Ops  │
└───┬──┘ └──┬───┘
    │       │
    │  ┌────▼─────┐
    └──┤ Automatic │
       │  Building  │
       │  & Testing │
       └────┬───────┘
            │
        ┌───▼────┐
        │ Deploy  │
        │ to Live │
        └─────────┘
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────┐
│        Render Backend Metrics            │
│                                         │
│  • CPU Usage                            │
│  • Memory Usage                         │
│  • Request Rate                         │
│  • Error Rate                           │
│  • Response Time                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Vercel Frontend Metrics           │
│                                         │
│  • Build Time                           │
│  • Response Time                        │
│  • Core Web Vitals                      │
│  • Error Tracking                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Application Logs                  │
│                                         │
│  • Backend Logs (Render)                │
│  • Frontend Logs (Vercel)               │
│  • Database Logs (PostgreSQL)           │
│  • Cache Logs (Redis)                   │
└─────────────────────────────────────────┘
```

---

## Scaling Architecture (Future)

```
Current (Single Server):
┌──────────┐
│ Backend  │ ◄─── All users go to one server
│ Instance │
└──────────┘

Future (Load Balanced):
          ┌────────────────────┐
          │  Load Balancer     │
          └────────┬───────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───▼──┐   ┌───▼──┐   ┌───▼──┐
    │Back  │   │Back  │   │Back  │
    │End 1 │   │End 2 │   │End 3 │
    └──────┘   └──────┘   └──────┘
        │          │          │
        └──────────┼──────────┘
                   │
            ┌──────▼──────┐
            │ PostgreSQL  │
            │ Replicated  │
            └─────────────┘
```

---

## Cost Optimization

```
Current Setup ($29-49/month):
─────────────────────────────

Production Tier:
  ✓ Vercel Pro: $20/month
  ✓ Render Web: $7/month
  ✓ PostgreSQL: $15/month
  ✓ Redis: $7/month

Optimization Options:
─────────────────────

1. Use free tier if traffic is low:
   • Vercel Free (no Pro)
   • Render Free ($0/month)
   ► Savings: $20-27/month

2. Optimize database:
   • Down-size PostgreSQL
   • Reduce Redis size
   ► Savings: $5-10/month

3. Auto-scaling:
   • Enable only when needed
   • Scale down during off-hours
   ► Savings: Variable
```

---

## Backup & Disaster Recovery

```
Automated Backups:
┌────────────────────┐
│  PostgreSQL Backup │
│  • Daily snapshot  │ ──► Restore Point
│  • Point-in-time   │
│  • 30-day retention│
└────────────────────┘

Manual Backups:
┌────────────────────┐
│  Export Database   │
│  • SQL dump        │ ──► Your Computer
│  • S3 Storage      │
│  • Version control │
└────────────────────┘

Recovery Time:
  • Database: 5-15 minutes
  • Backend: 2-5 minutes
  • Frontend: 1-3 minutes
```

---

## Success Indicators

✅ **System is working if:**
- Frontend loads within 2-3 seconds
- API requests complete within 200-500ms
- Database queries execute in <100ms
- No error pages or 500 errors
- HTTPS shows green lock icon
- Network tab shows all requests as successful
- Console has no errors or warnings
- Users can complete full workflow

---

**Last Updated:** December 12, 2025
**Status:** ✅ Production Ready
