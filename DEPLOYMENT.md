# StrawTV Deployment Guide

## Prerequisites

- Node.js 18 or higher
- npm or pnpm package manager
- A dedicated server with SSH access
- Supabase project set up with required tables

## Quick Deployment

1. **Clone the repository:**
   ```bash
   git clone YOUR_GITHUB_REPO_URL
   cd v0-glow-menu-component
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   nano .env
   ```

3. **Make deployment script executable:**
   ```bash
   chmod +x deploy.sh stop.sh restart.sh logs.sh
   ```

4. **Run deployment:**
   ```bash
   ./deploy.sh
   ```

## Environment Variables

Create a `.env` file in the root directory with these variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database (if using direct connection)
POSTGRES_URL=your_postgres_connection_string
POSTGRES_PRISMA_URL=your_postgres_prisma_url

# App Configuration
NODE_ENV=production
PORT=3000
```

## Managing the Application

### View Logs
```bash
./logs.sh
# or
pm2 logs strawtv
```

### Stop Application
```bash
./stop.sh
# or
pm2 stop strawtv
```

### Restart Application
```bash
./restart.sh
# or
pm2 restart strawtv
```

### Check Status
```bash
pm2 status
```

### Monitor Resources
```bash
pm2 monit
```

## HTTP Configuration

By default, the app runs on HTTP (not HTTPS) on port 3000. To access:

- **Locally:** http://localhost:3000
- **Network:** http://YOUR_SERVER_IP:3000

### Changing Port

Edit `ecosystem.config.json` and change the PORT value:
```json
"env": {
  "PORT": 8080
}
```

Then restart the app.

## Firewall Configuration

Make sure your server firewall allows traffic on the port you're using:

```bash
# For Ubuntu/Debian with ufw
sudo ufw allow 3000/tcp

# For CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## Updating the Application

1. Pull latest changes:
   ```bash
   git pull origin main
   ```

2. Run deployment script:
   ```bash
   ./deploy.sh
   ```

The script will automatically stop the old version, install dependencies, rebuild, and start the new version.

## Troubleshooting

### Port Already in Use
```bash
# Find process using the port
lsof -i :3000
# Kill the process
kill -9 PID
```

### PM2 Not Starting on Boot
```bash
pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

### Check Application Logs
```bash
pm2 logs strawtv --lines 100
```

### Reset Everything
```bash
pm2 delete strawtv
pm2 save
./deploy.sh
```

## Production Considerations

1. **Use a reverse proxy (Nginx)** for better performance and security
2. **Set up SSL/TLS** if you need HTTPS (using Let's Encrypt)
3. **Configure backups** for your database
4. **Set up monitoring** with PM2 Plus or similar
5. **Use environment-specific configs** for different stages

## Support

For issues, check the logs first:
```bash
pm2 logs strawtv
```

If problems persist, check the GitHub issues page or contact support.
