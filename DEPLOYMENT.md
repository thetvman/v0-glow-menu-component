# StrawTV Deployment Guide

## Quick Start

Run these commands on your dedicated server:

```bash
# 1. Clone the repository
git clone YOUR_GITHUB_REPO_URL
cd v0-glow-menu-component

# 2. Create environment file
nano .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Add other required environment variables
POSTGRES_URL=your_postgres_url
```

```bash
# 3. Make scripts executable
chmod +x deploy.sh start.sh stop.sh restart.sh logs.sh

# 4. Deploy
./deploy.sh
```

Your app will be running at `http://YOUR_SERVER_IP:8082`

## Management Commands

```bash
# View real-time logs
./logs.sh

# Stop the application
./stop.sh

# Start the application
./start.sh

# Restart the application
./restart.sh

# Check status
pm2 status

# Monitor resources
pm2 monit
```

## Updating the App

```bash
git pull
npm install
npm run build
pm2 restart strawtv
```

## Firewall Setup

Allow port 8082 through your firewall:

```bash
# Ubuntu/Debian
sudo ufw allow 8082/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8082/tcp
sudo firewall-cmd --reload
```

## Troubleshooting

**Port already in use:**
```bash
lsof -i :8082
kill -9 PID
```

**View error logs:**
```bash
pm2 logs strawtv --err
```

**Reset everything:**
```bash
pm2 delete strawtv
./deploy.sh
```

**Enable auto-start on server reboot:**
```bash
pm2 startup
pm2 save
```

## Changing the Port

Edit `deploy.sh` and `start.sh` to change `PORT=8082` to your desired port.

## Production Tips

1. Set up Nginx as a reverse proxy for better performance
2. Configure automatic backups for your database
3. Use PM2 monitoring: `pm2 plus`
4. Keep your environment variables secure and backed up
