#!/bin/bash

# Stop the StrawTV application

echo "Stopping StrawTV..."
pm2 stop strawtv
echo "StrawTV stopped."
