<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deck extends Model
{
    use HasFactory;
    protected $fillable = ['title', 'description', 'folder_id', 'order'];
    
    public function cards(): HasMany { 
        return $this->hasMany(Card::class); 
    }
    
    public function folder(): BelongsTo {
        return $this->belongsTo(Folder::class);
    }
}
?>
