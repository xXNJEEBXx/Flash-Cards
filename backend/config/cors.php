<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        // Add your production frontend URLs here
        // 'https://your-app.vercel.app',
        // 'https://your-domain.com'
    ],
    'allowed_origins_patterns' => [
        // Allow all Vercel preview deployments
        '/^https:\/\/.*\.vercel\.app$/',
        // Allow all Netlify deployments
        '/^https:\/\/.*\.netlify\.app$/',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
