# Glow menu component

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/ffrgtrf1-6953s-projects/v0-glow-menu-component-y8)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/nERWQT2JpK0)

## Overview

This is an IPTV streaming platform with watch together functionality, built with Next.js 15, Supabase, and HLS.js.

## Features

- 🎬 Movies, TV Series, and Live TV streaming
- 👥 Watch Together - Share streaming sessions with friends in real-time
- 🎨 Dark/Light theme support
- 📱 Fully responsive design
- ⚡ Performance optimized for all devices
- 🔒 Secure with Row Level Security (RLS)

## Local Development Setup

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- IPTV service credentials (for content)

### Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd v0-glow-menu-component
npm install
```

### Step 2: Configure Supabase

1. **Create a Supabase project** at [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. **Get your API credentials:**
   - Go to Project Settings → API
   - Copy your **Project URL**
   - Copy your **anon/public key**
   - Copy your **service_role key** (keep this secret!)

3. **Create `.env.local` file** in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# IPTV Configuration (optional)
IPTV_URL=http://your-iptv-server.com
IPTV_USERNAME=your-username
IPTV_PASSWORD=your-password
```

### Step 3: Run Database Migrations

The `watch_sessions` table should already be created if you ran migrations through v0. If not, you can run them manually:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migrations from `scripts/001_create_watch_sessions.sql` and `scripts/002_add_watch_sessions_rls.sql`

Alternatively, the migrations will be automatically applied when you deploy to Vercel.

### Step 4: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Important:** If you see "Supabase environment variables are not configured", make sure you:
1. Created the `.env.local` file with correct values
2. Restarted your development server after adding the file

### Step 5: Login with IPTV Credentials

1. Navigate to `/login`
2. Enter your IPTV server URL, username, and password
3. Start streaming!

## Watch Together Feature

The watch together feature allows users to share streaming sessions:

1. **Start watching** any movie, series, or live TV
2. **Click the share button** (👥 icon) in the video player
3. **Copy the 6-digit code** that appears
4. **Share the code** with friends
5. Friends can **join at `/screenshare`** by entering the code
6. All participants' playback stays in sync automatically

**Note:** Guests don't need IPTV credentials to join a watch session!

## Deployment

### Deploy to Vercel (Automatic - Recommended)

**When you deploy from v0 or connect this repo to Vercel, Supabase environment variables are automatically included!**

1. **From v0:** Click the "Publish" button in v0's interface
2. **From GitHub:** Connect your repository to Vercel

✅ No manual environment variable setup needed for Supabase
✅ Database migrations run automatically
✅ Ready to use immediately

**Live URL:** [https://vercel.com/ffrgtrf1-6953s-projects/v0-glow-menu-component-y8](https://vercel.com/ffrgtrf1-6953s-projects/v0-glow-menu-component-y8)

### Deploy to Dedicated Server (Port 8082)

To deploy on your own server (VPS, dedicated server, etc.) on port 8082:

#### Step 1: Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

#### Step 2: Configure Environment Variables

Create a `.env.production` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server Configuration
PORT=8082
NODE_ENV=production
```

#### Step 3: Start the Production Server

```bash
# Option 1: Using npm (simple)
PORT=8082 npm start

# Option 2: Using PM2 (recommended for production)
npm install -g pm2
pm2 start npm --name "iptv-app" -- start -- -p 8082

# Option 3: Using systemd service (most reliable)
# See below for systemd setup
```

#### Step 4: Access Your Application

Your app will be available at:
```
http://your-server-ip:8082
```

#### Production Setup with PM2 (Recommended)

PM2 keeps your app running and restarts it if it crashes:

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
PORT=8082 pm2 start npm --name "iptv-streaming" -- start

# Configure PM2 to start on system boot
pm2 startup
pm2 save

# View logs
pm2 logs iptv-streaming

# Monitor the app
pm2 monit

# Restart the app
pm2 restart iptv-streaming

# Stop the app
pm2 stop iptv-streaming
```

#### Production Setup with systemd

Create a systemd service file for automatic startup:

```bash
sudo nano /etc/systemd/system/iptv-app.service
```

Add this configuration:

```ini
[Unit]
Description=IPTV Streaming App
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/v0-glow-menu-component
Environment=NODE_ENV=production
Environment=PORT=8082
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable iptv-app
sudo systemctl start iptv-app

# Check status
sudo systemctl status iptv-app

# View logs
sudo journalctl -u iptv-app -f
```

#### Reverse Proxy Setup (Optional - Recommended)

Use Nginx to proxy port 8082 and add SSL:

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

Then enable SSL with Let's Encrypt:

```bash
sudo certbot --nginx -d your-domain.com
```

#### Firewall Configuration

Make sure port 8082 is open:

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 8082/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=8082/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 8082 -j ACCEPT
```

#### Server Requirements

Minimum recommended specs:
- **CPU:** 2 cores
- **RAM:** 2GB
- **Storage:** 10GB
- **OS:** Ubuntu 20.04+ or similar Linux distribution
- **Node.js:** 18.x or higher

## Testing on Other Devices

To test the app on other devices on your local network:

```bash
# Start the dev server with network access
npm run dev -- --hostname 0.0.0.0
```

Then access from other devices using your computer's IP address:
```
http://YOUR-LOCAL-IP:3000
```

Find your local IP:
- **Windows:** `ipconfig` (look for IPv4 Address)
- **Mac/Linux:** `ifconfig` or `ip addr`

## Troubleshooting

### "Supabase environment variables are not configured"

1. Verify `.env.local` exists in project root
2. Check that variable names match exactly (including `NEXT_PUBLIC_` prefix)
3. Restart your development server completely
4. Clear your browser cache and reload

### "Failed to fetch" or CORS errors

- Make sure your IPTV credentials are correct
- Check that the IPTV server is accessible
- Try using the API route instead of direct fetch

### Video won't play

- Ensure the stream URL is valid
- Check browser console for HLS errors
- Try a different browser (Chrome/Edge recommended for HLS)

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Realtime
- **Video:** HLS.js
- **Deployment:** Vercel

## Continue Building

Keep developing on v0: **[https://v0.app/chat/nERWQT2JpK0](https://v0.app/chat/nERWQT2JpK0)**
