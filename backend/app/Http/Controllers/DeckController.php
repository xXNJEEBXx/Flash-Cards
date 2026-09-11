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
        // Try primary connection first
        try {
            $decks = Deck::with('cards')->orderBy('id', 'asc')->get();
            if ($decks->isNotEmpty()) {
                return response()->json($decks);
            }
        } catch (\Throwable $e) {
            Log::error("Primary database error fetching decks: " . $e->getMessage());
        }

        // If primary has 0 decks or failed, try mysql if it wasn't primary
        if (config('database.default') !== 'mysql') {
            try {
                $mysqlDecks = Deck::on('mysql')->with('cards')->orderBy('id', 'asc')->get();
                if ($mysqlDecks->isNotEmpty()) {
                    return response()->json($mysqlDecks);
                }
            } catch (\Throwable $t) {
                // MySQL unavailable
            }
        }

        // If mysql failed or empty, try sqlite if it wasn't primary
        if (config('database.default') !== 'sqlite') {
            try {
                $sqliteDecks = Deck::on('sqlite')->with('cards')->orderBy('id', 'asc')->get();
                if ($sqliteDecks->isNotEmpty()) {
                    return response()->json($sqliteDecks);
                }
            } catch (\Throwable $t) {}
        }

        return response()->json([], 200);
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
