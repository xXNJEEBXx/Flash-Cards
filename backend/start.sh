#!/bin/bash
set -e

echo "🚀 Starting Flash Cards Backend..."

# Initialize database
bash init-db.sh

# Run migrations (non-blocking)
php artisan migrate --force 2>&1 || echo "Migration skipped"

# Start Laravel server (it handles routing correctly)
echo "✨ Starting Laravel server on port ${PORT}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT}"
