<?php

// تجربة الاتصال المباشر بقاعدة البيانات
try {
    $host = 'aws-1-eu-central-1.pooler.supabase.com';
    $port = '6543';
    $dbname = 'postgres';
    $user = 'postgres.athpgairfklrpwusbtll';
    $password = 'Nn58565452';
    
    // تجربة الاتصال بـ SSL
    echo "Attempting connection with SSL...\n";
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 30,
    ]);
    
    echo "✅ Connection successful with SSL!\n";
    
    // تجربة استعلام بسيط
    $result = $pdo->query("SELECT version()");
    echo "Database version: " . $result->fetchColumn() . "\n";
    
} catch (PDOException $e) {
    echo "❌ Connection failed with SSL: " . $e->getMessage() . "\n";
    
    // تجربة بدون SSL
    try {
        echo "\nAttempting connection without SSL...\n";
        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=disable";
        $pdo = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 30,
        ]);
        
        echo "✅ Connection successful without SSL!\n";
        
        // تجربة استعلام بسيط
        $result = $pdo->query("SELECT version()");
        echo "Database version: " . $result->fetchColumn() . "\n";
        
    } catch (PDOException $e2) {
        echo "❌ Connection failed without SSL: " . $e2->getMessage() . "\n";
        
        // تجربة المنفذ المباشر
        try {
            echo "\nAttempting connection on direct port 5432...\n";
            $dsn = "pgsql:host=$host;port=5432;dbname=$dbname;sslmode=require";
            $pdo = new PDO($dsn, $user, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 30,
            ]);
            
            echo "✅ Connection successful on port 5432!\n";
            
            // تجربة استعلام بسيط
            $result = $pdo->query("SELECT version()");
            echo "Database version: " . $result->fetchColumn() . "\n";
            
        } catch (PDOException $e3) {
            echo "❌ All connection attempts failed.\n";
            echo "Port 6543 error: " . $e->getMessage() . "\n";
            echo "Port 6543 no SSL error: " . $e2->getMessage() . "\n";
            echo "Port 5432 error: " . $e3->getMessage() . "\n";
        }
    }
}
