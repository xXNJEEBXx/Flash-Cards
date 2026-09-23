<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GzipResponse
{
    /**
     * Handle an incoming request and compress response with gzip if supported.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Check if gzencode is available and client accepts gzip
        if (
            function_exists('gzencode') &&
            str_contains((string) $request->header('Accept-Encoding', ''), 'gzip') &&
            !$response->headers->has('Content-Encoding')
        ) {
            $content = $response->getContent();

            // Compress if content is larger than 1KB to gain tangible speed improvements
            if (is_string($content) && strlen($content) > 1024) {
                $compressed = gzencode($content, 5);
                if ($compressed !== false) {
                    $response->setContent($compressed);
                    $response->headers->set('Content-Encoding', 'gzip');
                    $response->headers->set('Content-Length', (string) strlen($compressed));
                    $response->headers->set('Vary', 'Accept-Encoding');
                }
            }
        }

        return $response;
    }
}
