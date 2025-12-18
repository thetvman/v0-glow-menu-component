#!/bin/bash

# Stop script for the IPTV streaming platform

echo "Stopping IPTV streaming platform..."

if command -v pm2 &> /dev/null; then
    pm2 delete iptv-streaming 2>/dev/null || echo "No PM2 process found"
else
    echo "PM2 not installed. Please stop the process manually (Ctrl+C or kill the process)."
fi

echo "Application stopped."
