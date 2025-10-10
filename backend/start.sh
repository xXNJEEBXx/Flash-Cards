#!/bin/bash
set -e

echo "🚀 Starting Flash Cards Backend..."

# Initialize database
echo "📦 Initializing database..."
bash init-db.sh

# Run migrations
echo "🔄 Running migrations..."
php artisan migrate --force --verbose || echo "⚠️ Migration warning, continuing..."

# Clear caches
echo "🧹 Clearing caches..."
php artisan config:clear
php artisan cache:clear

# Start Laravel server
echo "✨ Starting Laravel server on port ${PORT}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT}"
