<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deck_id')->constrained('decks')->onDelete('cascade');
            $table->string('question');
            $table->text('answer');
            $table->boolean('known')->default(false);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('cards'); }
};
?>
