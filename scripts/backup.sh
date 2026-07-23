#!/bin/sh
# Napolitan Database Backup Script
# Usage: Run via Docker Compose or standalone

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/napolitan_${DATE}.sql.gz"

echo "Starting backup at $(date)"
echo "Backup file: ${BACKUP_FILE}"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c '\q' 2>/dev/null; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 1
done

echo "PostgreSQL is up - executing backup"

# Create backup
pg_dump -h "${POSTGRES_HOST}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -Fc \
    -Z 6 \
    -f "${BACKUP_FILE}"

# Verify backup
if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(stat -f%z "${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_FILE}" 2>/dev/null)
    echo "Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE} bytes)"
else
    echo "ERROR: Backup failed"
    exit 1
fi

# Cleanup old backups
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "napolitan_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
echo "Cleanup complete"

# List remaining backups
echo "Current backups:"
ls -lh "${BACKUP_DIR}"/napolitan_*.sql.gz 2>/dev/null || echo "No backups found"

echo "Backup completed at $(date)"
