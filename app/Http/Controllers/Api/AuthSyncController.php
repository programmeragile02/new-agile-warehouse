<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthSyncController extends Controller
{
    /**
     * POST /api/tenant/sync-user-password
     * body: { product_code, email, new_password, company_id? }
     *
     * - Update CPIU.password_hash (dan optional password_plain untuk masa transisi)
     * - Update CPI.admin_password_plain (jika instance ditemukan)
     */
    public function syncUserPassword(Request $req)
    {
        $data = $req->validate([
            'product_code' => 'required|string',
            'email'        => 'required|email',
            'new_password' => 'required|string|min:8',
            'company_id'   => 'nullable|string',
        ]);

        $pc   = trim($data['product_code']);
        $mail = strtolower(trim($data['email']));
        $pwd  = (string) $data['new_password'];
        $cid  = $data['company_id'] ? trim($data['company_id']) : null;

        // 1) Cari user pusat (harus unik per product+email)
        $user = DB::table('customer_product_instance_users')
            ->when($cid, fn($q) => $q->where('company_id', $cid))
            ->where('product_code', $pc)
            ->whereRaw('LOWER(email) = ?', [$mail])
            ->first();

        if (!$user) {
            return response()->json(['ok' => false, 'error' => 'USER_NOT_FOUND'], 404);
        }

        $companyId = $cid ?: (string) $user->company_id;

        // 2) Update CPIU
        DB::table('customer_product_instance_users')
            ->where('product_code', $pc)
            ->where('company_id', $companyId)
            ->whereRaw('LOWER(email) = ?', [$mail])
            ->update([
                'password_hash'  => Hash::make($pwd),
                'password_plain' => $pwd, // <-- kalau mau hapus nanti, tinggal set null oleh job harian
                'updated_at'     => now(),
            ]);

        // 3) Update CPI (admin_password_plain) — tidak selalu ada hash kolomnya
        DB::table('customer_product_instances')
            ->where('product_code', $pc)
            ->where('company_id', $companyId)
            ->update([
                'admin_username'       => $mail,  // jaga konsistensi
                'admin_email'          => $mail,  // jaga konsistensi
                'admin_password_plain' => $pwd,
                'updated_at'           => now(),
            ]);

        return response()->json(['ok' => true]);
    }
}