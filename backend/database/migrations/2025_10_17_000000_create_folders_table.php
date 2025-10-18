<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Create folders table
        Schema::create('folders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('parent_folder_id')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
            
            // Foreign key for nested folders
            $table->foreign('parent_folder_id')
                  ->references('id')
                  ->on('folders')
                  ->onDelete('cascade');
        });

        // Add folder_id column to decks table
        Schema::table('decks', function (Blueprint $table) {
            $table->unsignedBigInteger('folder_id')->nullable()->after('description');
            $table->integer('order')->default(0)->after('folder_id');
            
            $table->foreign('folder_id')
                  ->references('id')
                  ->on('folders')
                  ->onDelete('set null');
        });
    }

    public function down(): void {
        Schema::table('decks', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn(['folder_id', 'order']);
        });
        
        Schema::dropIfExists('folders');
    }
};
?>
