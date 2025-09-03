#!/usr/bin/env php
<?php
// Quick Supabase connection test script
// Run: php backend/test-supabase.php

echo "🔍 Testing Supabase Connection...\n";

$host = 'db.mwashfvplyrygvrywtfh.supabase.co';
$port = 6543;
$database = 'postgres';
$username = 'postgres';
$password = 'jT6OO733mxTFSMLs';

$dsn = "pgsql:host={$host};port={$port};dbname={$database};sslmode=require";

try {
    echo "📡 Connecting to: {$host}:{$port}\n";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 10
    ]);
<<<<<<< HEAD

    echo "✅ Connection successful!\n";

=======
    
    echo "✅ Connection successful!\n";
    
>>>>>>> 1caaf0c8807754a66f5f324b80793288d7a7f4ed
    // Test query
    $stmt = $pdo->query("SELECT version()");
    $version = $stmt->fetchColumn();
    echo "📊 PostgreSQL Version: {$version}\n";
<<<<<<< HEAD

=======
    
>>>>>>> 1caaf0c8807754a66f5f324b80793288d7a7f4ed
    // Check if tables exist
    $stmt = $pdo->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "🗃️ Tables found: " . implode(', ', $tables) . "\n";
<<<<<<< HEAD

=======
    
>>>>>>> 1caaf0c8807754a66f5f324b80793288d7a7f4ed
    if (in_array('decks', $tables) && in_array('cards', $tables)) {
        echo "✅ Required tables (decks, cards) exist!\n";
    } else {
        echo "❌ Missing required tables - run migrations!\n";
    }
<<<<<<< HEAD
=======
    
>>>>>>> 1caaf0c8807754a66f5f324b80793288d7a7f4ed
} catch (PDOException $e) {
    echo "❌ Connection failed: " . $e->getMessage() . "\n";
    echo "🔧 Check your credentials and SSL settings\n";
}

echo "🏁 Test complete\n";
<<<<<<< HEAD
?>
=======
?>
>>>>>>> 1caaf0c8807754a66f5f324b80793288d7a7f4ed
