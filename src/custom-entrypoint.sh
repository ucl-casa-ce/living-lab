#!/bin/sh

# Replace placeholders in nginx.conf.template with environment variables
envsubst '${FRONTEND_PORT} ${BACKEND_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start Nginx
nginx -g 'daemon off;'
