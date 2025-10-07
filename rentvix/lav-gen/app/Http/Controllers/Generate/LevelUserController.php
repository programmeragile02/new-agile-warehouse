<?php

namespace App\Http\Controllers\Generate;

use App\Http\Controllers\Controller;
use App\Models\LevelUser;
use App\Models\UserManagement;
use Illuminate\Http\Request;

class LevelUserController extends Controller
{
    public function index()
    {
        try {
            // Tambah users_count per level (FK: user_management.role -> level_user.id)
            $leveluser = LevelUser::withCount(['userManagements as users_count'])
                ->orderByDesc('updated_at')
                ->get();

            return response()->json([
                'success' => true,
                'message' => "Berhasil menampilkan data LevelUser",
                'data' => $leveluser,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Gagal menampilkan data LevelUser " . $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $leveluser = LevelUser::withCount(['userManagements as users_count'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => "Berhasil menampilkan data LevelUser dari id: $id",
                'data' => $leveluser,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Gagal menampilkan data LevelUser dari id: $id " . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_level' => 'required',
            'deskripsi' => 'required',
            'status' => 'required|in:Aktif,Tidak Aktif',
        ]);

        $data = [];
        $data['nama_level'] = $validated['nama_level'] ?? null;
        $data['deskripsi'] = $validated['deskripsi'] ?? null;
        $data['status'] = $validated['status'] ?? null;

        $row = LevelUser::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil membuat LevelUser',
            'data' => $row,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $leveluser = LevelUser::findOrFail($id);

        $validated = $request->validate([
            'nama_level' => 'required',
            'deskripsi' => 'required',
            'status' => 'required|in:Aktif,Tidak Aktif',
        ]);

        $data = [];
        $data['nama_level'] = $validated['nama_level'] ?? null;
        $data['deskripsi'] = $validated['deskripsi'] ?? null;
        $data['status'] = $validated['status'] ?? null;

        $leveluser->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil memperbarui LevelUser',
            'data' => $leveluser,
        ]);
    }

    public function destroy($id)
    {
        LevelUser::destroy($id);
        return response()->json(['message' => '🗑️ Dihapus']);
    }

    /**
     * GET /api/level_users/stats
     * Mengembalikan ringkasan statistik:
     * - total_levels
     * - active_levels
     * - inactive_levels
     * - total_users (akumulasi user_managements semua level)
     */
    public function stats()
    {
        // Hitung cepat
        $totalLevels = LevelUser::count();
        $activeLevels = LevelUser::where('status', 'Aktif')->count();
        $inactiveLevels = LevelUser::where('status', 'Tidak Aktif')->count();

        // Total users dari tabel user_management (lebih aman jika ada user tanpa level)
        $totalUsers = UserManagement::count();

        // (opsional) breakdown per level jika nanti dibutuhkan
        // $perLevel = LevelUser::withCount('userManagements')->get(['id','nama_level','status']);

        return response()->json([
            'success' => true,
            'message' => 'Statistik LevelUser',
            'data' => [
                'total_levels' => $totalLevels,
                'active_levels' => $activeLevels,
                'inactive_levels' => $inactiveLevels,
                'total_users' => $totalUsers,
                // 'per_level' => $perLevel,
            ],
        ]);
    }
}
