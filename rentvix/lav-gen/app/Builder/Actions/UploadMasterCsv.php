<?php

namespace App\Builder\Actions;

use App\Builder\Contracts\ActionContract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UploadMasterCsv implements ActionContract
{
    public function key(): string { return 'upload_master_csv'; }
    public function label(): string { return 'Upload Master (CSV)'; }
    public function position(): string { return 'toolbar'; }
    public function forEntities(): array { return ['*']; }

    public function uiSchema(): array
    {
        return ['type' => 'file', 'title' => 'Upload CSV Data Master', 'accept' => '.csv,text/csv'];
    }

    public function handle(Request $request, string $entity): mixed
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:20480']);

        $path = $request->file('file')->store("imports/$entity", 'local');
        $full = storage_path('app/'.$path);

        $modelClass = "\\App\\Models\\".\Str::studly(\Str::singular($entity));
        $model = app($modelClass);
        $fillable = array_flip($model->getFillable());

        $inserted = 0;
        DB::transaction(function () use ($full, $model, $fillable, &$inserted) {
            if (!is_readable($full)) return;
            if (($h = fopen($full, 'r')) === false) return;
            $header = fgetcsv($h) ?: [];
            while (($row = fgetcsv($h)) !== false) {
                $data = array_map('trim', array_combine($header, $row) ?: []);
                $payload = array_intersect_key($data, $fillable);
                array_walk($payload, fn (&$v) => $v === '' ? $v = null : $v);
                $model->newQuery()->create($payload);
                $inserted++;
            }
            fclose($h);
        });

        return response()->json(['success' => true, 'inserted' => $inserted]);
    }
}
