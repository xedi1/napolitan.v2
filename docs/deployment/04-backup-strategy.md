# Database Backup Strategy

## Overview

This document outlines the backup strategy for the Napolitan Restaurant Management System.

---

## Backup Schedule

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Daily | 2:00 AM | 30 days | Local + Remote |
| Weekly | Sunday 3:00 AM | 12 weeks | Remote |
| Monthly | 1st of month | 12 months | Remote |
| Before migration | Manual | Permanent | Multiple locations |

---

## Automated Backups

### Docker Compose Backup

The `backup` service runs automatically via Docker Compose:

```yaml
backup:
  image: postgres:15-alpine
  volumes:
    - ./backups:/backups
    - ./scripts/backup.sh:/backup.sh:ro
```

### Manual Backup

```bash
# Create manual backup
docker exec napolitan-postgres pg_dump -Fc -U postgres napolitan > backup_$(date +%Y%m%d).dump

# Compress backup
gzip backup_20240115.dump
```

---

## Backup Verification

### Test Restore (Monthly)

```bash
# 1. Create test database
docker exec -it napolitan-postgres psql -U postgres -c "CREATE DATABASE napolitan_test;"

# 2. Restore to test database
docker exec -i napolitan-postgres pg_restore -U postgres -d napolitan_test < backup_file.dump

# 3. Verify data integrity
docker exec napolitan-postgres psql -U postgres -d napolitan_test -c "SELECT COUNT(*) FROM orders;"
```

---

## Restore Procedures

### Full Restore

```bash
# 1. Stop application
docker-compose stop api

# 2. Restore database
docker exec -i napolitan-postgres pg_restore -U postgres -d napolitan -c backup_file.dump

# 3. Start application
docker-compose start api
```

### Point-in-Time Recovery

PostgreSQL supports PITR with WAL archiving:

```bash
# Configure in postgresql.conf
wal_level = replica
max_wal_senders = 3
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/data/wal_archive/%f'
```

---

## Off-Site Backup

### S3/Cloud Storage

```bash
# Upload to AWS S3
aws s3 cp backup_file.dump s3://napolitan-backups/daily/

# Upload to Google Cloud Storage
gsutil cp backup_file.dump gs://napolitan-backups/daily/

# Upload to Azure Blob
az storage blob upload --container-name backups --name backup_file.dump --file backup_file.dump
```

---

## Backup Checklist

- [ ] Verify backup completion
- [ ] Test restore procedure
- [ ] Upload to remote storage
- [ ] Clean up old local backups
- [ ] Document any issues

---

## Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| DBA | admin@napolitan.com | Database recovery |
| DevOps | devops@napolitan.com | Infrastructure |
| Backup Admin | backup@napolitan.com | Backup verification |
