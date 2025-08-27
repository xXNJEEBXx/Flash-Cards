<?php

// اختبار مباشر للبيانات في قاعدة البيانات
try {
    $host = 'aws-1-eu-central-1.pooler.supabase.com';
    $port = '6543';
    $dbname = 'postgres';
    $user = 'postgres.athpgairfklrpwusbtll';
    $password = 'Nn58565452';
    
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 30,
    ]);
    
    echo "✅ Connected to database successfully!\n";
    
    // تحقق من الجداول
    $tables = $pdo->query("
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    ")->fetchAll(PDO::FETCH_COLUMN);
    
    echo "\nTables in database:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    
    // تحقق من البيانات
    $deckCount = $pdo->query("SELECT COUNT(*) FROM decks")->fetchColumn();
    echo "\nDecks count: $deckCount\n";
    
    $cardCount = $pdo->query("SELECT COUNT(*) FROM cards")->fetchColumn();
    echo "Cards count: $cardCount\n";
    
    if ($cardCount > 0) {
        echo "\nSample cards:\n";
        $cards = $pdo->query("SELECT question, answer FROM cards LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($cards as $index => $card) {
            echo ($index + 1) . ". Q: " . $card['question'] . "\n";
            echo "   A: " . substr($card['answer'], 0, 60) . "...\n\n";
        }
    }
    
    echo "🎉 Database setup is complete and working!\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ General error: " . $e->getMessage() . "\n";
}
