#!/bin/bash
# Script to initialize SQLite database on Railway

echo "🔧 Initializing database..."
echo "🔍 Current environment variables:"
echo "   DB_CONNECTION=$DB_CONNECTION"
echo "   DB_DATABASE=$DB_DATABASE"
echo "   DATABASE_URL=$DATABASE_URL"

# Create database directory if it doesn't exist
mkdir -p /app/database

# Create SQLite database file if it doesn't exist
if [ ! -f /app/database/database.sqlite ]; then
    echo "📦 Creating SQLite database..."
    touch /app/database/database.sqlite
    chmod 664 /app/database/database.sqlite
    echo "✅ Database file created"
else
    echo "✅ Database file already exists"
fi

# Set proper permissions
chmod -R 775 /app/storage
chmod -R 775 /app/database

echo "✅ Database initialization complete"
