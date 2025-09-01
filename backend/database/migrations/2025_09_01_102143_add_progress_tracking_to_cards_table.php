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
        Schema::table('cards', function (Blueprint $table) {
            $table->integer('times_seen')->default(0); // عدد مرات عرض البطاقة
            $table->integer('times_known')->default(0); // عدد مرات الإجابة الصحيحة
            $table->timestamp('last_seen_at')->nullable(); // آخر مرة تم عرضها
            $table->timestamp('last_known_at')->nullable(); // آخر مرة تم إتقانها
            $table->boolean('is_difficult')->default(false); // هل البطاقة صعبة
        });
    }

    public function down(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->dropColumn([
                'times_seen',
                'times_known', 
                'last_seen_at',
                'last_known_at',
                'is_difficult'
            ]);
        });
    }
};
