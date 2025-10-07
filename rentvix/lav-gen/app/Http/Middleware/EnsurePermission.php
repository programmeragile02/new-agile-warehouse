<?php

namespace App\Http\Middleware;

use App\Models\AccessControlMatrix;
use Closure;
use Illuminate\Http\Request;

class EnsurePermission
{
    /**
     * Pakai: ->middleware('perm:view,123')  atau  ->middleware('perm:view,kendaraan-armada::Daftar Kendaraan')
     * $action: view|add|edit|delete|approve
     * $menuRef: angka (menu_id) atau string (menu_key)
     */
    public function handle(Request $request, Closure $next, string $action, string $menuRef)
    {
        $allowed = false;

        // normalisasi: apakah $menuRef numerik?
        $isNumeric = ctype_digit($menuRef); // string numerik murni
        $wantId  = $isNumeric ? (int) $menuRef : null;
        $wantKey = $isNumeric ? null : $menuRef;

        // 1) Cek cepat dari klaim perms yang disuntik middleware JWT
        $perms = $request->get('perms');
        if (is_array($perms)) {
            foreach ($perms as $p) {
                $matchId  = $wantId !== null && (int)($p['menu_id'] ?? 0) === $wantId;
                $matchKey = $wantKey !== null && (string)($p['menu_key'] ?? '') === $wantKey;

                if ($matchId || $matchKey) {
                    $allowed = (bool) ($p[$action] ?? false);
                    break;
                }
            }
        }

        // 2) Fallback ke DB (jika klaim kosong atau item belum ada di klaim)
        if (!$allowed) {
            $levelId = $request->get('level_id');
            if ($levelId) {
                $q = AccessControlMatrix::query()->where('user_level_id', $levelId);
                if ($wantId !== null) $q->where('menu_id', $wantId);
                if ($wantKey !== null) $q->orWhere(function ($qq) use ($levelId, $wantKey) {
                    $qq->where('user_level_id', $levelId)->where('menu_key', $wantKey);
                });

                $row = $q->first();
                if ($row && (bool) $row->{$action}) {
                    $allowed = true;
                }
            }
        }

        if (!$allowed) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
