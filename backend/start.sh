#!/bin/bash
set -e

echo "🚀 Starting Flash Cards Backend..."

# Respect Railway-provided environment variables (MySQL) by default
# Do NOT override DB_CONNECTION/DB_DATABASE here.
unset DATABASE_URL  # Optional: avoid unexpected DATABASE_URL precedence

# Initialize SQLite database only if using sqlite
if [ "${DB_CONNECTION}" = "sqlite" ] || [ -z "${DB_CONNECTION}" ]; then
  bash init-db.sh
fi

# Ensure .env exists (prefer production template)
if [ ! -f .env ] && [ -f .env.production ]; then
  echo "🔧 Creating .env from .env.production"
  cp .env.production .env
fi

# Do not force DB settings in .env; rely on Railway Variables

# Ensure APP_KEY exists to avoid 500 on boot
if ! grep -q '^APP_KEY=' .env || grep -q '^APP_KEY=$' .env; then
  echo "🔐 Generating APP_KEY"
  php artisan key:generate --force || true
fi

# Clear caches to avoid stale config/routes/views
php artisan optimize:clear || true

# Start Laravel server FIRST (for healthcheck)
echo "✨ Starting Laravel server on port ${PORT:-8000}..."
php artisan serve --host=0.0.0.0 --port="${PORT:-8000}" --no-reload &
SERVER_PID=$!

# Give server 5 seconds to start
sleep 5

# Run migrations and seed database (in background)
echo "🔄 Running migrations and seeding..."
(php artisan migrate --force && php artisan db:seed --force) >/dev/null 2>&1 &

# Wait for server process
wait $SERVER_PID