<?php

// namespace App\Http\Controllers\Gateway;

// use App\Http\Controllers\Controller;
// use App\Services\AppGenerateClient;
// use Illuminate\Http\Request;
// use Illuminate\Http\JsonResponse;

// class FeatureGatewayController extends Controller
// {
//     public function __construct(protected AppGenerateClient $ag) {}

//    public function index(Request $request): JsonResponse
// {
//     $payload = $this->ag->listFeatures([
//         'product_code' => $request->query('product_code'),
//         'type'         => $request->query('type'),
//     ]);

//     if (!$payload['ok']) {
//         return response()->json([
//             'message'  => 'Upstream (AppGenerate) error',
//             'upstream' => $payload['error'] ?? $payload['status'],
//         ], 502);
//     }

//     return response()->json(['data' => $payload['json']['data'] ?? []]);
// }

// public function byProduct(string $idOrCode): JsonResponse
// {
//     $payload = $this->ag->featuresByProduct($idOrCode);

//     if (!$payload['ok']) {
//         return response()->json([
//             'message'  => 'Upstream (AppGenerate) error',
//             'upstream' => $payload['error'] ?? $payload['status'],
//         ], 502);
//     }

//     return response()->json(['data' => $payload['json']['data'] ?? []]);
// }
// }


namespace App\Http\Controllers\Gateway;

use App\Http\Controllers\Controller;
use App\Services\ProductAppClient;
use App\Services\AppGenerateClient;
use Illuminate\Http\JsonResponse;

class FeatureGatewayController extends Controller
{
    public function __construct(
        protected ProductAppClient $apps,
        protected AppGenerateClient $ag
    ) {}

    /** GET /api/features/{product}  (alias by-product) */
public function byProduct(string $product): JsonResponse
{
    // cek: produk ada di registry ProductAppClient?
    $inRegistry = app(\App\Services\ProductAppClient::class)->hasProduct($product);

    // 1) coba product-app
    $app = $this->apps->listFeatures($product);
    if ($app['ok']) {
        return response()->json(['data' => $app['data'] ?? [], 'source' => 'product-app'], 200);
    }

    // jika produk ada di registry tapi gagal → JANGAN fallback; balikan error biar kelihatan sebabnya
    if ($inRegistry) {
        return response()->json([
            'message' => 'Product-app upstream error',
            'product' => $product,
            'upstream_status' => $app['status'] ?? 0,
            'upstream_error'  => $app['error']  ?? 'unknown',
        ], 502);
    }

    // 2) kalau tidak terdaftar di registry → baru fallback ke AppGenerate
    $ag = $this->ag->featuresByProduct($product, ['paginate' => 0]);
    if (!$ag['ok']) {
        return response()->json([
            'message' => 'AppGenerate upstream error',
            'upstream_status' => $ag['status'] ?? 0,
            'upstream_error'  => $ag['error']  ?? 'unknown',
        ], 502);
    }
    $rows = $ag['json']['data'] ?? $ag['json'] ?? [];
    return response()->json(['data' => is_array($rows) ? $rows : [], 'source' => 'appgenerate'], 200);
}


}
