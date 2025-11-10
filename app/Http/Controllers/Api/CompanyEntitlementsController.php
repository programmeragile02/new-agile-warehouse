<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * POST /api/company/entitlements
 * Body: { company_id: string, product_code: string }
 * Response:
 * {
 *   entitlements: [
 *     { code: "extra.customers", value_number: 5 },
 *     { code: "maksimal.pelanggan", value_number: 45 }
 *   ],
 *   packageCode: "PREMIUM"
 * }
 */
class CompanyEntitlementsController extends Controller
{
    public function __invoke(Request $req)
    {
        $data = $req->validate([
            'company_id'   => 'required|string',
            'product_code' => 'required|string',
        ]);

        $companyId   = $data['company_id'];
        $productCode = $data['product_code'];

        // Instance (central) – ambil yang terbaru/aktif
        $instance = DB::table('customer_product_instances')
            ->where('company_id', $companyId)
            ->where('product_code', $productCode)
            ->orderByDesc('created_at')
            ->first(['subscription_instance_id','package_code']);

        $pkg = strtoupper((string)($instance->package_code ?? 'BASIC'));

        // Tier dasar (fallback). Kalau kamu punya sumber harga resmi, ganti di sini.
        $tierLimit = [
            'BASIC'         => 20,
            'PREMIUM'       => 40,
            'PROFESSIONAL'  => 70,
        ];
        $base = $tierLimit[$pkg] ?? 20;

        // Total qty untuk master addon “ekstra pelanggan”
        $extraQty = 0;
        if ($instance?->subscription_instance_id) {
            $extraQty = (int) DB::table('subscription_addons')
                ->where('subscription_instance_id', $instance->subscription_instance_id)
                ->where('addon_code', 'ekstra-pelanggan') // ← ganti jika kodenya beda
                ->sum(DB::raw('COALESCE(qty,0)'));
        }

        return response()->json([
            'entitlements' => [
                ['code' => 'extra.customers',     'value_number' => $extraQty],
                ['code' => 'maksimal.pelanggan',  'value_number' => max(0, $base + $extraQty)],
            ],
            'packageCode' => $pkg,
        ]);
    }
}