<?php

use Illuminate\Support\Facades\DB;

// إنشاء الجداول مباشرة باستخدام SQL
try {
    echo "Creating migrations table...\n";
    DB::statement("
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            migration VARCHAR(255) NOT NULL,
            batch INTEGER NOT NULL
        )
    ");
    
    echo "Creating users table...\n";
    DB::statement("
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            email_verified_at TIMESTAMP NULL,
            password VARCHAR(255) NOT NULL,
            remember_token VARCHAR(100) NULL,
            created_at TIMESTAMP NULL,
            updated_at TIMESTAMP NULL
        )
    ");
    
    echo "Creating cache table...\n";
    DB::statement("
        CREATE TABLE IF NOT EXISTS cache (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT NOT NULL,
            expiration INTEGER NOT NULL
        )
    ");
    
    echo "Creating cache_locks table...\n";
    DB::statement("
        CREATE TABLE IF NOT EXISTS cache_locks (
            key VARCHAR(255) PRIMARY KEY,
            owner VARCHAR(255) NOT NULL,
            expiration INTEGER NOT NULL
        )
    ");
    
    echo "Creating jobs table...\n";
    DB::statement("
        CREATE TABLE IF NOT EXISTS jobs (
            id BIGSERIAL PRIMARY KEY,
            queue VARCHAR(255) NOT NULL,
            payload TEXT NOT NULL,
            attempts SMALLINT NOT NULL,
            reserved_at INTEGER NULL,
            available_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        )
    ");
    
    echo "Creating job_batches table...\n";
    DB::statement("
        CREATE TABLE IF NOT EXISTS job_batches (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            total_jobs INTEGER NOT NULL,
            pending_jobs INTEGER NOT NULL,
            failed_jobs INTEGER NOT NULL,
            failed_job_ids TEXT NOT NULL,
            options TEXT NULL,
            cancelled_at INTEGER NULL,
            created_at INTEGER NOT NULL,
            finished_at INTEGER NULL
        )
    ");
    
    echo "Creating failed_jobs table...\n";
    DB::statement("
        CREATE TABLE IF NOT EXISTS failed_jobs (
            id BIGSERIAL PRIMARY KEY,
            uuid VARCHAR(255) UNIQUE NOT NULL,
            connection TEXT NOT NULL,
            queue TEXT NOT NULL,
            payload TEXT NOT NULL,
            exception TEXT NOT NULL,
            failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    echo "Creating decks table...\n";
    DB::statement("
        CREATE TABLE IF NOT EXISTS decks (
            id BIGSERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            created_at TIMESTAMP NULL,
            updated_at TIMESTAMP NULL
        )
    ");
    
    echo "Creating cards table...\n";
    DB::statement("
        CREATE TABLE IF NOT EXISTS cards (
            id BIGSERIAL PRIMARY KEY,
            deck_id BIGINT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            difficulty VARCHAR(255) DEFAULT 'medium',
            created_at TIMESTAMP NULL,
            updated_at TIMESTAMP NULL,
            FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
        )
    ");
    
    // إضافة فهارس
    echo "Creating indexes...\n";
    DB::statement("CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id)");
    DB::statement("CREATE INDEX IF NOT EXISTS idx_cache_expiration ON cache(expiration)");
    DB::statement("CREATE INDEX IF NOT EXISTS idx_jobs_queue ON jobs(queue)");
    
    // إدراج السجلات في جدول migrations
    echo "Updating migrations table...\n";
    DB::table('migrations')->insertOrIgnore([
        ['migration' => '0001_01_01_000000_create_users_table', 'batch' => 1],
        ['migration' => '0001_01_01_000001_create_cache_table', 'batch' => 1],
        ['migration' => '0001_01_01_000002_create_jobs_table', 'batch' => 1],
        ['migration' => '2025_01_01_000000_create_decks_table', 'batch' => 1],
        ['migration' => '2025_01_01_000001_create_cards_table', 'batch' => 1],
    ]);
    
    echo "✅ All tables created successfully!\n";
    
    // إدراج بيانات تجريبية
    echo "Inserting sample data...\n";
    
    $deckId = DB::table('decks')->insertGetId([
        'title' => 'Cybersecurity Basics',
        'description' => 'Basic cybersecurity concepts and terminology',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    DB::table('cards')->insert([
        [
            'deck_id' => $deckId,
            'question' => 'What is a firewall?',
            'answer' => 'A network security device that monitors and controls incoming and outgoing network traffic based on predetermined security rules.',
            'difficulty' => 'easy',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'deck_id' => $deckId,
            'question' => 'What does SSL stand for?',
            'answer' => 'Secure Sockets Layer - a cryptographic protocol designed to provide communications security over a computer network.',
            'difficulty' => 'medium',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'deck_id' => $deckId,
            'question' => 'What is a zero-day vulnerability?',
            'answer' => 'A security flaw in software that is unknown to the vendor and for which no patch exists, making it particularly dangerous.',
            'difficulty' => 'hard',
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);
    
    echo "✅ Sample data inserted successfully!\n";
    echo "Database setup complete!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
