<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserSettings;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserSettingsController extends Controller
{
    /**
     * Resolve identifying key for settings: prefer user_id when provided, otherwise session_token.
     * Never mix both or use null in the key to avoid matching unintended rows.
     */
    private function resolveKey(Request $request): array
    {
        // If you add auth later, prefer the authenticated user id
        $userId = $request->input('user_id');
        if (!empty($userId)) {
            return ['user_id' => $userId];
        }

        $token = $request->header('X-Session-Token') ?? $request->input('session_token');
        if (!empty($token)) {
            return ['session_token' => $token];
        }

        return [];
    }

    /**
     * Find settings by the resolved key.
     */
    private function findSettingsByKey(array $key): ?UserSettings
    {
        if (empty($key)) return null;
        $field = array_key_first($key);
        $value = $key[$field];
        return UserSettings::where($field, $value)->first();
    }

    /**
     * جلب إعدادات المستخدم أو الضيف
     */
    public function show(Request $request): JsonResponse
    {
        $key = $this->resolveKey($request);
        if (empty($key)) {
            return response()->json([
                'success' => false,
                'message' => 'Missing session token or user id'
            ], 400);
        }

        $settings = $this->findSettingsByKey($key);

        if (!$settings) {
            // إنشاء إعدادات افتراضية
            $settings = UserSettings::create(array_merge($key, [
                'smart_mode_enabled' => false,
                'hide_mastered_cards' => false,
                'shuffle_mode' => false,
                'unmastered_cards' => [],
                'current_deck_id' => null,
                'current_card_index' => 0
            ]));
        }

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * تحديث إعدادات المستخدم
     */
    public function update(Request $request): JsonResponse
    {
        $key = $this->resolveKey($request);
        if (empty($key)) {
            return response()->json([
                'success' => false,
                'message' => 'Missing session token or user id'
            ], 400);
        }
        
        $validated = $request->validate([
            'smart_mode_enabled' => 'boolean',
            'hide_mastered_cards' => 'boolean',
            'shuffle_mode' => 'boolean',
            'unmastered_cards' => 'array',
            'current_deck_id' => 'nullable|exists:decks,id',
            'current_card_index' => 'integer|min:0'
        ]);

        $settings = UserSettings::updateOrCreate($key, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => $settings
        ]);
    }

    /**
     * إضافة بطاقة لقائمة غير المتقنة
     */
    public function addUnmasteredCard(Request $request): JsonResponse
    {
        $key = $this->resolveKey($request);
        if (empty($key)) {
            return response()->json([
                'success' => false,
                'message' => 'Missing session token or user id'
            ], 400);
        }
        
        $validated = $request->validate([
            'card_id' => 'required|exists:cards,id'
        ]);

        $settings = $this->findSettingsByKey($key);

        if (!$settings) {
            return response()->json([
                'success' => false,
                'message' => 'Settings not found'
            ], 404);
        }

        $unmasteredCards = $settings->unmastered_cards ?? [];
        
        if (!in_array($validated['card_id'], $unmasteredCards)) {
            $unmasteredCards[] = $validated['card_id'];
            $settings->update(['unmastered_cards' => $unmasteredCards]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Card added to unmastered list',
            'unmastered_count' => count($unmasteredCards)
        ]);
    }

    /**
     * إزالة بطاقة من قائمة غير المتقنة
     */
    public function removeUnmasteredCard(Request $request): JsonResponse
    {
        $key = $this->resolveKey($request);
        if (empty($key)) {
            return response()->json([
                'success' => false,
                'message' => 'Missing session token or user id'
            ], 400);
        }
        
        $validated = $request->validate([
            'card_id' => 'required|exists:cards,id'
        ]);

        $settings = $this->findSettingsByKey($key);

        if (!$settings) {
            return response()->json([
                'success' => false,
                'message' => 'Settings not found'
            ], 404);
        }

        $unmasteredCards = $settings->unmastered_cards ?? [];
        $unmasteredCards = array_values(array_filter($unmasteredCards, fn($id) => $id != $validated['card_id']));
        
        $settings->update(['unmastered_cards' => $unmasteredCards]);

        return response()->json([
            'success' => true,
            'message' => 'Card removed from unmastered list',
            'unmastered_count' => count($unmasteredCards)
        ]);
    }

    /**
     * إعادة تعيين الإعدادات
     */
    public function reset(Request $request): JsonResponse
    {
        $key = $this->resolveKey($request);
        if (empty($key)) {
            return response()->json([
                'success' => false,
                'message' => 'Missing session token or user id'
            ], 400);
        }

        $settings = $this->findSettingsByKey($key);

        if ($settings) {
            $settings->update([
                'smart_mode_enabled' => false,
                'hide_mastered_cards' => false,
                'shuffle_mode' => false,
                'unmastered_cards' => [],
                'current_deck_id' => null,
                'current_card_index' => 0
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings reset successfully'
        ]);
    }
}
