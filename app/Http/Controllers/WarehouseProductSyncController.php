<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\WarehouseProduct;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WarehouseProductSyncController extends Controller
{
    /**
     * GET /api/warehouse-products
     * Tampilkan semua produk di warehouse
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => WarehouseProduct::orderBy('id')->get(),
        ]);
    }

    /**
     * POST /api/warehouse-products/sync
     * Tarik dari Panel -> simpan/udpate ke warehouse_products
     * Sinkron langsung dari Panel ke Warehouse
     * (Hard delete) Hapus baris di warehouse yang sudah tidak ada di Panel.
     */
    public function sync(Request $request)
    {
        $panelBase = rtrim(config('services.panel.base'), '/');
        if ($panelBase === '') {
            return response()->json(['message' => 'services.panel.base not configured'], 500);
        }
        $panelUrl  = $panelBase . '/catalog/products';
        $clientKey = trim((string) config('services.panel.key', ''));

        $http = Http::acceptJson();
        if ($clientKey !== '') {
            $http = $http->withHeaders(['X-CLIENT-KEY' => $clientKey]);
        }

        $resp = $http->get($panelUrl);

        if ($resp->failed()) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch products from Panel',
                'error'   => $resp->json() ?? $resp->body(),
            ], 502);
        }

        $payload = $resp->json();
        $rows = $payload['data'] ?? (is_array($payload) ? $payload : []);
        if (!is_array($rows)) $rows = [];

        // Kumpulkan ID dan product_code yang datang dari Panel
        $remoteIds   = [];
        $remoteCodes = [];

        $upserted = 0;
        
        foreach ($rows as $row) {
            // Validasi minimal
            if (!isset($row['id'], $row['product_code'])) {
                continue;
            }

            $incomingId   = (int) $row['id'];
            $incomingCode = (string) $row['product_code'];

            $remoteIds[]   = $incomingId;
            $remoteCodes[] = $incomingCode;

            // Cegah bentrok: product_code tidak boleh dipakai ID lain
            $existsOther = WarehouseProduct::where('product_code', $incomingCode)
                ->where('id', '!=', $incomingId)
                ->first();

            if ($existsOther) {
                return response()->json([
                    'success'      => false,
                    'message'      => 'Conflict: product_code already used by another id',
                    'product_code' => $incomingCode,
                    'panel_id'     => $incomingId,
                    'warehouse_id' => (int) $existsOther->id,
                ], 409);
            }

            // upsert by ID (sinkronkan id dan code)
            WarehouseProduct::updateOrCreate(
                ['id' => $incomingId],
                [
                    'product_code'          => $incomingCode,
                    'product_name'          => (string) ($row['product_name'] ?? $row['name'] ?? $row['product_code']),
                    'category'              => (string) ($row['category']),
                    'status'                => (string) ($row['status']),
                    'description'           => (string) ($row['description']),        
                    'master_db_name'        => (string) ($row['db_name'] ?? 'default'),
                    'total_features'        => (string) ($row['total_features'] ?? 'default'),
                    'master_schema_version' => isset($row['schema_version']) ? (string) $row['schema_version'] : null,
                ]
            );
            $upserted++;
        }

         // HARD DELETE: hapus apa pun yang tidak ada di Panel
        // Pakai DB::table agar pasti delete fisik (abaikan SoftDeletes)
        $deleted = 0;
        if (count($remoteIds) > 0) {
            $deleted = DB::table('warehouse_products')
                ->whereNotIn('id', $remoteIds)
                ->delete();
        } else {
            // kalau Panel kosong total → hapus semua
            $deleted = DB::table('warehouse_products')->delete();
        }

        $totalNow = WarehouseProduct::count();

        return response()->json([
            'success' => true,
            'message' => 'Sync product complete',
            'upserted'  => $upserted,
            'deleted'   => $deleted,
            'total product' => $totalNow,
        ]);
    }

    /**
     * GET /api/warehouse-products/{id}
     */
    public function show($id)
    {
        $row = WarehouseProduct::find($id);
        if (!$row) {
            return response()->json([
                'success' => false,
                'message' => 'Not found'
            ], 404);
        }
        return response()->json([
            'success'=> true,
            'data' => $row
        ]);
    }
}
