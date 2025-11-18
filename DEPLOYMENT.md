# Deployment Guide - Rampungin API

Panduan deployment backend API Rampungin ke production server.

---

## 📋 Pre-Deployment Checklist

- [ ] PostgreSQL database ready
- [ ] Node.js v18+ installed on server
- [ ] Domain/subdomain configured (optional)
- [ ] SSL certificate ready (recommended)
- [ ] Environment variables prepared
- [ ] Backup old database (if migrating)

---

## 🚀 Deployment Options

### Option 1: Traditional Server (VPS/Cloud VM)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE rampungin;
CREATE USER rampungin_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE rampungin TO rampungin_user;
\q
```

#### 3. Deploy Application

```bash
# Clone repository
cd /var/www
git clone <your-repo-url> rampungin-api
cd rampungin-api

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env  # Edit with production values

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate deploy

# Create upload directories
mkdir -p writable/profiles writable/topup

# Set permissions
sudo chown -R $USER:$USER /var/www/rampungin-api
chmod -R 755 writable/
```

#### 4. Start with PM2

```bash
# Start application
pm2 start src/index.js --name rampungin-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Monitor logs
pm2 logs rampungin-api

# Check status
pm2 status
```

#### 5. Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/rampungin-api
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name api.rampungin.com;  # Change to your domain

    # Increase body size for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files directly
    location /writable {
        alias /var/www/rampungin-api/writable;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/rampungin-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 6. Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.rampungin.com

# Auto-renewal is setup automatically
# Test renewal: sudo certbot renew --dry-run
```

---

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy application files
COPY . .

# Create upload directories
RUN mkdir -p writable/profiles writable/topup

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml

```yaml
version: "3.8"

services:
  api:
    build: .
    container_name: rampungin-api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://rampungin_user:password@db:5432/rampungin
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 30d
      NODE_ENV: production
    volumes:
      - ./writable:/app/writable
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    container_name: rampungin-db
    environment:
      POSTGRES_DB: rampungin
      POSTGRES_USER: rampungin_user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# Run migrations
docker-compose exec api npm run prisma:migrate deploy

# Check logs
docker-compose logs -f api

# Check status
docker-compose ps
```

---

### Option 3: Cloud Platforms

#### Railway

1. Connect GitHub repository
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy automatically on push

#### Render

1. Create new Web Service
2. Connect repository
3. Build command: `npm install && npx prisma generate`
4. Start command: `npm start`
5. Add PostgreSQL database
6. Set environment variables

#### Heroku

```bash
# Login
heroku login

# Create app
heroku create rampungin-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set JWT_EXPIRES_IN=30d

# Deploy
git push heroku main

# Run migrations
heroku run npm run prisma:migrate deploy

# Check logs
heroku logs --tail
```

---

## 🔐 Production Environment Variables

Create `.env` file with production values:

```env
# Database (Use production credentials)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT (Generate strong secret)
JWT_SECRET=<use-strong-random-string-here>
JWT_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=production

# CORS (Set your frontend URL)
CORS_ORIGIN=https://rampungin.com,https://www.rampungin.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./writable
```

**Generate strong JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔍 Post-Deployment Verification

### 1. Health Check

```bash
curl http://your-domain.com/api/auth/login
```

### 2. Test Authentication Flow

```bash
# Register
curl -X POST http://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"pass123","nama_lengkap":"Test User","no_telp":"08123456789","role":"client","kota":"Jakarta"}'

# Login
curl -X POST http://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123"}'

# Get profile
curl -X GET http://your-domain.com/api/client/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Check Logs

```bash
# PM2
pm2 logs rampungin-api

# Docker
docker-compose logs -f api

# Direct
journalctl -u rampungin-api -f
```

---

## 📊 Monitoring & Maintenance

### PM2 Monitoring

```bash
# Status
pm2 status

# Logs
pm2 logs rampungin-api --lines 100

# Restart
pm2 restart rampungin-api

# Stop
pm2 stop rampungin-api

# Reload (zero-downtime)
pm2 reload rampungin-api
```

### Database Backup

```bash
# Backup
pg_dump -U rampungin_user -h localhost rampungin > backup_$(date +%Y%m%d).sql

# Restore
psql -U rampungin_user -h localhost rampungin < backup_20241118.sql

# Automated daily backup (crontab)
0 2 * * * pg_dump -U rampungin_user rampungin > /backups/db_$(date +\%Y\%m\%d).sql
```

### Application Updates

```bash
# Pull latest code
cd /var/www/rampungin-api
git pull origin main

# Install dependencies
npm install --production

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate deploy

# Reload application (zero downtime)
pm2 reload rampungin-api
```

---

## 🐛 Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs rampungin-api --err

# Check environment variables
cat .env

# Test database connection
psql $DATABASE_URL
```

### Database connection issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep rampungin

# Test connection string
psql "postgresql://user:pass@host:5432/db"
```

### File upload errors

```bash
# Check directory permissions
ls -la writable/

# Fix permissions
chmod -R 755 writable/
chown -R $USER:$USER writable/
```

### High memory usage

```bash
# Check PM2 memory
pm2 monit

# Set memory limit
pm2 start src/index.js --name rampungin-api --max-memory-restart 500M

# Restart if needed
pm2 restart rampungin-api
```

---

## 🔄 Rollback Strategy

If deployment fails:

```bash
# Git rollback
git log --oneline  # Find previous commit
git reset --hard <commit-hash>

# Prisma rollback
npx prisma migrate resolve --rolled-back <migration-name>

# PM2 restart
pm2 restart rampungin-api

# Database restore
psql -U rampungin_user rampungin < backup_latest.sql
```

---

## 📞 Support Contacts

- Backend Team: [your-email@example.com]
- DevOps: [devops@example.com]
- Emergency: [phone-number]

---

## 📝 Deployment Checklist

Copy this checklist for each deployment:

```
[ ] Code merged to main branch
[ ] Database backup created
[ ] Environment variables verified
[ ] Dependencies installed
[ ] Prisma Client generated
[ ] Migrations executed successfully
[ ] Application started without errors
[ ] Health check passed
[ ] Authentication flow tested
[ ] File upload tested
[ ] Logs monitored for errors
[ ] SSL certificate valid
[ ] PM2 saved and configured
[ ] Nginx configuration tested
[ ] Flutter team notified of new base URL
[ ] Old API kept running during transition period
```

---

**Good luck with your deployment! 🚀**
