<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\UserSettingsController;

// Health check for Railway
Route::get('/health', function () {
    $diag = [
        'status' => 'ok',
        'timestamp' => now(),
        'laravel_version' => app()->version(),
        'database' => [
            'status' => 'unknown',
            'driver' => config('database.default'),
            'error' => null,
            'tables' => [],
            'counts' => [],
        ],
    ];

    try {
        DB::connection()->getPdo();
        $diag['database']['status'] = 'connected';
        // Inspect key tables
        foreach (['decks', 'cards', 'migrations'] as $table) {
            try {
                if (DB::getSchemaBuilder()->hasTable($table)) {
                    $diag['database']['tables'][] = $table;
                    $diag['database']['counts'][$table] = DB::table($table)->count();
                } else {
                    $diag['database']['counts'][$table] = 'missing';
                }
            } catch (\Throwable $t) {
                $diag['database']['counts'][$table] = 'error: ' . $t->getMessage();
            }
        }
    } catch (\Throwable $e) {
        $diag['database']['status'] = 'error';
        $diag['database']['error'] = $e->getMessage();
    }

    return response()->json($diag);
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
