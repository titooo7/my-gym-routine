#!/bin/sh

# If API_KEY environment variable is present, replace the placeholder in the JS files
if [ -n "$API_KEY" ]; then
  echo "Injecting API_KEY..."
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__API_KEY_PLACEHOLDER__|$API_KEY|g" {} +
fi

# Nginx container's default entrypoint usually runs scripts in /docker-entrypoint.d/
# and then executes CMD. We don't need to exec nginx here as the main entrypoint does it.
