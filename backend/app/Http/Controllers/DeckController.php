<?php

namespace App\Http\Controllers;

use App\Models\Deck;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeckController extends Controller
{
    public function index()
    {
        $maxAttempts = 5;
        $lastError = null;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                Log::info("Starting to fetch decks from database (Attempt $attempt)");
                $decks = Deck::with('cards')->orderBy('id', 'asc')->get();
                Log::info('Successfully fetched decks', [
                    'count' => $decks->count(),
                    'first_id' => $decks->first() ? $decks->first()->id : null
                ]);
                return $decks;
            } catch (\Throwable $e) {
                $lastError = $e;
                Log::error("Failed to fetch decks (Attempt $attempt)", [
                    'error' => $e->getMessage(),
                    'code' => $e->getCode(),
                ]);

                // Check if it's a connection issue like MySQL gone away
                $errorMessage = Str::lower($e->getMessage());
                $isConnectionError = Str::contains($errorMessage, 'server has gone away') || 
                                     Str::contains($errorMessage, 'connection refused') ||
                                     Str::contains($errorMessage, '[2002]');

                if (!$isConnectionError || $attempt === $maxAttempts) {
                    break;
                }

                // Disconnect and wait before retrying to let the database wake up
                DB::disconnect('mysql');
                sleep(1); // Wait 1 full second
            }
        }

        return response()->json([
            'message' => 'Server error while fetching decks',
            'error' => $lastError ? $lastError->getMessage() : 'Unknown error',
            'hint' => 'Check /api/health for database status',
        ], 500);
    }
    public function show(Deck $deck)
    {
        return $deck->load('cards');
    }
    public function store(Request $request)
    {
        $data = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string']);
        $deck = Deck::create($data);
        return response()->json($deck, 201);
    }
    public function update(Request $request, Deck $deck)
    {
        $data = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string']);
        $deck->update($data);
        return $deck;
    }
    public function destroy(Deck $deck)
    {
        $deck->delete();
        return response()->noContent();
    }
    public function reset(Deck $deck)
    {
        $deck->cards()->update(['known' => false]);
        return $deck->load('cards');
    }
}
