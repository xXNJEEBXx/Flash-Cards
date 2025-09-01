<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\UserSettingsController;

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
