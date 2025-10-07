<?php

namespace App\Http\Controllers\Generate;

use App\Http\Controllers\Controller;
use App\Models\AccessControlMatrix;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AccessControlMatrixController extends Controller
{
    public function index()
    {
        try {
            $rows = AccessControlMatrix::orderByDesc('updated_at')->get();

            return response()->json([
                'success' => true,
                'message' => 'Berhasil menampilkan data AccessControlMatrix',
                'data' => $rows,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menampilkan data AccessControlMatrix: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $row = AccessControlMatrix::findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => "Berhasil menampilkan data AccessControlMatrix dari id: $id",
                'data' => $row,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Gagal menampilkan data AccessControlMatrix dari id: $id - " . $e->getMessage(),
            ], 404);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_level_id' => ['required', Rule::exists('level_user', 'id')],
            'menu_id' => ['nullable', 'integer'],
            'menu_key' => ['nullable', 'string'],
            'view' => ['sometimes', 'boolean'],
            'add' => ['sometimes', 'boolean'],
            'edit' => ['sometimes', 'boolean'],
            'delete' => ['sometimes', 'boolean'],
            'approve' => ['sometimes', 'boolean'],
        ]);

        if (empty($validated['menu_id']) && empty($validated['menu_key'])) {
            return response()->json([
                'success' => false,
                'message' => 'menu_id atau menu_key harus diisi salah satu.',
            ], 422);
        }

        $row = AccessControlMatrix::create([
            'user_level_id' => (int) $validated['user_level_id'],
            'menu_id' => $validated['menu_id'] ?? null,
            'menu_key' => $validated['menu_key'] ?? null,
            'view' => (bool) ($validated['view'] ?? false),
            'add' => (bool) ($validated['add'] ?? false),
            'edit' => (bool) ($validated['edit'] ?? false),
            'delete' => (bool) ($validated['delete'] ?? false),
            'approve' => (bool) ($validated['approve'] ?? false),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil menyimpan AccessControlMatrix',
            'data' => $row,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $row = AccessControlMatrix::findOrFail($id);

        $validated = $request->validate([
            'user_level_id' => ['required', Rule::exists('level_user', 'id')],
            'menu_id' => ['nullable', 'integer'],
            'menu_key' => ['nullable', 'string'],
            'view' => ['sometimes', 'boolean'],
            'add' => ['sometimes', 'boolean'],
            'edit' => ['sometimes', 'boolean'],
            'delete' => ['sometimes', 'boolean'],
            'approve' => ['sometimes', 'boolean'],
        ]);

        if (empty($validated['menu_id']) && empty($validated['menu_key'])) {
            return response()->json([
                'success' => false,
                'message' => 'menu_id atau menu_key harus diisi salah satu.',
            ], 422);
        }

        $row->update([
            'user_level_id' => (int) $validated['user_level_id'],
            'menu_id' => $validated['menu_id'] ?? null,
            'menu_key' => $validated['menu_key'] ?? null,
            'view' => (bool) ($validated['view'] ?? false),
            'add' => (bool) ($validated['add'] ?? false),
            'edit' => (bool) ($validated['edit'] ?? false),
            'delete' => (bool) ($validated['delete'] ?? false),
            'approve' => (bool) ($validated['approve'] ?? false),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengupdate AccessControlMatrix',
            'data' => $row,
        ], 200);
    }

    public function destroy($id)
    {
        $deleted = AccessControlMatrix::destroy($id);

        return response()->json([
            'success' => (bool) $deleted,
            'message' => $deleted ? '🗑️ Dihapus' : 'Data tidak ditemukan',
        ], $deleted ? 200 : 404);
    }

    /**
     * BULK STORE (POST /access_control_matrices/bulk)
     * payload:
     * {
     *   "user_level_id": 1,
     *   "items": [
     *     { "menu_key": "kendaraan::jenisBbm", "view": true, "add": false, ... },
     *     { "menu_id": 12, "view": false, "add": true, ... }
     *   ]
     * }
     */
    public function storeBulk(Request $request)
    {
        $data = $request->validate([
            'user_level_id'   => ['required', Rule::exists('level_user', 'id')],
            'items'           => ['required', 'array'],
            'items.*.menu_id' => ['required', 'integer'], // ⬅️ wajib menu_id
            'items.*.view'    => ['sometimes', 'boolean'],
            'items.*.add'     => ['sometimes', 'boolean'],
            'items.*.edit'    => ['sometimes', 'boolean'],
            'items.*.delete'  => ['sometimes', 'boolean'],
            'items.*.approve' => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($data) {
            AccessControlMatrix::syncForLevel((int)$data['user_level_id'], $data['items']);
        });

        // Snapshot terbaru (anti-cache)
        $fresh = AccessControlMatrix::where('user_level_id', (int)$data['user_level_id'])
            ->orderBy('menu_id')->get();

        return response()
            ->json([
                'success' => true,
                'message' => 'Bulk store permissions berhasil',
                'count'   => count($data['items']),
                'data'    => $fresh,
            ], 200)
            ->header('Cache-Control','no-store, no-cache, must-revalidate')
            ->header('Pragma','no-cache');
    }

    /**
     * BULK UPDATE (PUT /access_control_matrices/bulk)
     * Semantik sama dengan storeBulk (upsert).
     */
    public function updateBulk(Request $request)
    {
        // Gunakan validasi & implementasi yang sama (upsert)
        return $this->storeBulk($request);
    }

    // (Opsional) stats jika kamu pakai
    public function stats()
    {
        $total = AccessControlMatrix::count();
        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
            ],
        ]);
    }
}
