<?php

namespace App\Http\Controllers\Generate;

use App\Http\Controllers\Controller;
use App\Models\DataUser;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DataUserExport;

class DataUserController extends Controller
{
    protected string $entityRoute = 'data-users';

    public function index(Request $request)
    {
        $q = DataUser::query();
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
            'nama' => 'required',
            'email' => 'required',
            'no_hp' => 'required',
            'password' => '',
        ]);

        $data = [];
        $data['nama'] = $validated['nama'] ?? null;
        $data['email'] = $validated['email'] ?? null;
        $data['no_hp'] = $validated['no_hp'] ?? null;
        $data['password'] = $validated['password'] ?? null;



        $row = DataUser::create($data);
        return response()->json(['success'=>true, 'data'=>$row], 201);
    }

    public function show($id)
    {
        $row = DataUser::findOrFail($id);
        return response()->json(['success'=>true, 'data'=>$row]);
    }

    public function update(Request $request, $id)
    {
        $row = DataUser::findOrFail($id);
        $validated = $request->validate([
            'nama' => 'required',
            'email' => 'required',
            'no_hp' => 'required',
            'password' => '',
        ]);

        $data = [];
        $data['nama'] = $validated['nama'] ?? null;
        $data['email'] = $validated['email'] ?? null;
        $data['no_hp'] = $validated['no_hp'] ?? null;
        $data['password'] = $validated['password'] ?? null;



        $row->update($data);
        return response()->json(['success'=>true, 'data'=>$row]);
    }

    public function destroy($id)
    {
        $row = DataUser::findOrFail($id);
        $row->delete();
        return response()->json(['success'=>true]);
    }

    public function exportExcel(Request $request)
    {
        $file = 'DataUser_'.now()->format('Ymd_His').'.xlsx';

        return Excel::download(
            new DataUserExport(
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
