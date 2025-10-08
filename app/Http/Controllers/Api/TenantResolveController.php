<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenantResolveController extends Controller
{
    public function show(Request $req)
    {
        $companyId   = Str::upper((string) $req->query('company_id'));
        $productCode = Str::upper((string) $req->query('product_code', ''));

        if (!$companyId || !$productCode) {
            return response()->json(['ok'=>false,'error'=>'MISSING_PARAMS'], 422);
        }

        $inst = DB::table('customer_product_instances')
            ->where('company_id', $companyId)
            ->where('product_code', $productCode)
            // ->whereIn('status', ['active','paid'])
            ->where('is_active', 1)
            // ->where(function($q){
            //     $q->whereNull('end_date')->orWhere('end_date','>=', now()->toDateString());
            // })
            ->orderByDesc('created_at')
            ->first();

        if (!$inst) {
            return response()->json(['ok'=>false,'error'=>'INSTANCE_NOT_FOUND'], 404);
        }

        // Susun DATABASE_URL dari env Warehouse (user/pass/host/port) + nama DB tenant
        $user = env('DB_USERNAME','root');
        $pass = env('DB_PASSWORD','');
        $host = env('DB_HOST','127.0.0.1');
        $port = env('DB_PORT','3306');
        $dbUrl = sprintf('mysql://%s:%s@%s:%s/%s', $user, urlencode($pass), $host, $port, $inst->database_name);

        return response()->json([
            'ok'   => true,
            'data' => [
                'company_id'   => $inst->company_id,
                'product_code' => $inst->product_code,
                'db_url'       => $dbUrl,
                'package_code' => $inst->package_code,
                'app_url'      => $inst->app_url,
            ]
        ]);
    }
}