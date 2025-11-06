#!/bin/bash

# NetAdmin Pro Deployment Script
# Usage: ./deploy.sh [version]

set -e

echo "🚀 NetAdmin Pro Deployment Script"
echo "=================================="

VERSION=${1:-$(git rev-parse --short HEAD)}
DEPLOY_DIR="/opt/netadmin"
BACKUP_DIR="/opt/netadmin/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 Version: $VERSION"
echo "📂 Deploy Directory: $DEPLOY_DIR"

# Create backup
echo ""
echo "💾 Creating backup..."
mkdir -p $BACKUP_DIR
if [ -d "$DEPLOY_DIR/current" ]; then
    tar -czf $BACKUP_DIR/netadmin_${TIMESTAMP}.tar.gz -C $DEPLOY_DIR current
    echo "✅ Backup created: netadmin_${TIMESTAMP}.tar.gz"
fi

# Extract new version
echo ""
echo "📦 Extracting new version..."
ARCHIVE="netadmin-${VERSION}.tar.gz"
if [ ! -f "$ARCHIVE" ]; then
    echo "❌ Error: Archive $ARCHIVE not found"
    exit 1
fi

mkdir -p $DEPLOY_DIR/releases/$VERSION
tar -xzf $ARCHIVE -C $DEPLOY_DIR/releases/$VERSION

# Install backend dependencies
echo ""
echo "📥 Installing backend dependencies..."
cd $DEPLOY_DIR/releases/$VERSION/deployment/backend
npm ci --production

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
npm run migrate

# Stop current services
echo ""
echo "⏸️  Stopping services..."
pm2 stop netadmin-api || true

# Switch to new version
echo ""
echo "🔄 Switching to new version..."
rm -f $DEPLOY_DIR/current
ln -s $DEPLOY_DIR/releases/$VERSION/deployment $DEPLOY_DIR/current

# Start services
echo ""
echo "▶️  Starting services..."
cd $DEPLOY_DIR/current/backend
pm2 start dist/index.js --name netadmin-api
pm2 save

# Health check
echo ""
echo "🏥 Running health check..."
sleep 5
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed - Rolling back..."
    pm2 stop netadmin-api
    rm -f $DEPLOY_DIR/current
    if [ -d "$DEPLOY_DIR/previous" ]; then
        ln -s $DEPLOY_DIR/previous $DEPLOY_DIR/current
        cd $DEPLOY_DIR/current/backend
        pm2 start dist/index.js --name netadmin-api
        echo "⚠️  Rolled back to previous version"
    fi
    exit 1
fi

# Cleanup old releases (keep last 5)
echo ""
echo "🧹 Cleaning up old releases..."
cd $DEPLOY_DIR/releases
ls -t | tail -n +6 | xargs -r rm -rf
echo "✅ Cleanup complete"

# Cleanup old backups (keep last 10)
echo ""
echo "🧹 Cleaning up old backups..."
cd $BACKUP_DIR
ls -t | tail -n +11 | xargs -r rm -f
echo "✅ Backup cleanup complete"

echo ""
echo "✅ Deployment completed successfully!"
echo "📊 PM2 Status:"
pm2 list
