<?php

// نسخ البيانات من قاعدة البيانات المحلية إلى ملف JSON
// استخدم هذا السكريبت لنقل بياناتك إلى Railway

require_once 'vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as DB;
use Illuminate\Database\Schema\Blueprint;

// إعداد اتصال قاعدة البيانات
$capsule = new DB;
$capsule->addConnection([
    'driver' => 'sqlite',
    'database' => __DIR__ . '/database/database.sqlite',
    'prefix' => '',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

try {
    echo "🔍 جاري تصدير البيانات من قاعدة البيانات المحلية...\n\n";

    // جلب جميع المجموعات
    $decks = DB::table('decks')->get();
    echo "📚 تم العثور على " . count($decks) . " مجموعة\n";

    // جلب جميع البطاقات
    $cards = DB::table('cards')->get();
    echo "🎴 تم العثور على " . count($cards) . " بطاقة\n";

    // جلب إعدادات المستخدم
    $userSettings = DB::table('user_settings')->get();
    echo "⚙️ تم العثور على " . count($userSettings) . " إعداد مستخدم\n";

    // تجميع البيانات
    $exportData = [
        'export_info' => [
            'exported_at' => date('Y-m-d H:i:s'),
            'source' => 'localhost',
            'destination' => 'railway_production',
            'total_decks' => count($decks),
            'total_cards' => count($cards),
            'total_settings' => count($userSettings)
        ],
        'decks' => $decks->toArray(),
        'cards' => $cards->toArray(),
        'user_settings' => $userSettings->toArray()
    ];

    // حفظ في ملف JSON
    $filename = 'database_export_' . date('Y-m-d_H-i-s') . '.json';
    $filepath = __DIR__ . '/' . $filename;
    
    file_put_contents($filepath, json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo "\n✅ تم تصدير البيانات بنجاح!\n";
    echo "📁 ملف التصدير: {$filename}\n";
    echo "📍 المسار الكامل: {$filepath}\n\n";

    echo "🚀 الخطوة التالية:\n";
    echo "1. ارفع هذا الملف إلى GitHub\n";
    echo "2. أنشئ Seeder جديد في Laravel\n";
    echo "3. استورد البيانات في Railway\n\n";

    // عرض عينة من البيانات
    echo "📋 عينة من البيانات المصدرة:\n";
    if (count($decks) > 0) {
        echo "- مجموعة: " . $decks->first()->title . "\n";
    }
    if (count($cards) > 0) {
        echo "- بطاقة: " . substr($cards->first()->question, 0, 50) . "...\n";
    }

} catch (Exception $e) {
    echo "❌ خطأ في التصدير: " . $e->getMessage() . "\n";
    echo "تأكد من تشغيل السكريبت من مجلد backend وأن قاعدة البيانات موجودة.\n";
}
