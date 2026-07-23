#!/bin/bash
# Napolitan API - Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

ENV=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

echo "=========================================="
echo "Napolitan API Deployment"
echo "Environment: $ENV"
echo "=========================================="

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Copy .env.production.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

echo "Building and starting services..."
docker-compose -f $COMPOSE_FILE up -d --build

echo "Running database migrations..."
docker-compose -f $COMPOSE_FILE exec -T api npx prisma migrate deploy

echo "Checking API health..."
sleep 5

for i in {1..10}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "API is healthy!"
        echo "=========================================="
        echo "Deployment complete!"
        echo "API URL: http://localhost:3000"
        exit 0
    fi
    echo "Waiting for API... ($i/10)"
    sleep 3
done

echo "Error: API failed to become healthy"
exit 1
