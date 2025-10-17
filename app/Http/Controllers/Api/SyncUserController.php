<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProductInstance;
use App\Models\CustomerProductInstanceUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SyncUserController extends Controller
{
    /**
     * Payload dari Next:
     * {
     *   "product_code": "NATABANYU",
     *   "email": "user@x.com",
     *   "company_id": "NATABANYU_207400",
     *   "password_plain": "Rahasia123",   // optional
     *   "password_hash": "$2y$12$...",    // optional
     *   "is_active": true                 // optional
     * }
     */
    public function store(Request $req)
    {
        $data = $req->validate([
            'product_code'   => ['required','string','max:120'],
            'email'          => ['required','string','max:191'],
            'company_id'     => ['required','string','max:191'],
            'password'       => ['nullable','string','min:6','max:200'],
            'password_plain' => ['nullable','string','min:6','max:200'],
            'password_hash'  => ['nullable','string','min:30','max:255'],
            'is_active'      => ['nullable','boolean'],
        ]);

        $product   = strtoupper($data['product_code']);
        $email     = strtolower($data['email']);
        $companyId = $data['company_id'];
        $isActive  = array_key_exists('is_active',$data) ? (bool)$data['is_active'] : true;

        // Pastikan company_id valid untuk product_code
        $okCompany = CustomerProductInstance::where('product_code', $product)
            ->where('company_id', $companyId)
            ->exists();

        if (!$okCompany) {
            return response()->json([
                'ok' => false,
                'message' => 'company_id tidak cocok dengan product_code'
            ], 422);
        }

        /// Ambil plaintext dari 'password' atau 'password_plain'
        $plain = $data['password'] ?? $data['password_plain'] ?? null;

        // Tentukan hash final:
        // - kalau ada password_hash -> pakai itu
        // - else kalau ada plain -> Hash::make
        $hash  = $data['password_hash'] ?? null;
        if (!$hash && $plain) {
            $hash = Hash::make($plain);
        }

        // Cegah overwrite password jika tidak ada input password
        $existing = CustomerProductInstanceUser::where('product_code',$product)
            ->where('email',$email)
            ->first();

        if ($existing) {
            $updates = [
                'company_id' => $companyId,
                'is_active'  => $isActive,
            ];
            if ($plain !== null) $updates['password_plain'] = $plain;
            if ($hash  !== null) $updates['password_hash']  = $hash;

            $existing->fill($updates)->save();
            $cpiu = $existing;
        } else {
            $cpiu = CustomerProductInstanceUser::create([
                'id'             => (string) Str::uuid(), // amankan jika kolom id tidak auto
                'product_code'   => $product,
                'email'          => $email,
                'company_id'     => $companyId,
                'password_plain' => $plain,
                'password_hash'  => $hash,
                'is_active'      => $isActive,
            ]);
        }

        return response()->json([
            'ok'   => true,
            'data' => [
                'product_code' => $cpiu->product_code,
                'email'        => $cpiu->email,
                'company_id'   => $cpiu->company_id,
                'is_active'    => (bool) $cpiu->is_active,
            ],
        ]);
    }
}