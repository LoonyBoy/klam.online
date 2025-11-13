#!/bin/bash

# KLAM.Online Initial Setup Script
# Run this on a fresh server

set -e

echo "🚀 KLAM.Online Server Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Check root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root"
fi

# Step 1: System update
echo "1️⃣  Updating system..."
apt update && apt upgrade -y
log_info "System updated"

# Step 2: Install Node.js
echo ""
echo "2️⃣  Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node --version
log_info "Node.js installed"

# Step 3: Install MySQL
echo ""
echo "3️⃣  Installing MySQL..."
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
log_info "MySQL installed"

# Step 4: Install Nginx
echo ""
echo "4️⃣  Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx
log_info "Nginx installed"

# Step 5: Install PM2
echo ""
echo "5️⃣  Installing PM2..."
npm install -g pm2
log_info "PM2 installed"

# Step 6: Install Git
echo ""
echo "6️⃣  Installing Git..."
apt install -y git
log_info "Git installed"

# Step 7: Setup MySQL
echo ""
echo "7️⃣  Setting up MySQL database..."
echo "Please enter MySQL root password (or press Enter for new installation):"
read -s MYSQL_ROOT_PASSWORD

echo "Enter password for database user 'klamuser':"
read -s DB_PASSWORD

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS klamonline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'klamuser'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON klamonline.* TO 'klamuser'@'localhost';
FLUSH PRIVILEGES;
EOF

log_info "MySQL database configured"

# Step 8: Clone repository
echo ""
echo "8️⃣  Cloning repository..."
mkdir -p /var/www
cd /var/www

if [ -d "klam.online" ]; then
    log_warn "Directory exists, pulling latest changes..."
    cd klam.online
    git pull origin main
else
    echo "Enter GitHub repository URL (e.g., https://github.com/LoonyBoy/klam.online.git):"
    read REPO_URL
    git clone $REPO_URL
    cd klam.online
fi

log_info "Repository cloned"

# Step 9: Install dependencies
echo ""
echo "9️⃣  Installing dependencies..."
npm install
cd server
npm install
cd ..
log_info "Dependencies installed"

# Step 10: Configure environment
echo ""
echo "🔟 Configuring environment..."
cd server

if [ ! -f .env ]; then
    cp .env.example .env
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 48)
    SESSION_SECRET=$(openssl rand -base64 48)
    
    # Update .env
    sed -i "s/NODE_ENV=development/NODE_ENV=production/" .env
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
    
    log_info ".env configured"
else
    log_warn ".env already exists, skipping..."
fi

cd ..

# Step 11: Run migrations
echo ""
echo "1️⃣1️⃣  Running database migrations..."
cd server
npm run db:migrate
cd ..
log_info "Migrations completed"

# Step 12: Build project
echo ""
echo "1️⃣2️⃣  Building project..."
npm run build
cd server
npm run build
cd ..
log_info "Project built"

# Step 13: Start backend with PM2
echo ""
echo "1️⃣3️⃣  Starting backend..."
cd server
pm2 start dist/index.js --name klam-backend
pm2 startup
pm2 save
cd ..
log_info "Backend started"

# Step 14: Configure Nginx
echo ""
echo "1️⃣4️⃣  Configuring Nginx..."

cat > /etc/nginx/sites-available/klam.online <<'EOF'
server {
    listen 80;
    server_name klam.online www.klam.online;

    root /var/www/klam.online/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

server {
    listen 80;
    server_name api.klam.online;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/klam.online /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
log_info "Nginx configured"

# Step 15: Setup firewall
echo ""
echo "1️⃣5️⃣  Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
log_info "Firewall configured"

# Step 16: Install SSL (optional)
echo ""
echo "1️⃣6️⃣  Do you want to install SSL certificate? (y/n)"
read -r INSTALL_SSL

if [ "$INSTALL_SSL" = "y" ]; then
    apt install -y certbot python3-certbot-nginx
    echo "Enter your email for Let's Encrypt:"
    read EMAIL
    certbot --nginx -d klam.online -d www.klam.online -d api.klam.online --email $EMAIL --agree-tos --no-eff-email
    log_info "SSL certificate installed"
else
    log_warn "Skipping SSL installation"
fi

# Step 17: Create backup directory
echo ""
echo "1️⃣7️⃣  Setting up backups..."
mkdir -p /root/backups
log_info "Backup directory created"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Status:"
pm2 status
echo ""
echo "🌐 Your application:"
echo "   Frontend: http://$(hostname -I | awk '{print $1}')"
echo "   Backend:  http://$(hostname -I | awk '{print $1}'):3001/health"
echo ""
echo "📝 Next steps:"
echo "   1. Configure your DNS records"
echo "   2. Point klam.online to this server IP"
echo "   3. Update Telegram bot domain: /setdomain @klamonline_bot"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 status              - Check backend status"
echo "   pm2 logs klam-backend   - View logs"
echo "   ./deploy.sh             - Deploy updates"
echo ""
