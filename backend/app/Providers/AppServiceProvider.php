<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Connection;
use PDOException;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Auto-detect if remote MySQL is reachable; if not, immediately switch to SQLite
        // to avoid 60s Linux TCP timeout that freezes PHP server workers
        $defaultConn = config('database.default');
        if ($defaultConn === 'mysql') {
            $host = config('database.connections.mysql.host');
            $port = (int) (config('database.connections.mysql.port') ?: 3306);
            if ($host && !in_array($host, ['127.0.0.1', 'localhost'])) {
                $fp = @fsockopen($host, $port, $errno, $errstr, 1.0);
                if (!$fp) {
                    // Remote MySQL unreachable! Fall back to SQLite immediately!
                    config(['database.default' => 'sqlite']);
                } else {
                    fclose($fp);
                }
            }
        }

        // Add a heartbeat ping before executing queries on live MySQL
        DB::beforeExecuting(function (string $query, array $bindings, Connection $connection) {
            if ($connection->getDriverName() !== 'mysql') {
                return;
            }

            if ($connection->transactionLevel() > 0) {
                return;
            }

            if ($query === 'SELECT 1') {
                return;
            }

            try {
                if ($pdo = $connection->getPdo()) {
                    $pdo->query('SELECT 1');
                }
            } catch (PDOException $e) {
                $message = $e->getMessage();
                if (Str::contains($message, ['server has gone away', 'Lost connection', '2006', '2013'])) {
                    $connection->reconnect();
                } else {
                    throw $e;
                }
            }
        });
    }
}
