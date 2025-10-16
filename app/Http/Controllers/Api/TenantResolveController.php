<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class TenantResolveController extends Controller
{
    /**
     * POST /api/tenant/resolve-login
     * body: { product_code, email, password }
     * return: { ok:true, data:{ company_id, product_code, db_url, package_code, app_url, subscription_instance_id } }
     */
    public function resolveLogin(Request $req)
    {
        $req->validate([
            'product_code' => 'required|string',
            'email'        => 'required|string',
            'password'     => 'required|string',
        ]);

        $pc    = trim((string) $req->input('product_code'));
        $email = strtolower(trim((string) $req->input('email')));
        $pass  = (string) $req->input('password');

        // Ambil baris user unik (constraint uq_cpiu_prod_email memastikan tunggal)
        $rows = DB::table('customer_product_instance_users as u')
            ->join('customer_product_instances as i', function ($j) {
                $j->on('i.company_id', '=', 'u.company_id')
                ->on('i.product_code', '=', 'u.product_code');
            })
            ->where('u.product_code', $pc)
            ->whereRaw('LOWER(u.email) = ?', [$email])
            ->where('u.is_active', 1)
            ->where('i.is_active', 1)
            ->orderByDesc('i.created_at')
            ->select(
                'u.id as u_id',
                'u.company_id', 'u.password_plain', 'u.password_hash',
                'i.product_code','i.package_code','i.app_url',
                'i.subscription_instance_id','i.database_name',
                'i.database_host','i.database_port',
                'i.database_username','i.database_password_enc','i.end_date'
            )
            ->get();

        if ($rows->isEmpty()) {
            usleep(180 * 1000);
            return response()->json(['ok'=>false,'error'=>'USER_NOT_FOUND'], 404);
        }
        if ($rows->count() > 1) {
            // Harusnya tidak terjadi karena uq_cpiu_prod_email
            return response()->json(['ok'=>false,'error'=>'DUPLICATE_EMAIL_CONFLICT'], 409);
        }

        $r = $rows->first();

        // === VERIFIKASI AMAN ===
        $ok = false;
        $hash = (string)($r->password_hash ?? '');
        $plainStored = (string)($r->password_plain ?? '');

        // 1) Jika ada hash: periksa apakah kelihatan BCRYPT (cek prefix / password_get_info)
        if ($hash !== '') {
            $info = password_get_info($hash);
            $algoName = $info['algoName'] ?? '';

            // aturan sederhana: terima jika algoName == 'bcrypt' atau prefix $2y$/$2a$/$2b$
            $looksLikeBcrypt = $algoName === 'bcrypt' ||
                str_starts_with($hash, '$2y$') ||
                str_starts_with($hash, '$2a$') ||
                str_starts_with($hash, '$2b$');

            if ($looksLikeBcrypt) {
                try {
                    $ok = Hash::check($pass, $hash);
                } catch (\Throwable $e) {
                    // proteksi tambahan: kalau Hash::check melempar, jadikan false dan fallback ke plaintext
                    $ok = false;
                }
            } else {
                // hash ada tapi bukan bcrypt → jangan panggil Hash::check() (unsafe)
                $ok = false;
            }
        }

        // 2) Fallback ke password_plain (legacy). Jika cocok, lakukan self-heal: buat bcrypt dan simpan.
        if (!$ok && $plainStored !== '') {
            // gunakan hash_equals untuk menghindari timing attack
            if (hash_equals($plainStored, $pass)) {
                $ok = true;
                try {
                    // self-heal: simpan bcrypt agar berikutnya aman
                    $newHash = Hash::make($pass);
                    DB::table('customer_product_instance_users')
                        ->where('product_code', $pc)
                        ->whereRaw('LOWER(email) = ?', [$email])
                        ->update(['password_hash' => $newHash, 'updated_at' => now()]);
                } catch (\Throwable $e) {
                    // logging tapi jangan gagal login karena self-heal gagal
                    \Log::warning('CPIU self-heal failed', ['email'=>$email,'err'=>$e->getMessage()]);
                }
            }
        }

        if (!$ok) {
            usleep(180 * 1000);
            return response()->json(['ok'=>false,'error'=>'INVALID_CREDENTIALS'], 401);
        }

        // cek masa berlaku instance
        if (!empty($r->end_date)) {
            $active = now()->lte(Carbon::parse($r->end_date)->endOfDay());
            if (!$active) {
                return response()->json(['ok'=>false,'error'=>'INSTANCE_INACTIVE_OR_EXPIRED'], 403);
            }
        }

        // compose DSN
        $dbName = (string)($r->database_name ?? '');
        if ($dbName === '') {
            return response()->json(['ok'=>false,'error'=>'DB_NAME_MISSING'], 500);
        }
        $host  = (string)($r->database_host ?? env('DB_HOST','127.0.0.1'));
        $port  = (string)($r->database_port ?? env('DB_PORT','3306'));
        $dbUsr = (string)($r->database_username ?? env('DB_USERNAME','root'));
        $dbPwd = null;
        if (!empty($r->database_password_enc)) {
            try { $dbPwd = Crypt::decryptString((string)$r->database_password_enc); } catch (\Throwable $e) { $dbPwd = null; }
        }
        if ($dbPwd === null) $dbPwd = env('DB_PASSWORD','');

        $dsn = sprintf(
            'mysql://%s:%s@%s:%s/%s',
            rawurlencode($dbUsr), rawurlencode($dbPwd),
            $host, $port, $dbName
        );

        return response()->json([
            'ok'   => true,
            'data' => [
                'company_id'               => (string)$r->company_id,
                'product_code'             => (string)$r->product_code,
                'db_url'                   => $dsn,
                'package_code'             => (string)($r->package_code ?? ''),
                'app_url'                  => (string)($r->app_url ?? ''),
                'subscription_instance_id' => (string)($r->subscription_instance_id ?? ''),
            ]
        ]);
    }

    /**
     * GET /api/tenants/resolve?company_id=...&product_code=...
     * Tanpa password company. Hanya untuk discovery tenant DB & paket.
     * Wajib dibatasi dengan middleware kunci klien (mis. VerifyClientKey).
     */
    public function resolve(Request $req)
    {
        $req->validate([
            'company_id'   => 'required|string',
            'product_code' => 'required|string',
        ]);

        $companyId   = trim((string) $req->query('company_id'));
        $productCode = trim((string) $req->query('product_code'));

        // Rate limit: 30/min per IP+company+product (discovery relatif aman, tapi tetap dibatasi)
        $rlKey = sprintf('tenant-resolve:%s|%s|%s', $companyId, $productCode, $req->ip());
        if (RateLimiter::tooManyAttempts($rlKey, 30)) {
            $seconds = RateLimiter::availableIn($rlKey);
            return response()->json([
                'ok' => false, 'error' => 'TOO_MANY_ATTEMPTS', 'retry_in' => $seconds
            ], 429);
        }

        // Ambil instance terbaru untuk company_id + product_code
        $inst = DB::table('customer_product_instances')
            ->where('company_id', $companyId)
            ->where('product_code', $productCode)
            ->orderByDesc('created_at')
            ->first();

        if (!$inst) {
            RateLimiter::hit($rlKey, 60);
            return response()->json(['ok' => false, 'error' => 'INSTANCE_NOT_FOUND'], 404);
        }

        // Validasi aktif/masa berlaku (kalau end_date ada)
        $isActive   = (int)($inst->is_active ?? 0) === 1;
        $notExpired = true;
        if (!empty($inst->end_date)) {
            $notExpired = now()->lte(\Carbon\Carbon::parse($inst->end_date)->endOfDay());
        }
        if (!$isActive || !$notExpired) {
            RateLimiter::hit($rlKey, 60);
            return response()->json(['ok' => false, 'error' => 'INSTANCE_INACTIVE_OR_EXPIRED'], 403);
        }

        // Susun DB URL (lebih aman jika pakai user-tenant hasil provisioning)
        $dbName = (string)($inst->database_name ?? '');
        if ($dbName === '') {
            return response()->json(['ok' => false, 'error' => 'DB_NAME_MISSING'], 500);
        }

        $host = (string)($inst->database_host ?? env('DB_HOST', '127.0.0.1'));
        $port = (string)($inst->database_port ?? env('DB_PORT', '3306'));

        $dbUser = (string)($inst->database_username ?? '');
        $dbPass = null;
        if (!empty($inst->database_password_enc)) {
            try {
                $dbPass = Crypt::decryptString($inst->database_password_enc);
            } catch (\Throwable $e) {
                $dbPass = null;
            }
        }

        // Fallback ke ENV jika user-tenant belum tersedia (legacy)
        if ($dbUser === '' || $dbPass === null) {
            $dbUser = env('DB_USERNAME', 'root');
            $dbPass = env('DB_PASSWORD', '');
        }

        $dsn = sprintf(
            'mysql://%s:%s@%s:%s/%s',
            rawurlencode($dbUser),
            rawurlencode($dbPass),
            $host,
            $port,
            $dbName
        );

        RateLimiter::clear($rlKey);

        return response()->json([
            'ok'   => true,
            'data' => [
                'company_id'                => (string)$inst->company_id,
                'product_code'              => (string)$inst->product_code,
                'db_url'                    => $dsn,
                'package_code'              => (string)($inst->package_code ?? ''),
                'app_url'                   => (string)($inst->app_url ?? ''),
                'subscription_instance_id'  => (string)($inst->subscription_instance_id ?? ''),
            ],
        ]);
    }

    /**
     * Authenticate company_id + password untuk suatu product_code.
     * Mengembalikan info DB tenant (DB URL dengan user-tenant), paket, dan app_url bila valid.
     *
     * Catatan keamanan:
     * - Endpoint ini sebaiknya dibatasi dengan middleware kunci-klien (mis. VerifyClientKey) dari origin tepercaya.
     * - Response tidak membongkar password; hanya mengirim DSN/URL yang diperlukan server-side (Next.js/Laravel).
     */
    public function authenticate(Request $req)
    {
        $req->validate([
            'company_id'       => 'required|string',
            'product_code'     => 'required|string',
            'company_password' => 'required|string',
        ]);

        $companyId   = trim((string) $req->input('company_id'));
        $productCode = trim((string) $req->input('product_code'));
        $password    = (string) $req->input('company_password');

        // Rate limit: 5 attempt / menit per IP+company+product
        $rlKey = sprintf('tenant-auth:%s|%s|%s', $companyId, $productCode, $req->ip());
        if (RateLimiter::tooManyAttempts($rlKey, 5)) {
            $seconds = RateLimiter::availableIn($rlKey);
            return response()->json([
                'ok' => false,
                'error' => 'TOO_MANY_ATTEMPTS',
                'retry_in' => $seconds,
            ], 429);
        }

        // Ambil instance aktif terbaru untuk company_id+product_code
        $inst = DB::table('customer_product_instances')
            ->where('company_id', $companyId)
            ->where('product_code', $productCode)
            ->orderByDesc('created_at')
            ->first();

        if (!$inst) {
            RateLimiter::hit($rlKey, 60);
            return response()->json(['ok' => false, 'error' => 'INSTANCE_NOT_FOUND'], 404);
        }

        // Cek status aktif & masa berlaku (jika ada end_date)
        $isActive = (int)($inst->is_active ?? 0) === 1;
        $notExpired = true;
        if (!empty($inst->end_date)) {
            // end_date dianggap akhir-hari; jika sudah lewat, dianggap tidak aktif
            $notExpired = now()->lte(\Carbon\Carbon::parse($inst->end_date)->endOfDay());
        }
        if (!$isActive || !$notExpired) {
            RateLimiter::hit($rlKey, 60);
            return response()->json(['ok' => false, 'error' => 'INSTANCE_INACTIVE_OR_EXPIRED'], 403);
        }

        // Verifikasi password (hash utama, fallback ke legacy plain + self-heal)
        $hash  = (string) ($inst->company_password_hash ?? '');
        $plain = (string) ($inst->company_password_plain ?? '');
        $passOk = false;

        if ($hash !== '') {
            $passOk = Hash::check($password, $hash);
        } elseif ($plain !== '') {
            $passOk = hash_equals($plain, $password);
            if ($passOk) {
                // Self-heal: simpan hash & hapus plain
                DB::table('customer_product_instances')
                    ->where('id', $inst->id)
                    ->update([
                        'company_password_hash'  => Hash::make($password),
                        'updated_at'             => now(),
                    ]);
            }
        }

        if (!$passOk) {
            RateLimiter::hit($rlKey, 60);
            return response()->json(['ok' => false, 'error' => 'INVALID_PASSWORD'], 401);
        }

        RateLimiter::clear($rlKey);

        // Compose DB URL dari kredensial user-tenant (bukan root)
        $dbName = (string) ($inst->database_name ?? '');
        if ($dbName === '') {
            return response()->json(['ok' => false, 'error' => 'DB_NAME_MISSING'], 500);
        }

        // Ambil host/port; gunakan nilai dari central bila ada, kalau tidak jatuh ke ENV
        $host = (string) ($inst->database_host ?? env('DB_HOST', '127.0.0.1'));
        $port = (string) ($inst->database_port ?? env('DB_PORT', '3306'));

        // Ambil username & password terenkripsi (hasil provisioning)
        $dbUser = (string) ($inst->database_username ?? '');
        $dbPass = null;
        if (!empty($inst->database_password_enc)) {
            try {
                $dbPass = Crypt::decryptString($inst->database_password_enc);
            } catch (\Throwable $e) {
                // fallback: tetap null -> akan pakai env root (tidak ideal, tapi biar tidak putus)
            }
        }

        // Jika belum ada kredensial user-tenant (legacy), fallback ke ENV.
        // Saran: segera migrasikan semua instance untuk punya user-tenant.
        if ($dbUser === '' || $dbPass === null) {
            $dbUser = env('DB_USERNAME', 'root');
            $dbPass = env('DB_PASSWORD', '');
        }

        // URL encode credential untuk karakter spesial
        $dsn = sprintf(
            'mysql://%s:%s@%s:%s/%s',
            rawurlencode($dbUser),
            rawurlencode($dbPass),
            $host,
            $port,
            $dbName
        );

        return response()->json([
            'ok'   => true,
            'data' => [
                'company_id'   => (string) $inst->company_id,
                'product_code' => (string) $inst->product_code,
                'db_url'       => $dsn,
                'package_code' => (string) ($inst->package_code ?? ''),
                'app_url'      => (string) ($inst->app_url ?? ''),
                'subscription_instance_id' => (string) ($inst->subscription_instance_id ?? ''),
            ],
        ]);
    }
}