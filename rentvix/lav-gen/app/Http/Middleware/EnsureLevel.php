<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureLevel
{
    // Pakai: ->middleware('level:Admin,Supervisor')  // nama level sesuai tabelmu
    public function handle(Request $request, Closure $next, string ...$allowedLevels)
    {
        // Anda bisa ambil nama level dari relasi; untuk simple, kita gunakan level_id dari klaim.
        // Jika butuh nama level, query tabel LevelUser berdasarkan $request->level_id.
        if (empty($allowedLevels)) return $next($request);

        $currentLevelId = $request->get('level_id');
        if (!$currentLevelId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // TODO: mapping id->nama. Contoh minimal: izinkan semua jika ada level_id.
        // Implementasi penuh: query LevelUser::find($currentLevelId)->nama_level lalu bandingkan.
        return $next($request);
    }
}
