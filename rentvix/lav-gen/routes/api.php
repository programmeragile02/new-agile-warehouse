<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Public\FeaturePublicController;
use App\Http\Controllers\Generate\MenuController;
use App\Http\Middleware\VerifyGatewayKey;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Generate\AccessControlMatrixController as ACM;
use App\Http\Middleware\JwtEnsureType;
use App\Http\Middleware\EnsurePermission;
Route::options('/{any}', function () {
    return response()->noContent(204);
})->where('any', '.*');

/*
|--------------------------------------------------------------------------
| AUTH (JWT) 2 langkah
|--------------------------------------------------------------------------
*/

// 1) Company login (tanpa token)
Route::post('/auth/company/login', [AuthController::class, 'companyLogin']);

// 2) Company me (wajib token company)
Route::get('/auth/company/me', [AuthController::class, 'companyMe'])
    ->middleware(JwtEnsureType::class.':company');

// 3) User login (wajib token company di Authorization)
Route::post('/auth/user/login', [AuthController::class, 'userLogin'])
    ->middleware(JwtEnsureType::class.':company');

// 4) User me (wajib token user)
Route::get('/auth/user/me', [AuthController::class, 'userMe'])
    ->middleware(JwtEnsureType::class.':user');

// 5) Logout & Refresh (boleh company/user) – contoh dua route berbeda
Route::post('/auth/logout/company', [AuthController::class, 'logout'])
    ->middleware(JwtEnsureType::class.':company');

Route::post('/auth/logout/user', [AuthController::class, 'logout'])
    ->middleware(JwtEnsureType::class.':user');

Route::post('/auth/refresh/company', [AuthController::class, 'refresh'])
    ->middleware(JwtEnsureType::class.':company');

Route::post('/auth/refresh/user', [AuthController::class, 'refresh'])
    ->middleware(JwtEnsureType::class.':user');

Route::get('{entity}/export-pdf', [\App\Http\Controllers\Export\ExportPdfController::class, 'export'])->name('pdf.export');
// Route for mst_users
Route::get('data-users/actions', [\App\Http\Controllers\Overrides\DataUserController::class, 'listActions']);
Route::match(['GET','POST'], 'data-users/actions/{actionKey}', [\App\Http\Controllers\Overrides\DataUserController::class, 'runAction']);
Route::get('data-users/export-excel', [\App\Http\Controllers\Generate\DataUserController::class, 'exportExcel']);
Route::apiResource('data-users', \App\Http\Controllers\Overrides\DataUserController::class);
// Route for mst_kendaraans
Route::get('data-kendaraans/actions', [\App\Http\Controllers\Overrides\DataKendaraanController::class, 'listActions']);
Route::match(['GET','POST'], 'data-kendaraans/actions/{actionKey}', [\App\Http\Controllers\Overrides\DataKendaraanController::class, 'runAction']);
Route::get('data-kendaraans/export-excel', [\App\Http\Controllers\Generate\DataKendaraanController::class, 'exportExcel']);
Route::apiResource('data-kendaraans', \App\Http\Controllers\Overrides\DataKendaraanController::class);

// Route for daftar-kendaraans
Route::get('daftar-kendaraans/actions', [\App\Http\Controllers\Overrides\DaftarKendaraanController::class, 'listActions']);
Route::match(['GET','POST'], 'daftar-kendaraans/actions/{actionKey}', [\App\Http\Controllers\Overrides\DaftarKendaraanController::class, 'runAction']);
Route::get('daftar-kendaraans/export-excel', [\App\Http\Controllers\Generate\DaftarKendaraanController::class, 'exportExcel']);
Route::apiResource('daftar-kendaraans', \App\Http\Controllers\Overrides\DaftarKendaraanController::class);
Route::get('/daftar-kendaraans-deleted', [\App\Http\Controllers\Overrides\DaftarKendaraanController::class, 'deletedData']);
Route::post('/daftar-kendaraans/restore/{id}', [\App\Http\Controllers\Overrides\DaftarKendaraanController::class, 'restore']);
Route::delete('/daftar-kendaraans/force/{id}', [\App\Http\Controllers\Overrides\DaftarKendaraanController::class, 'forceDelete']);
Route::get('level_users/stats', [App\Http\Controllers\Generate\LevelUserController::class, 'stats']);
Route::apiResource('level_users', App\Http\Controllers\Generate\LevelUserController::class);
Route::apiResource('companies', App\Http\Controllers\Generate\CompanyController::class);
Route::apiResource('user_managements', App\Http\Controllers\Generate\UserManagementController::class);
Route::get('user_managements/stats', [App\Http\Controllers\Generate\UserManagementController::class, 'stats'])
    ->name('user_managements.stats');
Route::post('access_control_matrices/bulk', [ACM::class, 'storeBulk'])->name('acm.bulk.store');
Route::put('access_control_matrices/bulk', [ACM::class, 'updateBulk'])->name('acm.bulk.update');


Route::get('access_control_matrices/stats', [ACM::class, 'stats'])->name('acm.stats');

Route::apiResource('access_control_matrices', App\Http\Controllers\Generate\AccessControlMatrixController::class);
// == menus_START ==


Route::get('menus/tree', [MenuController::class, 'tree']);
Route::post('menus/reorder', [MenuController::class, 'reorder']);
Route::post('menus/{id}/restore', [MenuController::class, 'restore']);
Route::delete('menus/{id}/force', [MenuController::class, 'forceDelete']);
Route::apiResource('menus', MenuController::class);
// == menus_END ==
// Semua endpoint publik harus lewat Warehouse (X-AG-KEY)
Route::middleware([VerifyGatewayKey::class])->group(function () {
    Route::get('/public/features', [FeaturePublicController::class, 'index']);
    Route::get('/public/features/by-product/{idOrCode}', [FeaturePublicController::class, 'byProduct']);
});


// Healthcheck sederhana
Route::get('/health', fn () => response()->json(['ok' => true, 'service' => 'appgenerate']));