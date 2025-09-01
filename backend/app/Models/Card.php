<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Card extends Model
{
    use HasFactory;

    protected $fillable = [
        'question',
        'answer',
        'known',
        'deck_id',
        'times_seen',
        'times_known',
        'last_seen_at',
        'last_known_at',
        'is_difficult'
    ];

    protected $casts = [
        'known' => 'boolean',
        'is_difficult' => 'boolean',
        'times_seen' => 'integer',
        'times_known' => 'integer',
        'last_seen_at' => 'datetime',
        'last_known_at' => 'datetime'
    ];

    public function deck(): BelongsTo
    {
        return $this->belongsTo(Deck::class);
    }

    // حساب نسبة النجاح
    public function getSuccessRateAttribute()
    {
        if ($this->times_seen === 0) return 0;
        return round(($this->times_known / $this->times_seen) * 100, 2);
    }

    // تحديث إحصائيات البطاقة عند العرض
    public function markAsSeen()
    {
        $this->increment('times_seen');
        $this->update(['last_seen_at' => now()]);
    }

    // تحديث إحصائيات البطاقة عند الإتقان
    public function markAsKnown()
    {
        $this->increment('times_known');
        $this->update([
            'known' => true,
            'last_known_at' => now(),
            'is_difficult' => false
        ]);
    }

    // تحديد البطاقة كصعبة
    public function markAsDifficult()
    {
        $this->update(['is_difficult' => true, 'known' => false]);
    }
}
