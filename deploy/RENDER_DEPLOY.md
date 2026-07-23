# Napolitan API - Render Deployment Guide

## Alternative: Deploy to Render.com (Free Tier)

Render offers free PostgreSQL and Redis databases with Docker support.

## Prerequisites

1. Render account (https://render.com)
2. GitHub repository connected

## Deployment Steps

### 1. Create PostgreSQL Database

1. Dashboard → "New" → "PostgreSQL"
2. Name: `napolitan-db`
3. Select Free tier
4. Copy "Internal Connection String"

### 2. Create Redis Instance (Optional)

1. Dashboard → "New" → "Redis"
2. Name: `napolitan-redis`
3. Select Free tier
4. Copy connection URL

### 3. Deploy API Service

1. Dashboard → "New" → "Web Service"
2. Connect GitHub repo: `napolitan.v2`
3. Configure:
   - **Root Directory**: (leave empty)
   - **Runtime**: Docker
   - **Build Command**: (leave empty - uses Dockerfile)
   - **Start Command**: `docker build -t napolitan-api . && docker run -p 3000:3000`
   - **Plan**: Free

4. Add Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<postgres-internal-connection-string>
   REDIS_URL=<redis-url> (if using)
   JWT_SECRET=<32-char-random-string>
   JWT_REFRESH_SECRET=<32-char-random-string>
   ALLOWED_ORIGINS=https://napolitan-admin.pages.dev
   ```

### 4. Configure Custom Domain

1. Service → Settings → Custom Domains
2. Add: `api.yourdomain.com`
3. Add CNAME record in DNS

### 5. Run Migrations

Use Render's Shell to run:
```bash
npx prisma migrate deploy
```

## Verify Deployment

```bash
curl https://api.yourdomain.com/health
```

## Notes

- Render's free tier sleeps after 15 minutes of inactivity
- First request after sleep may take ~30 seconds
- For production, upgrade to paid plan
