<?php

namespace App\Http\Controllers\Overrides;

use App\Http\Controllers\Generate\DaftarKendaraanController as Base;
use Illuminate\Http\Request;
use App\Builder\ActionRegistry;

class DaftarKendaraanController extends Base
{
    protected string $entityRoute = 'daftar-kendaraans';

    public function listActions(Request $request)
    {
        $actions = app(ActionRegistry::class)->forEntity($this->entityRoute);
        return response()->json(array_map(fn($a) => [
            'key'      => $a->key(),
            'label'    => $a->label(),
            'position' => $a->position(),
            'ui'       => $a->uiSchema(),
        ], $actions));
    }

    public function runAction(Request $request, string $actionKey)
    {
        $action = app(ActionRegistry::class)->find($this->entityRoute, $actionKey);
        abort_unless($action, 404, 'Action not found');
        return $action->handle($request, $this->entityRoute);
    }
}
