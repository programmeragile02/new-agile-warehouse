<?php

namespace App\Builder\Actions;

use App\Builder\Contracts\ActionContract;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportCsv implements ActionContract
{
    public function key(): string { return 'export_csv'; }
    public function label(): string { return 'Export CSV'; }
    public function position(): string { return 'toolbar'; }
    public function forEntities(): array { return ['*']; }

    public function uiSchema(): array
    {
        return ['type' => 'none', 'method' => 'GET', 'download' => 'stream', 'title' => 'Export CSV'];
    }

    public function handle(Request $request, string $entity): mixed
    {
        $modelClass = "\\App\\Models\\".\Str::studly(\Str::singular($entity));
        $query = app($modelClass)->newQuery();

        return new StreamedResponse(function () use ($query) {
            $out = fopen('php://output', 'w');
            $first = $query->first();
            if (!$first) { fclose($out); return; }
            $header = array_keys($first->getAttributes());
            fputcsv($out, $header);
            $query->chunk(500, function ($rows) use ($out, $header) {
                foreach ($rows as $r) {
                    $line = [];
                    foreach ($header as $h) $line[] = $r->{$h};
                    fputcsv($out, $line);
                }
            });
            fclose($out);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$entity.'_export.csv"',
        ]);
    }
}
