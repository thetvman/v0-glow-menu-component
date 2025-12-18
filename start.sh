#!/bin/bash

# Quick start script for the IPTV streaming platform
# Usage: ./start.sh [port]

PORT="${1:-8082}"

echo "Starting IPTV streaming platform on port $PORT..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Error: .env.local not found!"
    echo "Run ./deploy.sh first to set up the environment."
    exit 1
fi

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    PORT=$PORT pm2 start npm --name "iptv-streaming" -- start
    pm2 save
    echo "Started with PM2. Use 'pm2 logs iptv-streaming' to view logs."
else
    echo "Starting with npm..."
    PORT=$PORT npm start
fi
