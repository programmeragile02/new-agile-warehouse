<?php

use App\Http\Controllers\Api\AuthSyncController;
use App\Http\Controllers\Api\SubscriptionFeaturesController;
use App\Http\Controllers\Api\SyncUserController;
use App\Http\Controllers\Api\TenantResolveController;
use App\Http\Controllers\Gateway\OfferingGatewayController;
use App\Http\Controllers\Provisioning\JobsController;
use App\Http\Controllers\Tenant\TenantAuthController;
use App\Http\Middleware\RequireClientApiKey;
use App\Http\Middleware\VerifyClientKey;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Gateway\ProductGatewayController;
use App\Http\Controllers\Gateway\FeatureGatewayController;
use App\Http\Controllers\Gateway\MenuGatewayController;
use App\Http\Controllers\WarehouseProductSyncController;

// Health check (tanpa middleware)
Route::get('/health', fn () => response()->json([
    'ok'      => true,
    'service' => 'agile-warehouse',
]));

// ================== CATALOG (read-only proxy to AppGenerate) ==================
Route::prefix('catalog')
    // ->middleware(['client.key']) // <-- aktifkan jika punya middleware validasi X-CLIENT-KEY
    ->group(function () {
        // Daftar produk (digroup dari semua fitur AppGenerate)
        Route::get('/products',            [ProductGatewayController::class, 'index']);
        // Detail agregat satu produk (dari kumpulan fiturnya)
        Route::get('/products/{code}',     [ProductGatewayController::class, 'show']);

        // Fitur per produk (read-only, bersumber dari AppGenerate)
        Route::get('/products/{code}/features', [ProductGatewayController::class, 'features']);

        // Menu per produk (read-only, bersumber dari AppGenerate)
        Route::get('/products/{code}/menus',    [ProductGatewayController::class, 'menus']);

        // Route::get('/packages/{product}/{package}/matrix', [PackageMatrixGatewayController::class, 'show']);
        Route::get('/offerings/{product}/{offering}/matrix', [OfferingGatewayController::class, 'matrix']);
    });

// ================== (Opsional) Endpoint util untuk debugging ==================
Route::prefix('features')
    // ->middleware(['client.key']) // <-- opsional validasi X-CLIENT-KEY
    ->group(function () {
        // List fitur dengan filter ?product_code=...&type=...
        Route::get('/',                 [FeatureGatewayController::class, 'index']);
        // Alias fitur-per-produk: /api/features/{product}
        Route::get('/{product}',        [FeatureGatewayController::class, 'byProduct']);
    });
    Route::get('/features/{product}', [FeatureGatewayController::class, 'byProduct']);

    // === MENUS gateway (baru) ===
    Route::get('/catalog/menus',                    [MenuGatewayController::class, 'index']);     // ?product_code=&type=
    Route::get('/catalog/menus/tree',               [MenuGatewayController::class, 'tree']);      // ?product_code=
    Route::get('/catalog/products/{code}/menus',    [MenuGatewayController::class, 'byProduct']); // by product code

    
// get product dari panel
// Route::middleware([VerifyClientKey::class])
//     ->prefix('catalog')
//     ->group(function () {
//         Route::get('products', [ProductGatewayController::class, 'index']);
//         Route::get('products/{codeOrId}', [ProductGatewayController::class, 'show']);
//         // Jika masih butuh: Route::get('products/{code}/features', ...); dst.
//     });

// daftar & detail mirror product dari panel
Route::get ('/warehouse-products',        [WarehouseProductSyncController::class, 'index']);
Route::get ('/warehouse-products/{id}',   [WarehouseProductSyncController::class, 'show']);

// tombol/endpoint untuk tarik data dari Panel (sinkronisasi)
Route::post('/warehouse-products/sync',   [WarehouseProductSyncController::class, 'sync']);

// proses generate akun dan db
Route::post('/provisioning/jobs', [JobsController::class, 'store']);

// Auth 2-langkah (company-first)
// Route::post('/tenant/resolve-company', [TenantAuthController::class, 'resolveCompany']); // step-1
// Route::post('/tenant/login',           [TenantAuthController::class, 'login']);          // step-2

Route::get('/dev/test-wa', function (\App\Services\WhatsappSender $wa) {
    $to   = '+6281234982153';
    $text = "Tes cepat ✅\nIni pesan dari Warehouse (route).";
    $wa->sendTemplate($to, $text);
    return ['ok' => true];
});

// TenantResolve Untuk Login di aplikasi
Route::middleware([RequireClientApiKey::class])
    ->get('/tenants/resolve', [TenantResolveController::class, 'resolve']);

Route::post('/tenant/resolve-auth', [TenantResolveController::class, 'authenticate'])
    ->middleware(['throttle:60,1']);

Route::post('/tenant/resolve-login', [TenantResolveController::class, 'resolveLogin'])
  ->middleware(['throttle:60,1', RequireClientApiKey::class]);

Route::post('/tenant/sync-user-password', [AuthSyncController::class, 'syncUserPassword'])
  ->middleware(['throttle:60,1', RequireClientApiKey::class]);

// upsert user dari aplikasi catatmeter
Route::middleware([RequireClientApiKey::class])->group(function () {
    // SATU endpoint untuk upsert/aktif/nonaktif user CPIU
    Route::post('/tenant/sync-user', [SyncUserController::class, 'store']);
});

// addons ke aplikasi
Route::middleware([RequireClientApiKey::class])->get('/subscriptions/{instanceId}/features', [SubscriptionFeaturesController::class, 'show']);