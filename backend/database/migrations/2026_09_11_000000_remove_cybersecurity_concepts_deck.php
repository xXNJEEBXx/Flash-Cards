<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            if (Schema::hasTable('decks')) {
                $cyberDecks = DB::table('decks')
                    ->where('title', 'like', '%Cyber%Security%Concepts%')
                    ->orWhere('title', 'like', '%Cybersecurity%Concepts%')
                    ->pluck('id');

                if ($cyberDecks->isNotEmpty()) {
                    if (Schema::hasTable('cards')) {
                        DB::table('cards')->whereIn('deck_id', $cyberDecks)->delete();
                    }
                    DB::table('decks')->whereIn('id', $cyberDecks)->delete();
                }
            }
        } catch (\Throwable $e) {
            // Silently pass
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
