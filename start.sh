#!/bin/bash
PORT=8082 pm2 start npm --name "strawtv" -- start
echo "StrawTV started on port 8082"
