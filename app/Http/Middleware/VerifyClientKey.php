<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifyClientKey
{
    public function handle(Request $request, Closure $next)
    {
        // 1) Jangan blokir preflight CORS
        //    Browser kirim OPTIONS tanpa header custom -> biarkan lewat.
        if ($request->isMethod('OPTIONS')) {
            return response('', 204);
        }

        // 2) Ambil daftar key yang diizinkan dari .env
        //    Contoh .env: WAREHOUSE_TRUSTED_KEYS=dev-panel-key-abc,another-key
        $raw = (string) env('WAREHOUSE_TRUSTED_KEYS', '');
        $allowed = array_filter(array_map('trim', explode(',', $raw)));

        // 3) Dev fallback: kalau env kosong, jangan blok (biar gak ngunci diri saat dev)
        if (!count($allowed)) {
            return $next($request);
        }

        // 4) Baca header dari request utama (GET/POST/...)
        $key = $request->header('X-CLIENT-KEY');

        if (!$key || !in_array($key, $allowed, true)) {
            return response()->json(['message' => 'Forbidden client'], 403);
        }

        return $next($request);
    }
}
