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
        
        if (!$card->known) {
            // تسجيل الإتقان
            $card->markAsKnown();
        } else {
            // إلغاء الإتقان
            $card->update(['known' => false]);
        }
        
        return response()->json([
            'success' => true,
            'data' => $card->fresh(),
            'message' => $card->known ? 'Card marked as known' : 'Card marked as unknown'
        ]);
    }

    /**
     * تسجيل عرض البطاقة
     */
    public function markAsSeen(Deck $deck, Card $card)
    {
        $this->assertCardInDeck($deck, $card);
        $card->markAsSeen();
        
        return response()->json([
            'success' => true,
            'message' => 'Card viewed',
            'data' => $card->fresh()
        ]);
    }

    /**
     * تحديد البطاقة كصعبة
     */
    public function markAsDifficult(Deck $deck, Card $card)
    {
        $this->assertCardInDeck($deck, $card);
        $card->markAsDifficult();
        
        return response()->json([
            'success' => true,
            'message' => 'Card marked as difficult',
            'data' => $card->fresh()
        ]);
    }

    /**
     * جلب إحصائيات البطاقة
     */
    public function getStats(Deck $deck, Card $card)
    {
        $this->assertCardInDeck($deck, $card);
        
        return response()->json([
            'success' => true,
            'data' => [
                'card_id' => $card->id,
                'times_seen' => $card->times_seen,
                'times_known' => $card->times_known,
                'success_rate' => $card->success_rate,
                'is_difficult' => $card->is_difficult,
                'last_seen_at' => $card->last_seen_at,
                'last_known_at' => $card->last_known_at
            ]
        ]);
    }
    
    private function assertCardInDeck(Deck $deck, Card $card): void {
        if ($card->deck_id !== $deck->id) { abort(404); }
    }
}
?>
