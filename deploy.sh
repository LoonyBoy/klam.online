#!/bin/bash

# KlamBot.ru Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting KlamBot.ru deployment..."
echo ""

# Configuration
PROJECT_DIR="/var/www/klambot.ru"
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root"
fi

# Step 1: Backup database
echo "📦 Creating database backup..."
mkdir -p $BACKUP_DIR
mysqldump -u klamuser -p klamonline > $BACKUP_DIR/klam_$DATE.sql || log_error "Database backup failed"
log_info "Database backed up to $BACKUP_DIR/klam_$DATE.sql"

# Step 2: Pull latest code
echo ""
echo "📥 Pulling latest code from Git..."
cd $PROJECT_DIR
git pull origin main || log_error "Git pull failed"
log_info "Code updated"

# Step 3: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install || log_error "Frontend dependencies installation failed"
cd server
npm install || log_error "Backend dependencies installation failed"
cd ..
log_info "Dependencies installed"

# Step 4: Build frontend
echo ""
echo "🔨 Building frontend..."
npm run build || log_error "Frontend build failed"
log_info "Frontend built successfully"

# Step 5: Build backend
echo ""
echo "🔨 Building backend..."
cd server
npm run build || log_error "Backend build failed"
cd ..
log_info "Backend built successfully"

# Step 6: Restart backend
echo ""
echo "🔄 Restarting backend..."
pm2 restart klam-backend || log_error "Backend restart failed"
log_info "Backend restarted"

# Step 7: Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
nginx -t || log_error "Nginx config test failed"
systemctl reload nginx
log_info "Nginx reloaded"

# Step 8: Cleanup old backups (keep last 7 days)
echo ""
echo "🧹 Cleaning old backups..."
find $BACKUP_DIR -name "klam_*.sql" -mtime +7 -delete
log_info "Old backups cleaned"

# Step 9: Show status
echo ""
echo "📊 Deployment Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
log_info "Deployment completed successfully! 🎉"
echo ""
echo "Frontend: https://klambot.ru"
echo "Backend:  https://api.klambot.ru/health"
echo ""
