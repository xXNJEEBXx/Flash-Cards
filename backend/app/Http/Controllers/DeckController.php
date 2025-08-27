<?php
namespace App\Http\Controllers;

use App\Models\Deck;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeckController extends Controller
{
    public function index() { return Deck::with('cards')->orderBy('id','asc')->get(); }
    public function show(Deck $deck) { return $deck->load('cards'); }
    public function store(Request $request) {
        $data = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string']);
        $deck = Deck::create($data);
        return response()->json($deck, 201);
    }
    public function update(Request $request, Deck $deck) {
        $data = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string']);
        $deck->update($data);
        return $deck;
    }
    public function destroy(Deck $deck) { $deck->delete(); return response()->noContent(); }
    public function reset(Deck $deck) { $deck->cards()->update(['known' => false]); return $deck->load('cards'); }
}
?>
