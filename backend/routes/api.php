<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\UserSettingsController;
use App\Http\Controllers\FolderController;

// Simple health check - always return 200 for Railway healthcheck
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ], 200);
});

Route::get('/debug-env', function () {
    return response()->json([
        'default_connection' => config('database.default'),
        'db_connection' => env('DB_CONNECTION'),
        'db_host' => env('DB_HOST'),
        'db_port' => env('DB_PORT'),
        'db_database' => env('DB_DATABASE'),
        'socket_timeout' => ini_get('default_socket_timeout'),
        'has_mysql_private' => !empty(env('MYSQL_PRIVATE_URL')),
        'has_database_url' => !empty(env('DATABASE_URL')),
        'has_mysql_url' => !empty(env('MYSQL_URL')),
        'mysql_host_env' => env('MYSQLHOST'),
        'mysql_port_env' => env('MYSQLPORT'),
    ]);
});

Route::get('/check-all-db', function () {
    $results = [];

    // Check SQLite
    try {
        $sqliteDecks = DB::connection('sqlite')->table('decks')->count();
        $results['sqlite'] = ['status' => 'connected', 'decks' => $sqliteDecks];
    } catch (\Throwable $e) {
        $results['sqlite'] = ['status' => 'error', 'error' => $e->getMessage()];
    }

    // Check MySQL as configured
    try {
        $pdo = DB::connection('mysql')->getPdo();
        $mysqlDecks = DB::connection('mysql')->table('decks')->count();
        $results['mysql_current'] = ['status' => 'connected', 'decks' => $mysqlDecks];
    } catch (\Throwable $e) {
        $results['mysql_current'] = ['status' => 'error', 'error' => $e->getMessage()];
    }

    // Check MySQL via internal Railway host if available
    $internalHost = env('MYSQLHOST') ?: 'mysql.railway.internal';
    $internalPort = env('MYSQLPORT') ?: 3306;
    try {
        $dsn = "mysql:host={$internalHost};port={$internalPort};dbname=" . env('DB_DATABASE', 'railway');
        $user = env('DB_USERNAME', 'root');
        $pass = env('DB_PASSWORD', '');
        $testPdo = new \PDO($dsn, $user, $pass, [\PDO::ATTR_TIMEOUT => 2]);
        $stmt = $testPdo->query("SELECT COUNT(*) FROM decks");
        $results['mysql_internal'] = ['status' => 'connected', 'host' => $internalHost, 'decks' => (int) $stmt->fetchColumn()];
    } catch (\Throwable $e) {
        $results['mysql_internal'] = ['status' => 'error', 'host' => $internalHost, 'error' => $e->getMessage()];
    }

    return response()->json($results);
});

// Detailed database status check
Route::get('/db-status', function () {
    try {
        // Test database connection
        $conn = DB::connection();
        $pdo = $conn->getPdo();
        $driver = $conn->getDriverName();
        $config = $conn->getConfig();

        // Check if tables exist
        $tablesExist = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('decks', 'cards')");

        // Count records
        $deckCount = DB::table('decks')->count();
        $cardCount = DB::table('cards')->count();

        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
            'driver' => $driver,
            'config' => [
                'host' => $config['host'] ?? null,
                'port' => $config['port'] ?? null,
                'database' => $config['database'] ?? null,
                'username' => $config['username'] ?? null,
            ],
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
            'env' => [
                'DB_CONNECTION' => env('DB_CONNECTION'),
                'DB_HOST' => env('DB_HOST'),
                'DB_PORT' => env('DB_PORT'),
                'DB_DATABASE' => env('DB_DATABASE'),
                'DB_USERNAME' => env('DB_USERNAME'),
            ],
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

// Folder routes
Route::get('/folders', [FolderController::class, 'index']);
Route::post('/folders', [FolderController::class, 'store']);
Route::get('/folders/{folder}', [FolderController::class, 'show']);
Route::put('/folders/{folder}', [FolderController::class, 'update']);
Route::delete('/folders/{folder}', [FolderController::class, 'destroy']);
Route::post('/folders/{folder}/move-deck', [FolderController::class, 'moveDeck']);
Route::post('/folders/remove-deck', [FolderController::class, 'removeDeck']);
