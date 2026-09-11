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
        try {
            $decks = Deck::with('cards')->orderBy('id', 'asc')->get();
            return response()->json($decks);
        } catch (\Throwable $e) {
            Log::error("Database error fetching decks: " . $e->getMessage());

            // If MySQL / remote DB is unavailable, try SQLite fallback
            if (config('database.default') !== 'sqlite') {
                try {
                    $decks = Deck::on('sqlite')->with('cards')->orderBy('id', 'asc')->get();
                    return response()->json($decks);
                } catch (\Throwable $t) {
                    // SQLite not initialized or missing
                }
            }

            return response()->json([
                'message' => 'Database temporarily unavailable',
                'error' => $e->getMessage(),
                'hint' => 'Falling back to local storage',
            ], 503);
        }
    }
    public function show(Deck $deck)
    {
        return $deck->load('cards');
    }
    public function store(Request $request)
    {
        if ($request->has('folder_id') && ($request->folder_id === 'null' || $request->folder_id === '' || $request->folder_id === 0 || $request->folder_id === '0')) {
            $request->merge(['folder_id' => null]);
        }
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'folder_id' => 'nullable|exists:folders,id'
        ]);
        $deck = Deck::create($data);
        return response()->json($deck, 201);
    }
    public function update(Request $request, Deck $deck)
    {
        if ($request->has('folder_id') && ($request->folder_id === 'null' || $request->folder_id === '' || $request->folder_id === 0 || $request->folder_id === '0')) {
            $request->merge(['folder_id' => null]);
        }
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'folder_id' => 'nullable|exists:folders,id'
        ]);
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
