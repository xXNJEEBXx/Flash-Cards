#!/bin/bash

# Create database directory if it doesn't exist
mkdir -p /app/database

# Create SQLite database file if it doesn't exist
if [ ! -f /app/database/database.sqlite ]; then
    touch /app/database/database.sqlite
    chmod 664 /app/database/database.sqlite
fi

# Set proper permissions
chmod -R 775 /app/storage /app/bootstrap/cache
chmod -R 664 /app/database/database.sqlite
