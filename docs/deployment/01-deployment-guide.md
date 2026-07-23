# Napolitan Restaurant API - Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 15+ (for production without Docker)
- Redis 7+ (for production without Docker)

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Application
NODE_ENV=production
PORT=3000

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=napolitan
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/napolitan

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_characters
JWT_REFRESH_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Swagger
SWAGGER_PATH=docs
```

---

## Docker Deployment (Recommended)

### 1. Clone Repository

```bash
git clone https://github.com/xedi1/napolitan.v2.git
cd napolitan.v2
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your production values
```

### 3. Deploy with Docker Compose

```bash
# Pull latest code
git pull origin main

# Build and start services
docker-compose up -d --build

# Run migrations
docker-compose exec api npx prisma migrate deploy

# Check status
docker-compose ps
```

### 4. Verify Deployment

```bash
# Check API health
curl http://localhost:3000/health

# Check Swagger docs
curl http://localhost:3000/docs
```

---

## Manual Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Migrations

```bash
npx prisma migrate deploy
```

### 4. Build Application

```bash
npm run build
```

### 5. Start Application

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

---

## Database Backup

### Automated Backup (Docker)

Backups run daily at 2 AM via the backup container.

```bash
# View existing backups
docker exec napolitan-backup ls -la /backups

# Manual backup
docker exec napolitan-postgres pg_dump -Fc -U postgres napolitan > backup_$(date +%Y%m%d).dump
```

### Restore from Backup

```bash
# Stop the application
docker-compose stop api

# Restore database
cat backup_file.dump | docker exec -i napolitan-postgres pg_restore -U postgres -d napolitan

# Restart the application
docker-compose start api
```

---

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Use strong PostgreSQL password
- [ ] Configure Redis password
- [ ] Set correct CORS origins
- [ ] Enable HTTPS (reverse proxy)
- [ ] Enable firewall (ufw)
- [ ] Regular security updates

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Logs

```bash
# View API logs
docker-compose logs -f api

# View all logs
docker-compose logs -f
```

### Metrics

For Prometheus/Grafana integration, add:
```yaml
metrics:
  enabled: true
  endpoint: /metrics
```

---

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall rules

2. **Redis connection failed**
   - Verify Redis is running
   - Check REDIS_HOST and REDIS_PORT

3. **Migration failed**
   - Check Prisma schema validity
   - Verify database permissions

### Reset Database

```bash
# WARNING: This deletes all data
docker-compose down -v
docker-compose up -d
docker-compose exec api npx prisma migrate reset
```

---

## Next Steps

1. Configure SSL/TLS (Let's Encrypt recommended)
2. Set up monitoring (Prometheus + Grafana)
3. Configure log aggregation
4. Set up alerting
5. Review and update security settings
