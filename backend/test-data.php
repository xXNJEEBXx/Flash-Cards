<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->boot();

use Illuminate\Support\Facades\DB;

try {
    echo "Testing database connection...\n";
    
    $decks = DB::select("SELECT COUNT(*) as count FROM decks");
    echo "Decks count: " . $decks[0]->count . "\n";
    
    $cards = DB::select("SELECT COUNT(*) as count FROM cards");
    echo "Cards count: " . $cards[0]->count . "\n";
    
    $sampleCards = DB::select("SELECT id, question, answer FROM cards LIMIT 3");
    echo "\nSample cards:\n";
    foreach ($sampleCards as $card) {
        echo "- Q: " . $card->question . "\n";
        echo "  A: " . substr($card->answer, 0, 50) . "...\n\n";
    }
    
    echo "✅ Database connection and data verified!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
