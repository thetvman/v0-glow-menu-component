# Deployment Guide for Dedicated Server

This guide walks you through deploying the IPTV streaming platform on your dedicated server.

## Prerequisites

- Linux/Unix server with SSH access
- Node.js 18 or higher
- Git installed
- Port 8082 open in firewall (or your preferred port)

## Quick Deployment

### 1. Clone the Repository

```bash
cd /var/www  # or your preferred directory
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Make Scripts Executable

```bash
chmod +x deploy.sh start.sh stop.sh
```

### 3. Run Deployment Script

```bash
./deploy.sh
```

The script will:
- Check for Node.js and npm
- Prompt for Supabase credentials
- Install dependencies
- Build the application
- Start the server on port 8082

### 4. Access Your Application

Open your browser and navigate to:
```
http://YOUR_SERVER_IP:8082
```

## Configuration

### Custom Port

To use a different port:

```bash
PORT=3000 ./deploy.sh
```

Or edit the `PORT` variable in `deploy.sh`.

### Environment Variables

The deployment script creates a `.env.local` file with your Supabase credentials. You can manually edit this file:

```bash
nano .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Process Management

### With PM2 (Recommended)

Install PM2 globally for better process management:

```bash
npm install -g pm2
```

Then run the deployment script. PM2 will automatically:
- Run the app in the background
- Auto-restart on crashes
- Restart on server reboot

Common PM2 commands:
```bash
pm2 status              # View app status
pm2 logs iptv-streaming # View logs
pm2 restart iptv-streaming  # Restart app
pm2 stop iptv-streaming     # Stop app
pm2 delete iptv-streaming   # Remove from PM2
```

### Without PM2

The app will run in the foreground. Press `Ctrl+C` to stop.

To run in background without PM2:
```bash
nohup npm start > output.log 2>&1 &
```

## Firewall Configuration

### UFW (Ubuntu/Debian)

```bash
sudo ufw allow 8082/tcp
sudo ufw reload
```

### FirewallD (CentOS/RHEL)

```bash
sudo firewall-cmd --permanent --add-port=8082/tcp
sudo firewall-cmd --reload
```

### iptables

```bash
sudo iptables -A INPUT -p tcp --dport 8082 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

## Nginx Reverse Proxy (Optional)

To serve the app through Nginx with a domain name:

1. Create Nginx config:

```bash
sudo nano /etc/nginx/sites-available/iptv
```

2. Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/iptv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Systemd Service (Alternative to PM2)

Create a systemd service for automatic startup:

1. Create service file:

```bash
sudo nano /etc/systemd/system/iptv-streaming.service
```

2. Add configuration:

```ini
[Unit]
Description=IPTV Streaming Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/YOUR_REPO
Environment="PORT=8082"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

3. Enable and start:

```bash
sudo systemctl enable iptv-streaming
sudo systemctl start iptv-streaming
sudo systemctl status iptv-streaming
```

## Updating the Application

To update to the latest version:

```bash
git pull origin main
./deploy.sh
```

## Troubleshooting

### Port Already in Use

Check what's using the port:
```bash
sudo lsof -i :8082
```

Kill the process:
```bash
sudo kill -9 PID
```

### Permission Denied

Make scripts executable:
```bash
chmod +x deploy.sh start.sh stop.sh
```

### Build Errors

Clear cache and rebuild:
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Can't Access from Browser

Check firewall:
```bash
sudo ufw status
```

Check if app is running:
```bash
ps aux | grep node
```

## Security Recommendations

1. Use Nginx reverse proxy with SSL/TLS
2. Keep Node.js and dependencies updated
3. Use environment variables for sensitive data
4. Enable firewall and only open required ports
5. Run application as non-root user
6. Set up automatic backups of your `.env.local` file

## Support

For issues or questions, check the README.md or open an issue on GitHub.
