#!/bin/bash

# IPTV Streaming Platform - Automated Deployment Script
# This script deploys the application on a dedicated server with HTTP support

set -e  # Exit on error

echo "============================================"
echo "  IPTV Streaming Platform Deployment"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PORT="${PORT:-8082}"
NODE_ENV="${NODE_ENV:-production}"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Node.js is installed
echo "Checking dependencies..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher (found v$NODE_VERSION)"
    exit 1
fi
print_success "Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    exit 1
fi
print_success "npm $(npm -v) detected"

# Create .env.local if it doesn't exist
echo ""
echo "Setting up environment variables..."
if [ ! -f .env.local ]; then
    print_warning ".env.local not found. Creating from template..."
    
    # Prompt for Supabase credentials
    echo ""
    echo "Enter your Supabase credentials:"
    echo "(You can find these at https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)"
    echo ""
    
    read -p "Supabase URL: " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    
    # Create .env.local file
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Server Configuration (for development redirect)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:${PORT}
EOF
    
    print_success ".env.local created successfully"
else
    print_success ".env.local already exists"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Build the application
echo ""
echo "Building the application..."
npm run build
print_success "Build completed successfully"

# Check if PM2 is installed
echo ""
if command -v pm2 &> /dev/null; then
    print_success "PM2 detected - using PM2 for process management"
    USE_PM2=true
else
    print_warning "PM2 not detected. Install PM2 for better process management:"
    echo "  npm install -g pm2"
    USE_PM2=false
fi

# Stop existing process
echo ""
if [ "$USE_PM2" = true ]; then
    echo "Stopping existing PM2 process (if any)..."
    pm2 delete iptv-streaming 2>/dev/null || true
    print_success "Previous process stopped"
fi

# Start the application
echo ""
echo "Starting the application on port $PORT..."
if [ "$USE_PM2" = true ]; then
    PORT=$PORT NODE_ENV=$NODE_ENV pm2 start npm --name "iptv-streaming" -- start
    pm2 save
    print_success "Application started with PM2"
    echo ""
    echo "PM2 Commands:"
    echo "  View logs:    pm2 logs iptv-streaming"
    echo "  Restart:      pm2 restart iptv-streaming"
    echo "  Stop:         pm2 stop iptv-streaming"
    echo "  Status:       pm2 status"
else
    print_warning "Starting application without PM2..."
    echo "The server will run in the foreground. Press Ctrl+C to stop."
    echo "For production use, consider installing PM2 globally:"
    echo "  npm install -g pm2"
    echo ""
    PORT=$PORT NODE_ENV=$NODE_ENV npm start
fi

echo ""
echo "============================================"
print_success "Deployment Complete!"
echo "============================================"
echo ""
echo "Your IPTV streaming platform is now running at:"
echo "  http://localhost:$PORT"
echo "  http://YOUR_SERVER_IP:$PORT"
echo ""
echo "Make sure port $PORT is open in your firewall:"
echo "  sudo ufw allow $PORT/tcp"
echo ""
