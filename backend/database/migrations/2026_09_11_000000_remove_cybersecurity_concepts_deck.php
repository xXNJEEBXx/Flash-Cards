<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Deck;
use App\Models\Card;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            // Find all decks matching Cybersecurity Concepts
            $decks = Deck::where('title', 'like', '%Cyber%Security%Concepts%')
                ->orWhere('title', 'like', '%Cybersecurity%Concepts%')
                ->get();

            foreach ($decks as $deck) {
                // Delete associated cards then deck
                $deck->cards()->delete();
                $deck->delete();
            }
        } catch (\Exception $e) {
            // Silently pass if tables do not exist yet
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed
    }
};
