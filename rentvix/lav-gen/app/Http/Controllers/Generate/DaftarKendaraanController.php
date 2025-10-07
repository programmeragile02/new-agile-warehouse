<?php

namespace App\Http\Controllers\Generate;

use App\Http\Controllers\Controller;
use App\Models\DaftarKendaraan;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DaftarKendaraanExport;

class DaftarKendaraanController extends Controller
{
    protected string $entityRoute = 'daftar-kendaraans';

    public function index(Request $request)
    {
        // batas aman per_page (default 10, max 100)
        $perPage = max(1, min((int) $request->query('per_page', 10), 100));

        $q = DaftarKendaraan::query();
        if ($s = $request->get('search')) {
            $q->where(function ($w) use ($s) {
                $w->where('id', 'like', "%$s%");
            });
        }

        // opsional: urutan default
        $q->latest('id'); // atau created_at

        $data = $q->paginate($perPage)->appends($request->query());

        return response()->json([
            'success' => true,
            'message' => 'Berhasil menampilkan data',
            'total' => $data->count(),
            'data' => $data->items(),
            'meta' => [
                'current_page' => $data->currentPage(),
                'per_page' => $data->perPage(),
                'last_page' => $data->lastPage(),
                'from' => $data->firstItem(),
                'to' => $data->lastItem(),
            ],
            'links' => [
                'first' => $data->url(1),
                'last' => $data->url($data->lastPage()),
                'prev' => $data->previousPageUrl(),
                'next' => $data->nextPageUrl(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'jenis' => 'required',
            'warna' => 'required',
            'foto_depan' => 'image|max:5120|mimes:jpg,jpeg,png,webp',
            'foto_samping' => 'image|max:5120|mimes:jpg,jpeg,png,webp',
        ]);

        $data = [];
        $data['jenis'] = $validated['jenis'] ?? null;
        $data['warna'] = $validated['warna'] ?? null;

            if ($request->hasFile('foto_depan')) {
                $data['foto_depan'] = $request->file('foto_depan')->store('uploads/DaftarKendaraan', 'public');
            }            if ($request->hasFile('foto_samping')) {
                $data['foto_samping'] = $request->file('foto_samping')->store('uploads/DaftarKendaraan', 'public');
            }

        $row = DaftarKendaraan::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Berhasil menambahkan data',
            'data' => $row
        ], 201);
    }

    public function show($id)
    {
        $row = DaftarKendaraan::findOrFail($id);
        return response()->json([
            'success' => true,
            'message' => 'Berhasil melihat data dari id: ' . $id,
            'data' => $row
        ]);
    }

    public function update(Request $request, $id)
    {
        $row = DaftarKendaraan::findOrFail($id);
        $validated = $request->validate([
            'jenis' => 'required',
            'warna' => 'required',
            'foto_depan' => 'image|max:5120|mimes:jpg,jpeg,png,webp',
            'foto_samping' => 'image|max:5120|mimes:jpg,jpeg,png,webp',
        ]);

        $data = [];
        $data['jenis'] = $validated['jenis'] ?? null;
        $data['warna'] = $validated['warna'] ?? null;

        $oldFilesToDelete = [];
            if ($request->hasFile('foto_depan')) {
                $old = $row->foto_depan;
                $data['foto_depan'] = $request->file('foto_depan')->store('uploads/DaftarKendaraan', 'public');
                if (!empty($old)) { $oldFilesToDelete[] = $old; }
            }            if ($request->hasFile('foto_samping')) {
                $old = $row->foto_samping;
                $data['foto_samping'] = $request->file('foto_samping')->store('uploads/DaftarKendaraan', 'public');
                if (!empty($old)) { $oldFilesToDelete[] = $old; }
            }

        $row->update($data);
            // hapus file lama setelah update sukses
            foreach ($oldFilesToDelete as $oldPath) {
                if (!empty($oldPath)) { \Storage::disk('public')->delete($oldPath); }
            }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil update data',
            'data' => $row
        ]);
    }

    // soft delete
    public function destroy($id)
    {
        $row = DaftarKendaraan::findOrFail($id);

        $row->deleted_by = 'admin'; // dummy nanti diganti auth
        $row->save();

        $row->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil menghapus data sementara'
        ]);
    }

    // restore
    public function restore($id)
    {
        $row = DaftarKendaraan::onlyTrashed()->findOrFail($id);
        $row->restore();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil di kembalikan'
        ]);
    }

    // hapus permanen (force)
    public function forceDelete($id)
    {
        $row = DaftarKendaraan::onlyTrashed()->findOrFail($id);
        $row->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil dihapus permanen'
        ]);
    }

    // list data yang di hapus sementara
    public function deletedData()
    {
        $row = DaftarKendaraan::onlyTrashed()->orderByDesc('deleted_at')->get();

        $totalDataDihapus = DaftarKendaraan::onlyTrashed()->count();

        return response()->json([
            'success' => true,
            'message' => 'Menampilkan data yang dihapus',
            'total' => $totalDataDihapus,
            'data' => $row
        ]);
    }

    public function exportExcel(Request $request)
    {
        $file = 'DaftarKendaraan_'.now()->format('Ymd_His').'.xlsx';

        return Excel::download(
            new DaftarKendaraanExport(
                search: $request->query('search'),
                status: $request->query('status'),
                city: $request->query('city', 'Jakarta'),
                approvedByName: $request->query('approved_by_name', 'Manager Operasional'),
                approvedByTitle: $request->query('approved_by_title', 'Manager Operasional'),
                approvedDate: $request->query('approved_date')
            ),
            $file
        );
    }
}
