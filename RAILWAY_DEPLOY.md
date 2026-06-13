# Pistoleo Platform - Railway + Supabase Deployment

## 🚀 Quick Deploy to Railway

### 1. Connect Repository
```bash
# Option A: Railway CLI
npm i -g @railway/cli
railway login
railway init
railway up

# Option B: GitHub Integration (Recommended)
# 1. Push to GitHub
# 2. Go to railway.app → New Project → Deploy from GitHub repo
# 3. Select your repo
```

### 2. Configure Environment Variables in Railway Dashboard

Go to your project → Variables → Add these **required** variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon/public key |
| `JWT_SECRET` | `openssl rand -base64 32` | **Min 32 chars** - generate securely |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.railway.app` | Your Railway domain |

### 3. Supabase Setup (Required Before Deploy)

Run this migration in Supabase SQL Editor:

```sql
-- Copy contents of supabase/migrations/00004_enable_rls_and_policies.sql
-- This enables RLS and creates policies for multi-user access
```

### 4. Create Admin User in Supabase

```sql
-- In Supabase SQL Editor:
INSERT INTO users (first_name, last_name, email, password, role, terms_accepted, email_verified)
VALUES (
  'Admin',
  'Sistema',
  'admin@yourdomain.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', -- 'Test1234' hashed
  'admin',
  true,
  true
);
```

---

## 📋 Railway-Specific Configuration

### railway.json (Already configured)
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### next.config.js (Standalone output for Railway)
```js
// Already configured with output: 'standalone'
```

### Health Check Endpoint
```
GET /api/health
```
Returns: `{ "status": "healthy", "checks": { "database": "ok" } }`

---

## 🔧 Railway + Supabase Integration Details

### Database Connection
- Railway connects to Supabase via **public internet** (no VPC needed)
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Connection pooling handled by Supabase

### Environment Variables in Railway
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
JWT_SECRET=your-32-char-secret-key-here
NEXT_PUBLIC_APP_URL=https://your-app.railway.app

# Optional
NEXT_PUBLIC_APP_NAME=Pistoleo Extreme San Francisco
```

### Custom Domain (Optional)
1. Railway Dashboard → Settings → Domains
2. Add custom domain: `pistoleo.yourdomain.com`
3. Update `NEXT_PUBLIC_APP_URL` to match

---

## 🚨 Troubleshooting Railway + Supabase

### Build Fails
```bash
# Check logs
railway logs

# Common issues:
# 1. Missing env vars → Add in Railway Dashboard
# 2. Supabase connection → Verify URL and key
# 3. JWT_SECRET too short → Must be 32+ chars
```

### Runtime Errors
```bash
# Check health endpoint
curl https://your-app.railway.app/api/health

# Common issues:
# 1. RLS not enabled → Run 00004 migration
# 2. No admin user → Create in Supabase
# 3. CORS errors → Check Supabase Auth settings
```

### Database Connection Issues
1. Verify Supabase project is **not paused**
2. Check IP allowlist in Supabase (add `0.0.0.0/0` for Railway)
3. Verify anon key has correct permissions

---

## 💰 Railway Pricing Notes

| Resource | Free Tier | Pro |
|----------|-----------|-----|
| CPU | 500 hours/mo | Unlimited |
| RAM | 512 MB | 8 GB+ |
| Disk | 1 GB | 100 GB+ |
| Deployments | 100/mo | Unlimited |

**Estimated cost**: ~$5-10/mo for production usage

---

## 🔄 CI/CD with Railway

### Automatic Deploys
- Push to `main` → Auto deploy
- Push to `develop` → Auto deploy (if configured)

### Manual Deploy
```bash
railway up --detach
```

### Rollback
```bash
railway rollback
# Or in Dashboard → Deployments → Rollback
```

---

## 🔐 Security Checklist for Railway + Supabase

- [ ] `JWT_SECRET` is 32+ random characters
- [ ] Supabase RLS enabled (migration 00004)
- [ ] Admin user created in Supabase
- [ ] Supabase Auth → URL Configuration → Site URL = Railway domain
- [ ] Supabase Auth → Redirect URLs includes Railway domain
- [ ] Railway environment variables set (not in code)
- [ ] Health check passing: `/api/health`

---

## 📱 PWA on Railway

The app includes Service Worker for offline support. For PWA to work:
1. Railway provides HTTPS automatically ✅
2. `manifest.json` and `sw.js` in `/public` ✅
3. Update `NEXT_PUBLIC_APP_URL` to your Railway domain

---

## 📞 Support Commands

```bash
# View logs
railway logs --tail 100

# SSH into container (debugging)
railway shell

# View variables
railway variables

# Run one-off command
railway run npm run db:migrate

# Check status
railway status
```

---

## ✅ Pre-Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project connected to repo
- [ ] Environment variables set in Railway Dashboard
- [ ] Supabase migration `00004` executed
- [ ] Admin user created in Supabase
- [ ] `JWT_SECRET` generated and added
- [ ] Health check passing
- [ ] Custom domain configured (optional)
- [ ] Supabase Auth URLs updated

---

**Ready to deploy!** 🚀

```bash
railway up
```

Or push to GitHub and let Railway auto-deploy.