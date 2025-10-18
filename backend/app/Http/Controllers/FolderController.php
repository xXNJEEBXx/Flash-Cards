<?php
namespace App\Http\Controllers;

use App\Models\Folder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FolderController extends Controller
{
    /**
     * Get all folders with their hierarchy
     */
    public function index()
    {
        try {
            // Get only root folders (folders with no parent)
            $folders = Folder::whereNull('parent_folder_id')
                ->orderBy('order')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $folders
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch folders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific folder with its contents
     */
    public function show($id)
    {
        try {
            $folder = Folder::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $folder
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create a new folder
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_folder_id' => 'nullable|exists:folders,id',
            'order' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $folder = Folder::create($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Folder created successfully',
                'data' => $folder->load(['subfolders', 'decks'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a folder
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'parent_folder_id' => 'nullable|exists:folders,id',
            'order' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $folder = Folder::findOrFail($id);
            
            // Prevent circular reference
            if ($request->has('parent_folder_id') && $request->parent_folder_id !== null) {
                $parentFolder = Folder::find($request->parent_folder_id);
                if ($parentFolder && ($parentFolder->id === $folder->id || $parentFolder->isDescendantOf($folder->id))) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot move folder into itself or its subfolder'
                    ], 422);
                }
            }
            
            $folder->update($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Folder updated successfully',
                'data' => $folder->fresh(['subfolders', 'decks'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a folder
     */
    public function destroy($id)
    {
        try {
            $folder = Folder::findOrFail($id);
            
            // Move decks to parent folder or root level
            $folder->decks()->update(['folder_id' => $folder->parent_folder_id]);
            
            // Move subfolders to parent folder or root level
            $folder->subfolders()->update(['parent_folder_id' => $folder->parent_folder_id]);
            
            $folder->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Folder deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Move a deck to a folder
     */
    public function moveDeck(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'deck_id' => 'required|exists:decks,id',
            'order' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $folder = Folder::findOrFail($id);
            $deck = \App\Models\Deck::findOrFail($request->deck_id);
            
            $deck->update([
                'folder_id' => $folder->id,
                'order' => $request->order ?? 0
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Deck moved successfully',
                'data' => $deck
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to move deck',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a deck from a folder (move to root)
     */
    public function removeDeck(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'deck_id' => 'required|exists:decks,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $deck = \App\Models\Deck::findOrFail($request->deck_id);
            $deck->update(['folder_id' => null]);
            
            return response()->json([
                'success' => true,
                'message' => 'Deck moved to root',
                'data' => $deck
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove deck from folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
?>
