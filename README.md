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

### Manual Deployment

If deploying manually to Vercel:

1. Push to GitHub
2. Import to Vercel from dashboard
3. Add Supabase integration from Vercel's marketplace, OR manually add these environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```
4. Deploy!

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
