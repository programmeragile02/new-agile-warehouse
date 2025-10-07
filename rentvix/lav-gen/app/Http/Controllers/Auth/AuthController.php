<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\UserManagement;
use App\Models\AccessControlMatrix;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    /**
     * POST /auth/company/login
     * Body: { identifier: "<company_id UUID>", password: "..." }
     */
    public function companyLogin(Request $request)
    {
        $data = $request->validate([
            'identifier' => ['required','string'],
            'password'   => ['required','string','min:8'],
        ]);

        $company = Company::query()->where('company_id', $data['identifier'])->first();
        if (!$company || !Hash::check($data['password'], $company->password)) {
            return response()->json(['message' => 'Invalid company credentials'], 401);
        }

        // Token ringan: tanpa perms
        $token = JWTAuth::fromUser($company, [
            'typ'        => 'company',
            'company_id' => (string) $company->id,
        ]);

        $ttlSeconds = config('jwt.ttl') ? config('jwt.ttl') * 60 : null;

        return response()->json([
            'success'       => true,
            'token_type'    => 'Bearer',
            'company_token' => $token,
            'company_id'    => (string) $company->id,
            'expires_in'    => $ttlSeconds,
        ]);
    }

    /**
     * GET /auth/company/me
     * Header: Authorization: Bearer <company_token>
     */
    public function companyMe()
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();
            $typ = $payload->get('typ');
            if ($typ !== null && $typ !== 'company') {
                return response()->json(['message' => 'Invalid token type'], 403);
            }

            $companyId = (string) ($payload->get('company_id') ?: $payload->get('sub'));
            if ($companyId === '' || !Company::whereKey($companyId)->exists()) {
                return response()->json(['message' => 'Invalid company context'], 401);
            }

            $company = Company::find($companyId);
            return response()->json($company);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
    }

    /**
     * POST /auth/user/login
     * Header: Authorization: Bearer <company_token>
     * Body: { identifier: "email/phone", method: "password|otp", password?: "...", otp?: "..." }
     */
    public function userLogin(Request $request)
    {
        // Validasi & ambil konteks company dari token perusahaan
        try {
            $payload = JWTAuth::parseToken()->getPayload();
            $typ = $payload->get('typ');
            if ($typ !== null && $typ !== 'company') {
                return response()->json(['message' => 'Invalid company token'], 401);
            }
            $companyId = (string) ($payload->get('company_id') ?: $payload->get('sub'));
            if ($companyId === '' || !Company::whereKey($companyId)->exists()) {
                return response()->json(['message' => 'Invalid company context'], 401);
            }
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Unauthorized company token'], 401);
        }

        $data = $request->validate([
            'identifier' => ['required','string'],
            'method'     => ['required','in:password,otp'],
            'password'   => ['nullable','string','min:8'],
            'otp'        => ['nullable','string','min:4','max:10'],
        ]);

        $user = UserManagement::query()
            ->where('email', $data['identifier'])
            ->orWhere('nomor_telp', $data['identifier'])
            ->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($data['method'] === 'password') {
            if (!$user->password || !Hash::check($data['password'] ?? '', $user->password)) {
                return response()->json(['message' => 'Invalid user credentials'], 401);
            }
        } else {
            // TODO: validasi OTP real
            if (!($data['otp'] ?? null)) {
                return response()->json(['message' => 'OTP required'], 422);
            }
        }

        $levelId = $user->role;

        // Ambil permissions untuk FE (JANGAN masukin ke token)
        $perms = AccessControlMatrix::query()
            ->where('user_level_id', $levelId)
            ->get(['menu_id','view','add','edit','delete','approve'])
            ->map(fn($r) => [
                'menu_id' => (int) $r->menu_id,
                'view'    => (bool) $r->view,
                'add'     => (bool) $r->add,
                'edit'    => (bool) $r->edit,
                'delete'  => (bool) $r->delete,
                'approve' => (bool) $r->approve,
            ])->values()->toArray();

        // Token ringan (klaim kecil saja)
        $claims = [
            'typ'        => 'user',
            'company_id' => $companyId,
            'level_id'   => $levelId,
            // HAPUS 'perms' dari klaim agar header tidak bengkak
        ];
        $token = JWTAuth::claims($claims)->fromUser($user);

        return response()->json([
            'success'    => true,
            'token_type' => 'Bearer',
            'user_token' => $token,
            'user'       => [
                'id'    => $user->id,
                'nama'  => $user->nama,
                'email' => $user->email,
                'level' => $levelId,
            ],
            // kirim perms untuk FE simpan di localStorage (bukan di token)
            'perms'      => $perms,
        ]);
    }

    /**
     * GET /auth/user/me
     * Header: Authorization: Bearer <user_token>
     */
    public function userMe()
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();
            $typ = $payload->get('typ');
            if ($typ !== null && $typ !== 'user') {
                return response()->json(['message' => 'Invalid token type'], 403);
            }

            // Hindari masalah guard dengan fallback manual
            $user = null;
            try {
                $user = JWTAuth::parseToken()->authenticate();
            } catch (\Throwable $e) {
                $userId = $payload->get('sub');
                if ($userId) $user = UserManagement::find($userId);
            }
            if (!$user) return response()->json(['message' => 'User not found'], 404);

            return response()->json($user);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
    }

    /**
     * POST /auth/logout (dipisah untuk company/user di routes)
     */
    public function logout()
    {
        try {
            JWTAuth::parseToken()->invalidate(true);
            return response()->json(['success' => true, 'message' => 'Logged out']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
    }

    /**
     * POST /auth/refresh
     */
    public function refresh()
    {
        try {
            $new = JWTAuth::parseToken()->refresh(true, true);
            $payload = JWTAuth::setToken($new)->getPayload();

            return response()->json([
                'success'    => true,
                'token_type' => 'Bearer',
                'token'      => $new,
                'typ'        => $payload['typ'] ?? null,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
    }
}
