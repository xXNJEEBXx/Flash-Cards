<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\CardController;

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
?>
