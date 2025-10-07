<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifyGatewayKey
{
    public function handle(Request $request, Closure $next)
    {
        $allowed = array_filter(array_map('trim', explode(',', (string) config('app.allowed_gateway_keys'))));
        $key = $request->header('X-AG-KEY');

        if (!count($allowed)) {
            // Dev convenience: kalau ALLOWED_GATEWAY_KEYS kosong, jangan blokir.
            // Untuk PROD, wajib isi env agar aman.
            return $next($request);
        }

        if (!$key || !in_array($key, $allowed, true)) {
            return response()->json(['message' => 'Forbidden (bad key)'], 403);
        }

        return $next($request);
    }
}
