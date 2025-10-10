#!/bin/bash
set -e

echo "🚀 Starting Flash Cards Backend..."

# Initialize database
bash init-db.sh

# Ensure .env exists (prefer production template)
if [ ! -f .env ] && [ -f .env.production ]; then
	echo "🔧 Creating .env from .env.production"
	cp .env.production .env
fi

# Ensure APP_KEY exists to avoid 500 on boot
if ! grep -q '^APP_KEY=' .env || grep -q '^APP_KEY=$' .env; then
	echo "🔐 Generating APP_KEY"
	php artisan key:generate --force || true
fi

# Cache config/routes for faster boot
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Run migrations in background (do not block healthcheck)
php artisan migrate --force >/dev/null 2>&1 &

# Start PHP built-in server serving the public directory (fast, stable on Railway)
echo "✨ Starting PHP server on port ${PORT:-8000} serving /public..."
exec php -S 0.0.0.0:"${PORT:-8000}" -t public public/index.php
