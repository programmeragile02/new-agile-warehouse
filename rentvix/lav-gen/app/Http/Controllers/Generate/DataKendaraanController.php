<?php

namespace App\Http\Controllers\Generate;

use App\Http\Controllers\Controller;
use App\Models\DataKendaraan;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DataKendaraanExport;

class DataKendaraanController extends Controller
{
    protected string $entityRoute = 'data-kendaraans';

    public function index(Request $request)
    {
        $q = DataKendaraan::query();
        if ($s = $request->get('search')) {
            $q->where(function ($w) use ($s) {
                $w->where('id', 'like', "%$s%");
            });
        }
        // return response()->json($q->paginate((int)($request->get('per_page', 15))));

        // opsional: urutan default
        $q->latest('id'); // atau created_at

        $data = $q->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data',
            'total'   => $data->count(),
            'data'    => $data,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand' => 'required',
            'model' => 'required',
            'tahun' => 'required',
            'lokasi' => 'required',
            'status' => 'required|in:Avaliable,Rented,Maintenance,Out Of Service',
            'foto_depan' => 'image|max:5120|mimes:jpg,jpeg,png,webp',
            'foto_belakang' => 'image|max:5120|mimes:jpg,jpeg,png,webp',
            'foto_samping' => 'image|max:5120|mimes:jpg,jpeg,png,webp',
        ]);

        $data = [];
        $data['brand'] = $validated['brand'] ?? null;
        $data['model'] = $validated['model'] ?? null;
        $data['tahun'] = $validated['tahun'] ?? null;
        $data['lokasi'] = $validated['lokasi'] ?? null;
        $data['status'] = $validated['status'] ?? null;

            if ($request->hasFile('foto_depan')) {
                $data['foto_depan'] = $request->file('foto_depan')->store('uploads/DataKendaraan', 'public');
            }            if ($request->hasFile('foto_belakang')) {
                $data['foto_belakang'] = $request->file('foto_belakang')->store('uploads/DataKendaraan', 'public');
            }            if ($request->hasFile('foto_samping')) {
                $data['foto_samping'] = $request->file('foto_samping')->store('uploads/DataKendaraan', 'public');
            }

        $row = DataKendaraan::create($data);
        return response()->json(['success'=>true, 'data'=>$row], 201);
    }

    public function show($id)
    {
        $row = DataKendaraan::findOrFail($id);
        return response()->json(['success'=>true, 'data'=>$row]);
    }

    public function update(Request $request, $id)
    {
        $row = DataKendaraan::findOrFail($id);
        $validated = $request->validate([
            'brand' => 'required',
            'model' => 'required',
            'tahun' => 'required',
            'lokasi' => 'required',
            'status' => 'required|in:Avaliable,Rented,Maintenance,Out Of Service',
            'foto_depan' => 'image|max:5120|mimes:jpg,jpeg,png,webp',
            'foto_belakang' => 'image|max:5120|mimes:jpg,jpeg,png,webp',
            'foto_samping' => 'image|max:5120|mimes:jpg,jpeg,png,webp',
        ]);

        $data = [];
        $data['brand'] = $validated['brand'] ?? null;
        $data['model'] = $validated['model'] ?? null;
        $data['tahun'] = $validated['tahun'] ?? null;
        $data['lokasi'] = $validated['lokasi'] ?? null;
        $data['status'] = $validated['status'] ?? null;

            if ($request->hasFile('foto_depan')) {
                $data['foto_depan'] = $request->file('foto_depan')->store('uploads/DataKendaraan', 'public');
            } else {
                unset($data['foto_depan']);
            }            if ($request->hasFile('foto_belakang')) {
                $data['foto_belakang'] = $request->file('foto_belakang')->store('uploads/DataKendaraan', 'public');
            } else {
                unset($data['foto_belakang']);
            }            if ($request->hasFile('foto_samping')) {
                $data['foto_samping'] = $request->file('foto_samping')->store('uploads/DataKendaraan', 'public');
            } else {
                unset($data['foto_samping']);
            }

        $row->update($data);
        return response()->json(['success'=>true, 'data'=>$row]);
    }

    public function destroy($id)
    {
        $row = DataKendaraan::findOrFail($id);
        $row->delete();
        return response()->json(['success'=>true]);
    }

    public function exportExcel(Request $request)
    {
        $file = 'DataKendaraan_'.now()->format('Ymd_His').'.xlsx';

        return Excel::download(
            new DataKendaraanExport(
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
