#!/bin/bash

# StrawTV Deployment Script
# This script deploys the Next.js app on a dedicated server with HTTP (not HTTPS)

set -e # Exit on any error

echo "=========================================="
echo "StrawTV Deployment Script"
echo "=========================================="

# Configuration
APP_DIR="$(pwd)"
PORT="${PORT:-3000}"
NODE_ENV="${NODE_ENV:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Check if Node.js is installed
print_info "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) detected"

# Check if pnpm is installed, if not use npm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    print_success "Using pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    print_success "Using npm"
else
    print_error "No package manager found. Please install npm or pnpm."
    exit 1
fi

# Check if .env file exists
print_info "Checking environment variables..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    print_error "No .env or .env.local file found!"
    print_info "Please create a .env file with the following variables:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "  - (and any other required environment variables)"
    exit 1
fi
print_success "Environment file found"

# Install dependencies
print_info "Installing dependencies..."
if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm install --frozen-lockfile
else
    npm ci
fi
print_success "Dependencies installed"

# Build the application
print_info "Building Next.js application..."
if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm run build
else
    npm run build
fi
print_success "Build completed"

# Check if PM2 is installed for process management
print_info "Checking for PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    print_info "PM2 not found. Installing PM2 globally..."
    npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Stop existing PM2 process if running
print_info "Stopping existing StrawTV process (if any)..."
pm2 stop strawtv 2>/dev/null || true
pm2 delete strawtv 2>/dev/null || true
print_success "Cleaned up existing processes"

# Start the application with PM2
print_info "Starting StrawTV with PM2..."
if [ "$PKG_MANAGER" = "pnpm" ]; then
    pm2 start pnpm --name "strawtv" -- start
else
    pm2 start npm --name "strawtv" -- start
fi

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot (optional)
print_info "Setting up PM2 startup script..."
pm2 startup systemd -u $USER --hp $HOME || print_info "PM2 startup already configured or needs manual setup"

print_success "Deployment completed successfully!"
echo ""
echo "=========================================="
echo "Application Information:"
echo "=========================================="
echo "App Name: StrawTV"
echo "Port: $PORT (configured in Next.js)"
echo "Access URL: http://localhost:$PORT"
echo "Access via Network: http://YOUR_SERVER_IP:$PORT"
echo ""
echo "Useful Commands:"
echo "  View logs:     pm2 logs strawtv"
echo "  Stop app:      pm2 stop strawtv"
echo "  Restart app:   pm2 restart strawtv"
echo "  Monitor:       pm2 monit"
echo "  Status:        pm2 status"
echo "=========================================="
