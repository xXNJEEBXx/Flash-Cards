<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\UserSettingsController;

// Simple health check - always return 200 for Railway healthcheck
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ], 200);
});

// Detailed database status check
Route::get('/db-status', function () {
    try {
        // Test database connection
        DB::connection()->getPdo();
        
        // Check if tables exist
        $tablesExist = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('decks', 'cards')");
        
        // Count records
        $deckCount = DB::table('decks')->count();
        $cardCount = DB::table('cards')->count();
        
        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
            'tables' => count($tablesExist) === 2 ? 'ready' : 'missing',
            'decks' => $deckCount,
            'cards' => $cardCount,
            'timestamp' => now()->toIso8601String(),
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'database' => 'disconnected',
            'error' => $e->getMessage(),
            'timestamp' => now()->toIso8601String(),
        ], 200);
    }
});

Route::get('/decks', [DeckController::class, 'index']);
Route::post('/decks', [DeckController::class, 'store']);
Route::get('/decks/{deck}', [DeckController::class, 'show']);
Route::put('/decks/{deck}', [DeckController::class, 'update']);
Route::delete('/decks/{deck}', [DeckController::class, 'destroy']);
Route::post('/decks/{deck}/reset', [DeckController::class, 'reset']);

Route::post('/decks/{deck}/cards', [CardController::class, 'store']);
Route::put('/decks/{deck}/cards/{card}', [CardController::class, 'update']);
Route::delete('/decks/{deck}/cards/{card}', [CardController::class, 'destroy']);
Route::post('/decks/{deck}/cards/{card}/toggle-known', [CardController::class, 'toggleKnown']);
Route::post('/decks/{deck}/cards/{card}/mark-seen', [CardController::class, 'markAsSeen']);
Route::post('/decks/{deck}/cards/{card}/mark-difficult', [CardController::class, 'markAsDifficult']);
Route::get('/decks/{deck}/cards/{card}/stats', [CardController::class, 'getStats']);

// User Settings routes
Route::get('/settings', [UserSettingsController::class, 'show']);
Route::post('/settings', [UserSettingsController::class, 'update']);
Route::post('/settings/reset', [UserSettingsController::class, 'reset']);
Route::post('/settings/unmastered/add', [UserSettingsController::class, 'addUnmasteredCard']);
Route::post('/settings/unmastered/remove', [UserSettingsController::class, 'removeUnmasteredCard']);