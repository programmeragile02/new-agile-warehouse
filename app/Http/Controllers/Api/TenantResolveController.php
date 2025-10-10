<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class TenantResolveController extends Controller
{
    /**
     * Authenticate company_id + password untuk suatu product_code.
     * Mengembalikan info DB tenant bila valid.
     */
    public function authenticate(Request $req)
    {
        $req->validate([
            'company_id'       => 'required|string',
            'product_code'     => 'required|string',
            'company_password' => 'required|string',
        ]);

        $companyId   = $req->input('company_id');
        $productCode = $req->input('product_code');
        $password    = (string) $req->input('company_password');

        // Rate limit (5 attempt / menit per IP+company)
        $rlKey = "tenant-auth:{$companyId}|".$req->ip();
        if (RateLimiter::tooManyAttempts($rlKey, 5)) {
            $seconds = RateLimiter::availableIn($rlKey);
            return response()->json([
                'ok' => false, 'error' => 'TOO_MANY_ATTEMPTS', 'retry_in' => $seconds
            ], 429);
        }

        $inst = DB::table('customer_product_instances')
            ->where('company_id', $companyId)
            ->where('product_code', $productCode)
            ->where('is_active', 1)
            ->orderByDesc('created_at')
            ->first();

        if (!$inst) {
            RateLimiter::hit($rlKey, 60);
            return response()->json(['ok'=>false,'error'=>'INSTANCE_NOT_FOUND'], 404);
        }

        // Verifikasi password (hash diutamakan, legacy plain fallback + self-heal)
        $hash  = (string) ($inst->company_password_hash ?? '');
        $plain = (string) ($inst->company_password_plain ?? '');
        $passOk = false;

        if ($hash !== '') {
            $passOk = Hash::check($password, $hash);
        } elseif ($plain !== '') {
            $passOk = hash_equals($plain, $password);
            if ($passOk) {
                DB::table('customer_product_instances')
                    ->where('id', $inst->id)
                    ->update([
                        'company_password_hash' => Hash::make($password),
                        'company_password_plain' => null, // hapus plain demi keamanan
                        'updated_at' => now(),
                    ]);
            }
        }

        if (!$passOk) {
            RateLimiter::hit($rlKey, 60);
            return response()->json(['ok'=>false,'error'=>'INVALID_PASSWORD'], 401);
        }

        RateLimiter::clear($rlKey);

        // Susun DATABASE_URL dari env Warehouse + nama DB tenant
        $user = env('DB_USERNAME','root');
        $pass = env('DB_PASSWORD','');
        $host = env('DB_HOST','127.0.0.1');
        $port = env('DB_PORT','3306');
        $dbUrl = sprintf('mysql://%s:%s@%s:%s/%s',
            $user, urlencode($pass), $host, $port, $inst->database_name
        );

        return response()->json([
            'ok'   => true,
            'data' => [
                'company_id'   => $inst->company_id,
                'product_code' => $inst->product_code,
                'db_url'       => $dbUrl,
                'package_code' => $inst->package_code,
                'app_url'      => $inst->app_url,
                'subscription_instance_id' => $inst->subscription_instance_id,
            ]
        ]);
    }
}