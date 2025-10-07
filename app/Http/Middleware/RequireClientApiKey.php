<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireClientApiKey
{
    public function handle(Request $request, Closure $next)
    {
        $expected = config('warehouse.client_key');
        $given    = $request->header('X-API-KEY');
        if (!$expected || !$given || !hash_equals($expected, $given)) {
            return response()->json(['ok'=>false,'error'=>'UNAUTHORIZED'], 401);
        }
        return $next($request);
    }
}
