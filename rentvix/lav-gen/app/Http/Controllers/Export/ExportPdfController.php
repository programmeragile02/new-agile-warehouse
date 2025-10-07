<?php

namespace App\Http\Controllers\Export;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ExportPdfController extends Controller
{
    public function export(Request $request, string $entity)
    {
        Carbon::setLocale('id');

        // 1) Baca schema JSON
        $schemaFile = resource_path("builder_schema/{$entity}.json");
        if (!file_exists($schemaFile)) abort(404, "Schema {$entity} tidak ditemukan.");
        $schema = json_decode(file_get_contents($schemaFile), true);

        $title      = $schema['title']      ?? Str::headline($entity);
        $menuTitle  = $schema['menu_title'] ?? Str::headline($entity);
        $table      = $schema['table']      ?? $entity;
        $columns    = $schema['columns']    ?? [];
        $sumCols    = $schema['summary']['sum']      ?? [];
        $groupByCol = $schema['summary']['group_by'] ?? null;

        // 2) Filter kolom via ?columns=a,b,c (ambil irisan dengan JSON)
        if ($colsQ = $request->query('columns')) {
            $want    = array_filter(array_map('trim', explode(',', $colsQ)));
            $columns = array_values(array_filter($columns, fn($c) => in_array($c['source'], $want)));
        }

        // 3) Ambil kolom final & validasi ke DB (defensif)
        $selectCols = array_unique(array_map(fn($c) => $c['source'], $columns));
        $selectCols = array_values(array_filter($selectCols, fn($col) => Schema::hasColumn($table, $col)));

        // Fallback kalau kosong: ambil 'id' jika ada
        if (empty($selectCols)) {
            if (Schema::hasColumn($table, 'id')) {
                $selectCols = ['id'];
                // dan pastikan ada 1 kolom untuk ditampilkan juga di $columns:
                $columns = [['source' => 'id', 'label' => 'ID', 'display' => 'number']];
            } else {
                abort(400, "Tidak ada kolom yang valid untuk diekspor.");
            }
        }

        // 4) Query data + filter dasar
        $q = DB::table($table);

        if ($search = $request->query('search')) {
            $q->where(function($x) use ($selectCols, $search){
                foreach ($selectCols as $col) {
                    $x->orWhere($col, 'like', '%'.$search.'%');
                }
            });
        }

        if (($status = $request->query('status')) && in_array('status', $selectCols)) {
            $q->where('status', $status);
        }

        if ($limit = (int) $request->query('limit')) {
            $q->limit($limit);
        }

        $items = $q->select($selectCols)->get();

        // 5) Ringkasan dinamis (defensif)
        $summary = [
            'total'    => $items->count(),
            'by_group' => [],
            'sums'     => [],
        ];

        $canGroup = $groupByCol && in_array($groupByCol, $selectCols);
        if ($canGroup) {
            $summary['by_group'] = $items->groupBy($groupByCol)->map->count()->toArray();
        }

        $sumColsSafe = array_values(array_filter($sumCols, fn($c) => in_array($c, $selectCols)));
        foreach ($sumColsSafe as $col) {
            $summary['sums'][$col] = $items->sum(fn($r) => is_numeric($r->{$col}) ? $r->{$col} : 0);
        }

        // 6) Kop & panel tanda tangan
        $company = [
            'name'    => 'RentVix Pro',
            'address' => 'Jl. Raya 123, Boyolali',
            'phone'   => '+62-812-0000-0000',
            'logo'    => public_path('logo/rentvixpro-transparent.png'),
            'city'    => 'Boyolali',
        ];
        $sign = [
            'place'  => $request->query('place', $company['city'] ?? ''),
            'date'   => Carbon::now()->translatedFormat('d F Y'),
            'name'   => $request->query('approver_name', 'Nama Atasan'),
            'title'  => $request->query('approver_title', 'Jabatan'),
        ];

        // 7) Render generic (atau pakai pdf.{entity} jika ada)
        $viewName = view()->exists("pdf.$entity") ? "pdf.$entity" : "pdf.generic";
        $html = view($viewName, [
            'title'      => $title,
            'menuTitle'  => $menuTitle,
            'generated'  => Carbon::now()->translatedFormat('d F Y H:i'),
            'company'    => $company,
            'columns'    => $columns,
            'items'      => $items,
            'summary'    => $summary,
            'sign'       => $sign,
        ])->render();

        $pdf = Pdf::loadHTML($html)->setPaper('A4', 'portrait')->setOptions(['defaultFont' => 'poppins']);
        $filename = Str::studly($entity).'_'.now()->format('Ymd_His').'.pdf';
        return $pdf->download($filename);
    }
}
