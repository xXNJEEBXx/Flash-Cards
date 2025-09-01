<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSettings extends Model
{
    use HasFactory;

    protected $fillable = [
    'session_token',
        'user_id',
        'smart_mode_enabled',
        'hide_mastered_cards',
        'shuffle_mode',
        'unmastered_cards',
        'current_deck_id',
        'current_card_index'
    ];

    protected $casts = [
        'smart_mode_enabled' => 'boolean',
        'hide_mastered_cards' => 'boolean', 
        'shuffle_mode' => 'boolean',
        'unmastered_cards' => 'array',
        'current_card_index' => 'integer'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function deck()
    {
        return $this->belongsTo(Deck::class, 'current_deck_id');
    }
}
