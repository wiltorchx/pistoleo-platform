# Pistoleo Platform - Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended - Easiest)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login and deploy
vercel login
vercel --prod

# 3. Add environment variables in Vercel Dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - JWT_SECRET (min 32 chars)
```

### Option 2: Docker (Production VPS/Cloud)
```bash
# 1. Build image
docker build -t pistoleo-platform .

# 2. Run container
docker run -d \
  --name pistoleo \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e JWT_SECRET=your-secret \
  pistoleo-platform
```

### Option 3: Docker Compose (With Nginx + SSL)
```bash
# 1. Create .env from template
cp .env.example .env
# Edit .env with your values

# 2. Start services
docker-compose up -d

# 3. For production with SSL:
docker-compose --profile production up -d
```

---

## 🔧 Pre-Deployment Checklist

### 1. Database Setup (Supabase)
- [ ] Run migration `supabase/migrations/00004_enable_rls_and_policies.sql`
- [ ] Verify RLS policies are active
- [ ] Create admin user in `users` table
- [ ] Create operator users as needed

### 2. Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `JWT_SECRET` | ✅ | Min 32 chars, use `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your production URL |

### 3. Generate JWT Secret
```bash
# Linux/Mac
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 🐳 Docker Deployment Details

### Production Dockerfile Features
- **Multi-stage build** for minimal image size (~150MB)
- **Standalone output** for optimal performance
- **Non-root user** for security
- **Health check** endpoint at `/api/health`

### docker-compose.yml Profiles
```bash
# Development (hot reload)
docker-compose --profile dev up

# Production (with Nginx reverse proxy)
docker-compose --profile production up -d
```

### Nginx Configuration
- SSL termination with Let's Encrypt
- Rate limiting on API endpoints
- Security headers (HSTS, CSP, etc.)
- Static asset caching
- WebSocket support for real-time features

---

## 🔄 CI/CD Pipeline (GitHub Actions)

The workflow `.github/workflows/ci-cd.yml` runs on every push:

1. **Lint & TypeCheck** - ESLint + TypeScript
2. **Tests** - Unit/Integration tests
3. **Build** - Docker image pushed to GHCR
4. **Deploy Staging** - Auto-deploy `develop` branch
5. **Deploy Production** - Auto-deploy `main` branch (manual approval)

### Required GitHub Secrets
| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `JWT_SECRET` | JWT signing secret |
| `VERCEL_TOKEN` | Vercel access token (if using Vercel) |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

---

## 📊 Monitoring & Health Checks

### Health Endpoint
```
GET /api/health
Response: { "status": "healthy", "checks": { "database": "ok" } }
```

### Docker Health Check
```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## 🔒 Security Checklist

- [ ] RLS enabled on all Supabase tables
- [ ] JWT_SECRET is strong and unique
- [ ] HTTPS enforced (HSTS header)
- [ ] Rate limiting on auth endpoints
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Environment variables not in repo
- [ ] Dependencies updated (`npm audit`)

---

## 📱 PWA Configuration

The app includes:
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker for offline
- `next.config.js` - PWA headers

For production, ensure:
1. HTTPS is enabled (required for PWA)
2. Service worker scope covers your domain
3. Icons in `public/` are properly sized

---

## 🚨 Troubleshooting

### Build Fails on Windows (Turbopack)
```bash
# Use webpack instead
TURBOPACK=0 npm run build
# Or set in next.config.js experimental.turbo: false
```

### Database Connection Issues
1. Verify Supabase URL and anon key
2. Check RLS policies allow your operations
3. Ensure IP allowlist includes your server

### Authentication Problems
1. Verify JWT_SECRET is set and consistent
2. Check cookie domain settings
3. Ensure clock sync on server

### Docker Issues
```bash
# Clean rebuild
docker-compose down -v
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

---

## 📞 Support

For deployment issues:
1. Check logs: `docker-compose logs -f app`
2. Verify health endpoint: `curl https://your-domain.com/api/health`
3. Review Supabase logs in Dashboard
4. Check Vercel/GitHub Actions logs