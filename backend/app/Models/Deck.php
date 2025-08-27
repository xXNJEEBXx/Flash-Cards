<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Deck extends Model
{
    use HasFactory;
    protected $fillable = ['title', 'description'];
    public function cards(): HasMany { return $this->hasMany(Card::class); }
}
?>
