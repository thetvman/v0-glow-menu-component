#!/bin/bash

# StrawTV Deployment Script
set -e

echo "=========================================="
echo "StrawTV Deployment"
echo "=========================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi
echo "✓ Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi
echo "✓ npm found"

# Check environment file
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo "Error: No .env.local or .env file found"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi
echo "✓ Environment file found"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Build application
echo ""
echo "Building application..."
npm run build

# Check/Install PM2
if ! command -v pm2 &> /dev/null; then
    echo ""
    echo "Installing PM2..."
    npm install -g pm2
fi
echo "✓ PM2 ready"

# Stop and remove existing process
echo ""
echo "Stopping existing process..."
pm2 stop strawtv 2>/dev/null || true
pm2 delete strawtv 2>/dev/null || true

# Start application
echo ""
echo "Starting StrawTV..."
PORT=8082 pm2 start npm --name "strawtv" -- start

# Save PM2 configuration
pm2 save

echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
echo "Access your app at: http://YOUR_SERVER_IP:8082"
echo ""
echo "Useful commands:"
echo "  pm2 logs strawtv    - View logs"
echo "  pm2 restart strawtv - Restart app"
echo "  pm2 stop strawtv    - Stop app"
echo "  pm2 status          - Check status"
echo "=========================================="
