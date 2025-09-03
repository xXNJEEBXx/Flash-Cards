<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Flash Cards API is running!',
        'status' => 'ok',
        'version' => '1.0.0',
        'endpoints' => [
            'health' => '/api/health',
            'decks' => '/api/decks',
            'documentation' => 'https://github.com/xXNJEEBXx/Flash-Cards'
        ],
        'timestamp' => now()
    ]);
});
