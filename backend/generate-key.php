<?php

// Generate Laravel APP_KEY for Railway deployment
// Run this script and copy the generated key to Railway environment variables

require_once 'vendor/autoload.php';

use Illuminate\Encryption\Encrypter;

// Generate a random 32-byte key
$key = random_bytes(32);

// Encode it as base64 (Laravel format)
$encoded = 'base64:' . base64_encode($key);

echo "Generated APP_KEY for Railway:\n";
echo $encoded . "\n";
echo "\nCopy this key and add it to Railway environment variables as:\n";
echo "APP_KEY=" . $encoded . "\n";
