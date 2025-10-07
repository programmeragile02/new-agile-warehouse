<?php

namespace App\Http\Controllers\Generate;

use App\Models\Company;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class CompanyController extends Controller
{
    // GET /api/companies
    public function index()
    {
        return response()->json(Company::all());
    }

    // GET /api/companies/{id}
    public function show(string $id)
    {
        return response()->json(Company::findOrFail($id));
    }

    // POST /api/companies
    public function store(Request $request)
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $row = Company::create([
            'password' => $validated['password'], // auto hashed
        ]);

        return response()->json($row, 201);
    }

    // PUT /api/companies/{id}
    public function update(Request $request, string $id)
    {
        $row = Company::findOrFail($id);

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $row->update([
            'password' => $validated['password'], // auto hashed
        ]);

        return response()->json($row);
    }

    // DELETE /api/companies/{id}
    public function destroy(string $id)
    {
        $row = Company::findOrFail($id);
        $row->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
