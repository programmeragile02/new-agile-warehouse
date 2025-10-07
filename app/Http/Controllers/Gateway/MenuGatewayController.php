<?php

// namespace App\Http\Controllers\Gateway;

// use App\Http\Controllers\Controller;
// use App\Services\AppGenerateClient;
// use Illuminate\Http\JsonResponse;
// use Illuminate\Http\Request;

// class MenuGatewayController extends Controller
// {
//     public function __construct(protected AppGenerateClient $ag) {}

//     /**
//      * GET /api/catalog/menus
//      * Query: ?product_code=xxx&type=menu|module|group|submenu
//      */
//     public function index(Request $request): JsonResponse
//     {
//         $payload = $this->ag->listMenus([
//             'product_code' => $request->query('product_code'),
//             'type'         => $request->query('type'),
//         ]);
//         return response()->json($payload);
//     }

//     /**
//      * GET /api/catalog/products/{idOrCode}/menus
//      */
//     public function byProduct(string $idOrCode): JsonResponse
//     {
//         $payload = $this->ag->menusByProduct($idOrCode);
//         return response()->json($payload);
//     }

//     /**
//      * GET /api/catalog/menus/tree
//      * Query: ?product_code=xxx
//      */
//     public function tree(Request $request): JsonResponse
//     {
//         $payload = $this->ag->menusTree($request->query('product_code'));
//         return response()->json($payload);
//     }
// }



namespace App\Http\Controllers\Gateway;

use App\Http\Controllers\Controller;
use App\Services\ProductAppClient;
use App\Services\AppGenerateClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuGatewayController extends Controller
{
    public function __construct(
        protected AppGenerateClient $ag,
        protected ProductAppClient $apps
    ) {}

    // GET /api/catalog/menus?product_code=... (tetap)
    public function index(Request $request): JsonResponse
    {
        $code = (string) $request->query('product_code', '');
        if ($code !== '') {
            // prefer product app
            $app = $this->apps->listMenus($code);
            if ($app['ok']) return response()->json(['data' => $app['data'] ?? []], 200);
        }
        // fallback AG
        $payload = $this->ag->listMenus([
            'product_code' => $code ?: null,
            'type' => $request->query('type'),
        ]);
        return response()->json($payload);
    }

    // GET /api/catalog/products/{idOrCode}/menus
   public function byProduct(string $idOrCode): JsonResponse
{
    $app = $this->apps->listMenus($idOrCode);
    if ($app['ok']) return response()->json(['data' => $app['data'] ?? [], 'source' => 'product-app'], 200);

    $payload = $this->ag->menusByProduct($idOrCode);
    // tambahkan penanda
    if (($payload['ok'] ?? false) && isset($payload['data'])) {
        $payload['source'] = 'appgenerate';
    }
    return response()->json($payload);
}


    // GET /api/catalog/menus/tree?product_code=... (opsional)
    public function tree(Request $request): JsonResponse
    {
        $code = (string) $request->query('product_code', '');
        $app  = $this->apps->listMenus($code);
        if ($app['ok']) {
            // Warehouse bisa bangun tree ringan di sini bila mau (by parent_id)
            $rows = $app['data'] ?? [];
            $map  = []; $tree = [];
            foreach ($rows as $r) { $r['children'] = []; $map[$r['id']] = $r; }
            foreach ($map as $id => &$n) {
                $pid = $n['parent_id'] ?? null;
                if ($pid && isset($map[$pid])) $map[$pid]['children'][] = &$n;
                else $tree[] = &$n;
            }
            return response()->json(['data' => $tree], 200);
        }
        // fallback AG
        $payload = $this->ag->menusTree($code ?: null);
        return response()->json($payload);
    }
    

}
