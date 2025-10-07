<?php

namespace App\Http\Controllers\Generate;

use App\Http\Controllers\Controller;
use App\Models\UserManagement;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class UserManagementController extends Controller
{
    public function index()
    {
        $rows = UserManagement::with('roleRel:id,nama_level')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => "Berhasil menampilkan data UserManagement",
            'data'    => $rows,
        ], 200);
    }

    public function show($id)
    {
        try {
            $row = UserManagement::findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => "Berhasil menampilkan data UserManagement dari id: $id",
                'data'    => $row,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success'=> false,
                'message' => "Gagal menampilkan data UserManagement dari id: $id - " . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        // password wajib saat create (untuk login JWT user)
        $validated = $request->validate([
            'company_id'  => ['required','uuid'],
            'nama'        => ['required', 'string', 'max:150'],
            'email'       => ['required', 'email', 'max:150', 'unique:user_management,email'],
            'nomor_telp'  => ['required', 'string', 'max:50'],
            'role'        => ['required', 'exists:level_user,id'],
            'status'      => ['required', 'in:Aktif,Tidak Aktif'],
            'password'    => ['required', 'string', 'min:8', 'confirmed'],
            'foto'        => ['nullable', 'image', 'max:5120', 'mimes:jpg,jpeg,png,webp'],
        ]);

        $data = [
            'company_id' => $validated['company_id'], // ✅ pakai nilai validasi
            'nama'       => $validated['nama'],
            'email'      => $validated['email'],
            'nomor_telp' => $validated['nomor_telp'],
            'role'       => $validated['role'],
            'status'     => $validated['status'],
            'password'   => $validated['password'], // auto-hash via casts di model
        ];

        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('uploads/UserManagement', 'public');
        }

        $row = UserManagement::create($data);

        return response()->json([
            'success' => true,
            'message' => 'UserManagement berhasil dibuat',
            'data'    => $row->fresh(),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $row = UserManagement::findOrFail($id);

        // Saat update: email harus unique tapi abaikan current id, password opsional
        $validated = $request->validate([
            'company_id'  => ['required','uuid'],
            'nama'        => ['required', 'string', 'max:150'],
            'email'       => ['required', 'email', 'max:150', Rule::unique('user_management', 'email')->ignore($row->id)],
            'nomor_telp'  => ['required', 'string', 'max:50'],
            'role'        => ['required', 'exists:level_user,id'],
            'status'      => ['required', 'in:Aktif,Tidak Aktif'],
            'password'    => ['nullable', 'string', 'min:8', 'confirmed'],
            'foto'        => ['nullable', 'image', 'max:5120', 'mimes:jpg,jpeg,png,webp'],
        ]);

        $data = [
            'company_id' => $validated['company_id'], // ✅ pakai nilai validasi
            'nama'       => $validated['nama'],
            'email'      => $validated['email'],
            'nomor_telp' => $validated['nomor_telp'],
            'role'       => $validated['role'],
            'status'     => $validated['status'],
        ];

        if (!empty($validated['password'])) {
            $data['password'] = $validated['password']; // auto-hash via casts
        }

        if ($request->hasFile('foto')) {
            // hapus foto lama jika ada
            if ($row->foto && Storage::disk('public')->exists($row->foto)) {
                Storage::disk('public')->delete($row->foto);
            }
            $data['foto'] = $request->file('foto')->store('uploads/UserManagement', 'public');
        }

        $row->update($data);

        return response()->json([
            'success' => true,
            'message' => 'UserManagement berhasil diperbarui',
            'data'    => $row->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $row = UserManagement::findOrFail($id);

        // opsional: hapus file juga
        if ($row->foto && Storage::disk('public')->exists($row->foto)) {
            Storage::disk('public')->delete($row->foto);
        }

        $row->delete();

        return response()->json([
            'success' => true,
            'message' => '🗑️ Dihapus',
        ]);
    }
}
