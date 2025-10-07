<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class JwtEnsureType
{
    // Pakai: ->middleware('jwt.typ:company') atau ->middleware('jwt.typ:user')
    public function handle(Request $request, Closure $next, string $required)
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $typ = $payload->get('typ'); // ✅ pakai get()
        if ($typ !== $required) {
            return response()->json(['message' => 'Invalid token type'], 403);
        }

        // sisipkan konteks umum
        if ($typ === 'company') {
            $request->merge([
                'company_id' => (string) ($payload->get('company_id') ?: $payload->get('sub')),
                '_jwt_typ'   => 'company',
            ]);
        }

        if ($typ === 'user') {
            $request->merge([
                'company_id' => (string) ($payload->get('company_id') ?: ''),
                'level_id'   => (string) ($payload->get('level_id') ?: ''),
                'perms'      => $payload->get('perms') ?: [],
                '_jwt_typ'   => 'user',
            ]);
        }

        return $next($request);
    }
}
