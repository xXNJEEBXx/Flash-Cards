#!/bin/sh
echo "🚀 Starting Flash Cards Backend..."

export PHP_CLI_SERVER_WORKERS=4

# Ensure storage and database directories exist
mkdir -p storage/framework/views storage/framework/cache storage/framework/sessions storage/logs database 2>/dev/null || true
touch database/database.sqlite 2>/dev/null || true
chmod -R 775 storage database 2>/dev/null || true

# Run migrations in background so server starts immediately for healthcheck
(php artisan migrate --force >/dev/null 2>&1 || true) &

# Start Laravel server immediately
echo "✨ Starting Laravel server on port ${PORT:-8000} with 4 workers..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"