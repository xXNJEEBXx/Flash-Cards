<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Folder extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'parent_folder_id', 'order'];

    protected $with = ['subfolders', 'decks'];

    /**
     * Get the parent folder
     */
    public function parentFolder(): BelongsTo
    {
        return $this->belongsTo(Folder::class, 'parent_folder_id');
    }

    /**
     * Get all subfolders
     */
    public function subfolders(): HasMany
    {
        return $this->hasMany(Folder::class, 'parent_folder_id')->orderBy('order');
    }

    /**
     * Get all decks in this folder
     */
    public function decks(): HasMany
    {
        return $this->hasMany(Deck::class)->orderBy('order');
    }

    /**
     * Check if this folder is a descendant of another folder
     */
    public function isDescendantOf($folderId): bool
    {
        if ($this->parent_folder_id === null) {
            return false;
        }

        if ($this->parent_folder_id === $folderId) {
            return true;
        }

        return $this->parentFolder && $this->parentFolder->isDescendantOf($folderId);
    }
}
