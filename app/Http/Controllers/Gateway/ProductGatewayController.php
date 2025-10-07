<?php

namespace App\Http\Controllers\Gateway;

use App\Http\Controllers\Controller;
use App\Services\AppGenerateClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductGatewayController extends Controller
{
    public function __construct(protected AppGenerateClient $client) {}

    /** GET /api/catalog/products */
    public function index(Request $request): JsonResponse
    {
        $all = $this->client->listAllFeatures([
            'type' => $request->query('type'),
        ]);

        if (!$all['ok']) {
            return response()->json([
                'message'  => 'Upstream (AppGenerate) error',
                'upstream' => $all['error'] ?? $all['status'],
            ], 502);
        }

        $features = $all['data'] ?? [];
        $grouped  = [];

        foreach ($features as $f) {
            $f = is_array($f) ? $f : (array)$f;

            $code = $f['product_code'] ?? null;
            if (!$code) continue;

            if (!isset($grouped[$code])) {
                $grouped[$code] = [
                    'product_code'   => $code,
                    'product_name'   => $f['product_name'] ?? $code,
                    'description'    => $f['product_description'] ?? null,
                    'category'       => $f['product_category'] ?? 'General',
                    'status'         => (($f['product_status'] ?? ($f['is_active'] ?? true)) ? 'Active' : 'Inactive'),
                    'total_features' => 0,
                    'created_at'     => $f['product_created_at'] ?? ($f['created_at'] ?? null),
                    'updated_at'     => $f['product_updated_at'] ?? ($f['updated_at'] ?? null),
                ];
            }

            $grouped[$code]['total_features']++;
        }

        return response()->json(['data' => array_values($grouped)]);
    }

    /** GET /api/catalog/products/{code} */
    public function show(string $code): JsonResponse
    {
        $resp = $this->client->featuresByProduct($code, ['paginate' => 0]);
        if (!$resp['ok']) {
            return response()->json([
                'message'  => 'Upstream (AppGenerate) error',
                'upstream' => $resp['error'] ?? $resp['status'],
            ], 502);
        }

        $rows = $resp['json']['data'] ?? $resp['json'] ?? [];
        if (!is_array($rows) || !count($rows)) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $f0 = is_array($rows[0]) ? $rows[0] : (array)$rows[0];

        $product = [
            'product_code'   => $f0['product_code'] ?? $code,
            'product_name'   => $f0['product_name'] ?? ($f0['product_code'] ?? 'Product'),
            'description'    => $f0['product_description'] ?? null,
            'category'       => $f0['product_category'] ?? 'General',
            'status'         => (($f0['product_status'] ?? ($f0['is_active'] ?? true)) ? 'Active' : 'Inactive'),
            'total_features' => count($rows),
            'created_at'     => $f0['product_created_at'] ?? ($f0['created_at'] ?? null),
            'updated_at'     => $f0['product_updated_at'] ?? ($f0['updated_at'] ?? null),
        ];

        return response()->json(['data' => $product]);
    }

    /** GET /api/catalog/products/{code}/features */
      public function features(string $code): JsonResponse
    {
        $resp = $this->client->featuresByProduct($code, ['paginate' => 0]);

        if (!$resp['ok']) {
            return response()->json([
                'message'  => 'Upstream (AppGenerate) error',
                'upstream' => $resp['error'] ?? $resp['status'],
            ], 502);
        }

        $rows = $resp['json']['data'] ?? $resp['json'] ?? [];
        if (!is_array($rows)) $rows = [];

        // cukup pass-through; map ringan untuk jaga tipe
        $data = array_map(function ($row) {
            $f = is_array($row) ? $row : (array)$row;

            return [
                'id'              => (string)($f['id'] ?? ''),
                'feature_code'    => (string)($f['feature_code'] ?? ''),
                'name'            => (string)($f['name'] ?? ''),          // ← biarkan apa adanya
                'description'     => (string)($f['description'] ?? ''),
                'module_name'     => (string)($f['module_name'] ?? 'General'),
                'item_type'       => strtoupper((string)($f['item_type'] ?? 'FEATURE')) === 'SUBFEATURE' ? 'SUBFEATURE' : 'FEATURE',
                'parent_id'       => isset($f['parent_id']) ? (string)$f['parent_id'] : null,
                'is_active'       => (bool)($f['is_active'] ?? true),
                'order_number'    => (int)($f['order_number'] ?? 0),
                'price_addon'     => isset($f['price_addon']) ? (float)$f['price_addon'] : 0.0,
                'trial_available' => isset($f['trial_available']) ? (bool)$f['trial_available'] : false,
                'trial_days'      => isset($f['trial_days']) ? (int)$f['trial_days'] : null,
                'created_at'      => $f['created_at'] ?? null,
                'updated_at'      => $f['updated_at'] ?? null,
                'product_code'    => (string)($f['product_code'] ?? ''),
            ];
        }, $rows);

        return response()->json(['data' => $data]);
    }


    /** GET /api/catalog/products/{code}/menus */
    public function menus(string $code): JsonResponse
    {
        $resp = $this->client->menusByProduct($code);
        if (!$resp['ok']) {
            return response()->json([
                'message'  => 'Upstream (AppGenerate) error',
                'upstream' => $resp['error'] ?? $resp['status'],
            ], 502);
        }

        $rows = $resp['json']['data'] ?? $resp['json'] ?? [];
        if (!is_array($rows)) $rows = [];

        $data = array_map(function ($m) {
            $m = is_array($m) ? $m : (array)$m;
            return [
                'id'           => (int)($m['id'] ?? 0),
                'parent_id'    => $m['parent_id'] ?? null,
                'title'        => (string)($m['title'] ?? $m['name'] ?? 'Menu'),
                'icon'         => (string)($m['icon'] ?? ''),
                'route_path'   => (string)($m['route_path'] ?? ''),
                'order'        => (int)($m['order_number'] ?? 0),
                'is_active'    => (bool)($m['is_active'] ?? true),
                'product_code' => (string)($m['product_code'] ?? ''),
                'type'         => (string)($m['type'] ?? 'menu'),
            ];
        }, $rows);

        return response()->json(['data' => $data]);
    }
}