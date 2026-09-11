#!/bin/sh
echo "🚀 Starting Flash Cards Backend..."

export PHP_CLI_SERVER_WORKERS=4

export DB_CONNECTION=${DB_CONNECTION:-mysql}

# Ensure storage and database directories exist
mkdir -p storage/framework/views storage/framework/cache storage/framework/sessions storage/logs database 2>/dev/null || true
chmod -R 775 storage database 2>/dev/null || true

# Run main migrations in background
(php artisan migrate --force >/dev/null 2>&1 || true) &

# Start Laravel server immediately
echo "✨ Starting Laravel server on port ${PORT:-8000} with 4 workers..."
exec php -d default_socket_timeout=3 artisan serve --host=0.0.0.0 --port="${PORT:-8000}"