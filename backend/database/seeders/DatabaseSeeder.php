<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Deck;
use App\Models\Card;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // No automatic default decks seeded to prevent duplicate creation on restart
    }
}
