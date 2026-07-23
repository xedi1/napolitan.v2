# Deployment Documentation

This directory contains all deployment-related documentation for the Napolitan Restaurant Management System.

## Contents

| Document | Description |
|----------|-------------|
| [Deployment Guide](./01-deployment-guide.md) | Complete deployment instructions |
| [Docker Setup](./02-docker-setup.md) | Docker-specific configuration |
| [Environment Variables](./03-environment-variables.md) | All environment variables |
| [Backup Strategy](./04-backup-strategy.md) | Database backup procedures |
| [Troubleshooting](./05-troubleshooting.md) | Common issues and solutions |

---

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/xedi1/napolitan.v2.git
cd napolitan.v2
cp .env.example .env
# Edit .env with your values
```

### 2. Deploy with Docker

```bash
docker-compose up -d --build
docker-compose exec api npx prisma migrate deploy
```

### 3. Verify

```bash
curl http://localhost:3000/health
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Load Balancer                       │
└─────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │ Admin    │        │  QR Menu │        │ Delivery │
    │ Panel    │        │   (Web)  │        │   (App)  │
    └──────────┘        └──────────┘        └──────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   API Gateway      │
                    │   (Rate Limit)     │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │  REST    │        │WebSocket│        │  Task    │
    │  API     │        │Gateway   │        │ Queue    │
    └──────────┘        └──────────┘        └──────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL      │
                    └───────────────────┘
```

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| API | 3000 | Main REST API |
| Admin Panel | 3001 | Vue.js Admin Dashboard |
| PostgreSQL | 5432 | Primary Database |
| Redis | 6379 | Cache & Queue |

---

## Security Features

- [x] JWT Authentication
- [x] Rate Limiting
- [x] CORS Configuration
- [x] Input Sanitization
- [x] Security Headers
- [x] API Key System
- [x] Webhook Signature Verification

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Logs

```bash
docker-compose logs -f api
```

### Metrics

Access Prometheus metrics at: `http://localhost:3000/metrics`
