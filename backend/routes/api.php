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
        'db_host' => env('DB_HOST') ?: env('MYSQLHOST'),
        'db_port' => env('DB_PORT') ?: env('MYSQLPORT'),
        'db_database' => env('DB_DATABASE') ?: env('MYSQLDATABASE'),
        'db_username' => env('DB_USERNAME') ?: env('MYSQLUSER'),
        'has_db_password' => !empty(env('DB_PASSWORD')),
        'has_mysql_password' => !empty(env('MYSQLPASSWORD')),
        'has_mysql_private_url' => !empty(env('MYSQL_PRIVATE_URL')),
        'has_database_url' => !empty(env('DATABASE_URL')),
        'has_mysql_url' => !empty(env('MYSQL_URL')),
    ]);
});

Route::get('/check-all-db', function () {
    $results = [];

    // 1. Check SQLite
    try {
        $sqliteDecks = DB::connection('sqlite')->table('decks')->pluck('title');
        $results['sqlite'] = ['status' => 'connected', 'count' => $sqliteDecks->count(), 'titles' => $sqliteDecks];
    } catch (\Throwable $e) {
        $results['sqlite'] = ['status' => 'error', 'error' => $e->getMessage()];
    }

    // 2. Check MySQL via Railway variables
    $host = env('DB_HOST') ?: env('MYSQLHOST');
    $port = env('DB_PORT') ?: env('MYSQLPORT') ?: 3306;
    $db   = env('DB_DATABASE') ?: env('MYSQLDATABASE') ?: 'railway';
    $user = env('DB_USERNAME') ?: env('MYSQLUSER') ?: 'root';
    $pass = env('DB_PASSWORD') ?: env('MYSQLPASSWORD') ?: '';

    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        $pdo = new \PDO($dsn, $user, $pass, [
            \PDO::ATTR_TIMEOUT => 3,
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION
        ]);
        $stmt = $pdo->query("SELECT id, title FROM decks");
        $decks = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $results['mysql_railway_vars'] = [
            'status' => 'connected',
            'host' => $host,
            'port' => $port,
            'user' => $user,
            'count' => count($decks),
            'decks' => $decks
        ];
    } catch (\Throwable $e) {
        $results['mysql_railway_vars'] = [
            'status' => 'error',
            'host' => $host,
            'port' => $port,
            'user' => $user,
            'error' => $e->getMessage()
        ];
    }

    // 3. Check DATABASE_URL / MYSQL_URL / MYSQL_PRIVATE_URL
    foreach (['DATABASE_URL', 'MYSQL_URL', 'MYSQL_PRIVATE_URL'] as $urlVar) {
        $url = env($urlVar);
        if ($url) {
            try {
                $parsed = parse_url($url);
                $pHost = $parsed['host'] ?? 'localhost';
                $pPort = $parsed['port'] ?? 3306;
                $pUser = $parsed['user'] ?? 'root';
                $pPass = $parsed['pass'] ?? '';
                $pDb   = ltrim($parsed['path'] ?? '/railway', '/');
                $dsn = "mysql:host={$pHost};port={$pPort};dbname={$pDb};charset=utf8mb4";
                $pdo = new \PDO($dsn, $pUser, $pPass, [\PDO::ATTR_TIMEOUT => 3]);
                $stmt = $pdo->query("SELECT id, title FROM decks");
                $results[$urlVar] = ['status' => 'connected', 'count' => count($stmt->fetchAll())];
            } catch (\Throwable $e) {
                $results[$urlVar] = ['status' => 'error', 'error' => $e->getMessage()];
            }
        }
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
Route::post('/decks/reorder', [DeckController::class, 'reorder']);
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
