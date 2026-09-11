#!/bin/bash
# Script to initialize SQLite database on Railway

echo "🔧 Initializing database..."
echo "🔍 Current environment variables:"
echo "   DB_CONNECTION=$DB_CONNECTION"
echo "   DB_DATABASE=$DB_DATABASE"
echo "   DATABASE_URL=$DATABASE_URL"

# Create database directories
mkdir -p /app/database 2>/dev/null || true
mkdir -p database 2>/dev/null || true
mkdir -p storage/framework/views 2>/dev/null || true
mkdir -p storage/framework/cache 2>/dev/null || true
mkdir -p storage/framework/sessions 2>/dev/null || true
mkdir -p storage/logs 2>/dev/null || true

# Create SQLite database file if it doesn't exist
if [ ! -f /app/database/database.sqlite ]; then
    echo "📦 Creating /app/database/database.sqlite..."
    touch /app/database/database.sqlite 2>/dev/null || true
    chmod 664 /app/database/database.sqlite 2>/dev/null || true
fi

if [ ! -f database/database.sqlite ]; then
    echo "📦 Creating database/database.sqlite..."
    touch database/database.sqlite 2>/dev/null || true
    chmod 664 database/database.sqlite 2>/dev/null || true
fi

# Set proper permissions
chmod -R 775 /app/storage 2>/dev/null || true
chmod -R 775 /app/database 2>/dev/null || true
chmod -R 775 storage 2>/dev/null || true
chmod -R 775 database 2>/dev/null || true

echo "✅ Database initialization complete"
