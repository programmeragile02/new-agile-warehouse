<?php

namespace App\Http\Controllers\Gateway;

use App\Http\Controllers\Controller;
use App\Services\PanelStoreClient;

class OfferingGatewayController extends Controller
{
    public function matrix(string $product, string $offering)
    {
        /** @var PanelStoreClient $panel */
        $panel = app(PanelStoreClient::class);
        $res   = $panel->getOfferingMatrix($product, $offering);

        if (!$res['ok']) {
            return response()->json([
                'ok'    => false,
                'error' => $res['error'] ?? 'Upstream error',
            ], 502);
        }

        return response()->json($res['json'], 200);
    }
}
