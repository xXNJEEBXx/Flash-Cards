<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->boolean('smart_mode_enabled')->default(false);
            $table->boolean('hide_mastered_cards')->default(false);
            $table->boolean('shuffle_mode')->default(false);
            $table->json('unmastered_cards')->nullable(); // قائمة IDs البطاقات غير المتقنة
            $table->foreignId('current_deck_id')->nullable()->constrained('decks')->onDelete('set null');
            $table->integer('current_card_index')->default(0);
            $table->string('session_token')->nullable(); // للمستخدمين الضيوف
            $table->timestamps();

            // فهرس للبحث السريع
            $table->index(['user_id', 'session_token']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};
