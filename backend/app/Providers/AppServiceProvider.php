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
        // Add a heartbeat ping before executing any query to prevent "MySQL server has gone away"
        // in environments like Railway where the TCP proxy might drop idle connections.
        DB::beforeExecuting(function (string $query, array $bindings, Connection $connection) {
            // Do not attempt heartbeat/reconnect if inside an active transaction.
            if ($connection->transactionLevel() > 0) {
                return;
            }

            // Skip if this is the heartbeat query itself
            if ($query === 'SELECT 1') {
                return;
            }

            try {
                // Ping the database using the raw PDO instance
                if ($pdo = $connection->getPdo()) {
                    $pdo->query('SELECT 1');
                }
            } catch (PDOException $e) {
                $message = $e->getMessage();
                // Check for CR_SERVER_GONE_ERROR (2006) or CR_SERVER_LOST (2013)
                if (Str::contains($message, ['server has gone away', 'Lost connection', '2006', '2013'])) {
                    $connection->reconnect();
                } else {
                    throw $e;
                }
            }
        });
    }
}
