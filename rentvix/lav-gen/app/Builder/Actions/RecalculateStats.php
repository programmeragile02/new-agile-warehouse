<?php

namespace App\Builder\Actions;

use App\Builder\Contracts\ActionContract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecalculateStats implements ActionContract
{
    public function key(): string { return 'recalculate_stats'; }
    public function label(): string { return 'Recalculate Stats'; }
    public function position(): string { return 'toolbar'; }
    public function forEntities(): array { return ['*']; }

    public function uiSchema(): array { return ['type' => 'none', 'title' => 'Recalculate Stats']; }

    public function handle(Request $request, string $entity): mixed
    {
        $modelClass = "\\App\\Models\\".\Str::studly(\Str::singular($entity));
        $q = app($modelClass)->newQuery();

        $total     = (clone $q)->count();
        $published = (clone $q)->where('status','published')->count();
        $draft     = (clone $q)->where('status','draft')->count();
        $archived  = (clone $q)->where('status','archived')->count();

        DB::table('recalc_stats')->updateOrInsert(
            ['entity' => $entity],
            ['total' => $total, 'published' => $published, 'draft' => $draft, 'archived' => $archived, 'updated_at' => now()]
        );

        return response()->json(['success'=>true, 'data'=>compact('total','published','draft','archived')]);
    }
}
