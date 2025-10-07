<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\CustomerProductInstance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TenantAuthController extends Controller
{
    /** STEP-1: verifikasi company (pusat) -> kembalikan tenant_hint */
    public function resolveCompany(Request $req)
    {
        $data = $req->validate([
            'company_id'       => 'required|string|max:100',
            'product_code'     => 'required|string|max:50',
            'company_password' => 'required|string|max:150',
        ]);

        $inst = CustomerProductInstance::where('product_code', $data['product_code'])
            ->where('company_id', $data['company_id'])
            ->first();

        if (!$inst || !$inst->company_password_hash) {
            return response()->json(['success'=>false,'message'=>'Company not found'], 404);
        }
        if (!Hash::check($data['company_password'], $inst->company_password_hash)) {
            return response()->json(['success'=>false,'message'=>'Invalid company password'], 401);
        }

        // Tenant hint (signed & short-lived)
        $payload    = $data['product_code'].'|'.$data['company_id'].'|'.time();
        $secret     = config('app.key');
        $tenantHint = base64_encode($payload.'.'.hash_hmac('sha256', $payload, $secret));

        return response()->json([
            'success' => true,
            'data' => [
                'tenant_hint'  => $tenantHint,
                'app_url'      => $inst->app_url,
                'database'     => $inst->database_name, // info; bukan credential
                'company_id'   => $inst->company_id,
                'product_code' => $inst->product_code,
            ]
        ]);
    }

    /** STEP-2: login user pada tenant sesuai tenant_hint */
    public function login(Request $req)
    {
        $data = $req->validate([
            'tenant_hint' => 'required|string',
            'username'    => 'required|string',
            'password'    => 'required|string',
        ]);

        $parsed = $this->parseTenantHint($data['tenant_hint']);
        if (!$parsed) return response()->json(['success'=>false,'message'=>'Invalid tenant hint'], 401);
        [$productCode, $companyId] = $parsed;

        $inst = CustomerProductInstance::where('product_code', $productCode)
            ->where('company_id', $companyId)->first();

        if (!$inst) return response()->json(['success'=>false,'message'=>'Tenant not found'], 404);

        $this->bindTenantConnection($inst->database_name);

        // 👉 Jika tabel user bukan 'users', ganti di sini.
        $user = DB::connection('tenant')->table('user_management')
            ->where(function($q) use ($data) {
                $q->where('username', $data['username'])
                  ->orWhere('email', $data['username']);
            })->first();

        if (!$user) return response()->json(['success'=>false,'message'=>'Invalid credentials'], 401);

        if (!password_verify($data['password'], $user->password)) {
            return response()->json(['success'=>false,'message'=>'Invalid credentials'], 401);
        }

        // TODO: terbitkan token (JWT/Sanctum) sesuai arsitektur kamu
        return response()->json([
            'success' => true,
            'data'    => [
                'user' => [
                    'id'       => $user->id,
                    'nama'     => $user->nama,
                    'email'    => $user->email ?? null,
                    'username' => $user->username ?? null,
                    'role'     => $user->role ?? null,
                    'company_id'   => $companyId,
                    'product_code' => $productCode,
                ],
            ],
        ]);
    }

    private function parseTenantHint(string $hint): ?array
    {
        $raw = base64_decode($hint, true);
        if (!$raw || !str_contains($raw, '.')) return null;

        [$payload, $sig] = explode('.', $raw, 2);
        $secret = config('app.key');
        if (!hash_equals(hash_hmac('sha256', $payload, $secret), $sig)) return null;

        $parts = explode('|', $payload);
        if (count($parts) !== 3) return null;

        [$productCode, $companyId, $ts] = $parts;
        if (time() - (int)$ts > 600) return null; // expire 10 menit

        return [$productCode, $companyId];
    }

    private function bindTenantConnection(string $dbName): void
    {
        config(['database.connections.tenant' => [
            'driver'   => 'mysql',
            'host'     => env('DB_HOST','127.0.0.1'),
            'port'     => env('DB_PORT','3306'),
            'database' => $dbName,
            'username' => env('DB_USERNAME','root'),
            'password' => env('DB_PASSWORD',''),
            'charset'  => 'utf8mb4',
            'collation'=> 'utf8mb4_unicode_ci',
            'prefix'   => '',
            'strict'   => false,
        ]]);
    }
}
