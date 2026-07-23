# Napolitan API - Railway Deployment Guide

## Prerequisites

1. Railway account (https://railway.app)
2. Railway CLI installed: `npm install -g @railway/cli`
3. GitHub account connected to Railway

## Deployment Steps

### 1. Connect Repository to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `napolitan.v2` repository
4. Railway will auto-detect the Dockerfile

### 2. Set Up PostgreSQL Database

1. In Railway project, click "New" → "Database" → "PostgreSQL"
2. Copy the connection URL (will be like `postgres://...`)
3. Add this as environment variable: `DATABASE_URL`

### 3. Set Up Redis (Optional - for caching)

1. In Railway project, click "New" → "Database" → "Redis"
2. Copy the connection URL
3. Add as environment variable: `REDIS_URL`

### 4. Configure Environment Variables

In Railway project settings, add these variables:

```env
NODE_ENV=production
PORT=3000

# PostgreSQL (from Railway database)
DATABASE_URL=postgresql://...

# Redis (if using)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (generate secure random strings)
JWT_SECRET=<generate-32-char-secret>
JWT_REFRESH_SECRET=<generate-32-char-secret>

# CORS - Your Cloudflare Pages domain
ALLOWED_ORIGINS=https://napolitan-admin.pages.dev
```

### 5. Deploy

1. Railway will auto-deploy on every push to main
2. Or manually trigger: `railway up`

### 6. Run Migrations

1. Go to Railway project → API service → Shell
2. Run: `npx prisma migrate deploy`

### 7. Configure Custom Domain

1. Go to API service → Settings → Domains
2. Add: `api.yourdomain.com`
3. Add DNS record as shown by Railway

### 8. Configure HTTPS

Railway automatically provides SSL certificates for custom domains.

## Alternative: Manual Docker Deployment

If using your own server:

```bash
# Clone repository
git clone https://github.com/xedi1/napolitan.v2.git
cd napolitan.v2

# Copy and configure environment
cp deploy/.env.production.example .env
nano .env  # Edit with your values

# Deploy
docker-compose -f deploy/docker-compose.prod.yml up -d
docker-compose -f deploy/docker-compose.prod.yml exec api npx prisma migrate deploy
```

## Verify Deployment

```bash
curl https://api.yourdomain.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-..."}
```

## Troubleshooting

### Database Connection Failed
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check firewall rules

### Migration Failed
- Ensure DATABASE_URL is set correctly
- Check Prisma schema validity

### CORS Errors
- Verify ALLOWED_ORIGINS includes your Cloudflare Pages domain
- Must be full URL with https://
