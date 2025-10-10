#!/bin/bash
set -e

echo "🚀 Starting Flash Cards Backend..."

# Force SQLite configuration (override any Railway defaults)
export DB_CONNECTION=sqlite
export DB_DATABASE=/app/database/database.sqlite
unset DATABASE_URL  # Remove any MySQL connection string Railway might inject

# Initialize database
bash init-db.sh

# Ensure .env exists (prefer production template)
if [ ! -f .env ] && [ -f .env.production ]; then
  echo "🔧 Creating .env from .env.production"
  cp .env.production .env
fi

# Force SQLite in .env file
echo "🔧 Forcing SQLite configuration in .env..."
sed -i 's/DB_CONNECTION=.*/DB_CONNECTION=sqlite/' .env
sed -i 's|DB_DATABASE=.*|DB_DATABASE=/app/database/database.sqlite|' .env

# Ensure APP_KEY exists to avoid 500 on boot
if ! grep -q '^APP_KEY=' .env || grep -q '^APP_KEY=$' .env; then
  echo "🔐 Generating APP_KEY"
  php artisan key:generate --force || true
fi

# Run migrations and seed database (non-blocking)
(php artisan migrate --force && php artisan db:seed --force) >/dev/null 2>&1 &

# Start Laravel server (fast boot, correct routing)
echo "✨ Starting Laravel server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}" --no-reload