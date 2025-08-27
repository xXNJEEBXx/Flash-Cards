<?php
namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Deck;
use Illuminate\Http\Request;

class CardController extends Controller
{
    public function store(Request $request, Deck $deck) {
        $data = $request->validate([
            'question' => 'required|string',
            'answer' => 'required|string',
        ]);
        $card = $deck->cards()->create($data);
        return response()->json($card, 201);
    }
    public function update(Request $request, Deck $deck, Card $card) {
        $this->assertCardInDeck($deck, $card);
        $data = $request->validate([
            'question' => 'sometimes|required|string',
            'answer' => 'sometimes|required|string',
            'known' => 'sometimes|boolean',
        ]);
        $card->update($data);
        return $card;
    }
    public function destroy(Deck $deck, Card $card) {
        $this->assertCardInDeck($deck, $card);
        $card->delete();
        return response()->noContent();
    }
    public function toggleKnown(Deck $deck, Card $card) {
        $this->assertCardInDeck($deck, $card);
        $card->known = !$card->known;
        $card->save();
        return $card;
    }
    private function assertCardInDeck(Deck $deck, Card $card): void {
        if ($card->deck_id !== $deck->id) { abort(404); }
    }
}
?>
