<?php

namespace App\Builder\Contracts;

use Illuminate\Http\Request;

interface ActionContract
{
    public function key(): string;          // unik: /{entity}/actions/{key}
    public function label(): string;        // label untuk UI
    public function position(): string;     // toolbar|row|bulk|detail
    public function forEntities(): array;   // ['*'] atau ['kendaraans']

    /**
     * uiSchema:
     * - type: 'none' | 'file' | 'form'
     * - method?: 'GET' | 'POST'
     * - download?: 'stream' (untuk GET download)
     * - fields?: [{ name,label,input,placeholder }]
     * - accept?: '.csv' (untuk type=file)
     */
    public function uiSchema(): array;

    public function handle(Request $request, string $entity): mixed;
}
