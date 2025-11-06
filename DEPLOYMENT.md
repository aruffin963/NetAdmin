# NetAdmin Pro - Production Deployment Guide

## 📋 Prerequisites

### Server Requirements
- Ubuntu 20.04 LTS or newer (or similar Linux distribution)
- Node.js 18.x or 20.x
- PostgreSQL 14+
- Nginx (for reverse proxy)
- PM2 (for process management)
- Git

### Minimum Hardware
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB
- Network: 100 Mbps

## 🚀 Initial Server Setup

### 1. Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 3. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Install PM2
```bash
sudo npm install -g pm2
pm2 startup
```

### 5. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🗄️ Database Setup

### 1. Create Database and User
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE netadmin_prod;
CREATE USER netadmin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE netadmin_prod TO netadmin;
\q
```

### 2. Configure PostgreSQL for Remote Access (if needed)
Edit `/etc/postgresql/14/main/postgresql.conf`:
```
listen_addresses = 'localhost'
```

Edit `/etc/postgresql/14/main/pg_hba.conf`:
```
local   netadmin_prod   netadmin                                md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## 📦 Application Deployment

### 1. Create Deployment Directory
```bash
sudo mkdir -p /opt/netadmin/{releases,backups}
sudo chown -R $USER:$USER /opt/netadmin
```

### 2. Clone or Upload Repository
```bash
cd /opt/netadmin
git clone https://github.com/yourusername/netadmin-pro.git source
cd source
```

### 3. Configure Backend Environment
```bash
cd backend
cp .env.production .env
nano .env
```

Update all `CHANGE_THIS_*` values with real credentials.

### 4. Build Backend
```bash
npm ci
npm run build
```

### 5. Run Database Migrations
```bash
npm run migrate
```

### 6. Build Frontend
```bash
cd ../frontend
cp .env.example .env
nano .env
```

Update `VITE_API_URL` with your API endpoint (e.g., `https://api.yourdomain.com`).

```bash
npm ci
npm run build
```

### 7. Create Initial Deployment
```bash
cd /opt/netadmin
mkdir -p releases/v1.0.0/backend releases/v1.0.0/frontend

# Copy backend
cp -r source/backend/dist releases/v1.0.0/backend/
cp -r source/backend/node_modules releases/v1.0.0/backend/
cp source/backend/package.json releases/v1.0.0/backend/
cp source/backend/.env releases/v1.0.0/backend/

# Copy frontend build
cp -r source/frontend/dist releases/v1.0.0/frontend/

# Create current symlink
ln -s releases/v1.0.0 current
```

### 8. Start Backend with PM2
```bash
cd /opt/netadmin/current/backend
pm2 start dist/index.js --name netadmin-api
pm2 save
pm2 list
```

## 🌐 Nginx Configuration

### 1. Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/netadmin
```

Add the following configuration:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:5000/api/health;
        access_log off;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /opt/netadmin/current/frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Disable access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### 2. Enable Site and Test
```bash
sudo ln -s /etc/nginx/sites-available/netadmin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 SSL/TLS Setup (Recommended)

### Using Let's Encrypt (Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Certbot will automatically configure SSL and set up auto-renewal.

## 🔄 Automated Deployment

### 1. Make deploy script executable
```bash
chmod +x /opt/netadmin/source/deploy.sh
```

### 2. Deploy new version
```bash
cd /opt/netadmin/source
git pull
npm run build  # In both backend and frontend
cd /opt/netadmin
./source/deploy.sh v1.0.1
```

## 📊 Monitoring

### PM2 Monitoring
```bash
# View logs
pm2 logs netadmin-api

# Monitor processes
pm2 monit

# View status
pm2 status

# Restart application
pm2 restart netadmin-api

# Stop application
pm2 stop netadmin-api
```

### System Logs
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /opt/netadmin/current/backend/logs/app.log
```

## 🔐 Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate strong JWT secret (min 32 characters)
- [ ] Configure firewall (UFW):
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] Enable SSL/TLS with Let's Encrypt
- [ ] Configure PostgreSQL for local access only
- [ ] Set up regular database backups
- [ ] Configure fail2ban for brute-force protection
- [ ] Keep system and dependencies updated
- [ ] Use strong passwords for database and LDAP
- [ ] Restrict SSH access (key-based authentication)
- [ ] Configure log rotation

## 🗑️ Database Backup

### Manual Backup
```bash
sudo -u postgres pg_dump netadmin_prod > /opt/netadmin/backups/db_$(date +%Y%m%d_%H%M%S).sql
```

### Automated Backup (Crontab)
```bash
crontab -e
```

Add:
```
0 2 * * * sudo -u postgres pg_dump netadmin_prod > /opt/netadmin/backups/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql
0 3 * * 0 find /opt/netadmin/backups -name "db_*.sql" -mtime +30 -delete
```

## 🔄 Updates and Maintenance

### Update Application
```bash
cd /opt/netadmin/source
git pull
cd backend && npm ci && npm run build
cd ../frontend && npm ci && npm run build
cd /opt/netadmin
./source/deploy.sh $(git rev-parse --short HEAD)
```

### Update Dependencies
```bash
cd /opt/netadmin/source/backend
npm update
npm audit fix

cd ../frontend
npm update
npm audit fix
```

### Database Migration
```bash
cd /opt/netadmin/current/backend
npm run migrate
```

## 🆘 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs netadmin-api --lines 100

# Check database connection
psql -U netadmin -d netadmin_prod -h localhost

# Verify environment variables
cd /opt/netadmin/current/backend
cat .env
```

### High CPU/Memory Usage
```bash
# Check PM2 status
pm2 monit

# Check system resources
htop

# Restart application
pm2 restart netadmin-api
```

### Database Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname='netadmin_prod';"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 📞 Support

For issues and support:
- GitHub Issues: https://github.com/yourusername/netadmin-pro/issues
- Documentation: https://github.com/yourusername/netadmin-pro/wiki
- Email: support@yourdomain.com

## 📄 License

MIT License - See LICENSE file for details
