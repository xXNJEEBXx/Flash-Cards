#!/bin/bash
set -e

echo "🚀 Starting Flash Cards Backend..."

# Initialize database
bash init-db.sh

# Run migrations (non-blocking)
php artisan migrate --force 2>&1 || echo "Migration skipped"

# Start PHP built-in server serving the public directory (stable on Railway)
echo "✨ Starting PHP server on port ${PORT} serving /public..."
cd ./public
exec php -S 0.0.0.0:"${PORT}" index.php
