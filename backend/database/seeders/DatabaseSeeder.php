<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Deck;
use App\Models\Card;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $deck = Deck::create([
            'title' => 'Cybersecurity Concepts',
            'description' => 'A comprehensive deck of cybersecurity terms and concepts in both English and Arabic',
        ]);

        $cardsFile = database_path('seeders/cards.cybersecurity.json');
        if (file_exists($cardsFile)) {
            $cards = json_decode(file_get_contents($cardsFile), true);
            if (is_array($cards)) {
                foreach ($cards as $c) {
                    $deck->cards()->create([
                        'question' => $c['question'],
                        'answer' => $c['answer'],
                        'known' => false,
                    ]);
                }
            }
        }
    }
}
