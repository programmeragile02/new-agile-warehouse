<?php

namespace App\Services\Provisioning\Drivers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class LaravelDriver implements ProductProvisionerDriver
{
    public function ensureDatabase(string $dbName): void
    {
        $exists = DB::select(
            "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
            [$dbName]
        );
        if (empty($exists)) {
            DB::statement(
                "CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            );
        }
    }

    protected function setTenantConn(string $dbName): void
    {
        config(['database.connections.tenant' => [
            'driver'   => 'mysql',
            'host'     => env('DB_HOST','127.0.0.1'),
            'port'     => env('DB_PORT','3306'),
            'database' => $dbName,
            'username' => env('DB_USERNAME','root'),
            'password' => env('DB_PASSWORD',''),
            'charset'  => 'utf8mb4',
            'collation'=> 'utf8mb4_unicode_ci',
            'prefix'   => '',
            'strict'   => false,
        ]]);

        DB::purge('tenant');
        DB::reconnect('tenant');
        Schema::connection('tenant')->getConnection()->reconnect();
    }

    public function runMigrations(string $dbName, array $manifest): void
    {
        $this->setTenantConn($dbName);

        $relPath = $manifest['paths']['migrations'] ?? null;
        if (!$relPath || !is_dir(base_path($relPath))) {
            throw new \RuntimeException("Laravel migration path not found: {$relPath}");
        }

        Artisan::call('migrate', [
            '--database' => 'tenant',
            '--path'     => $relPath,
            '--force'    => true,
        ]);
    }

    public function seedTenant(string $dbName, array $manifest): void
    {
        $this->setTenantConn($dbName);

        foreach (($manifest['paths']['seeders'] ?? []) as $file) {
            $full = base_path($file);
            if (file_exists($full)) {
                require_once $full;
                $fqcn = 'Database\\Seeders\\'.pathinfo($full, PATHINFO_FILENAME);
                if (class_exists($fqcn)) {
                    Artisan::call('db:seed', [
                        '--database' => 'tenant',
                        '--class'    => $fqcn,
                        '--force'    => true,
                    ]);
                }
            }
        }
    }

    public function bootstrapTenant(
        string $dbName,
        string $companyId,
        string $companyPassHash,
        string $adminEmail,
        string $adminUser,
        string $adminPlainPass,
        array  $manifest
    ): void {
        $this->setTenantConn($dbName);

        // Upsert company (sesuaikan nama tabel kolom)
        $q   = DB::connection('tenant')->table('mst_company');
        $row = $q->first();
        $now = now();

        if ($row) {
            $q->where('id', $row->id)->update([
                'company_id' => $companyId,
                'password'   => $companyPassHash,
                'updated_at' => $now,
            ]);
        } else {
            $q->insert([
                'id'         => Str::ulid()->toBase32(),
                'company_id' => $companyId,
                'name'       => 'Default Company',
                'password'   => $companyPassHash,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Buat super admin (sesuaikan tabel)
        $hash = \Illuminate\Support\Facades\Hash::make($adminPlainPass);

        $userTable = Schema::connection('tenant')->hasTable('user_management')
            ? 'user_management'
            : (Schema::connection('tenant')->hasTable('users') ? 'users' : null);

        if (!$userTable) {
            throw new \RuntimeException("No user table found in tenant DB ({$dbName}).");
        }

        $cols    = DB::connection('tenant')->getSchemaBuilder()->getColumnListing($userTable);
        $payload = [
            'id'         => Str::ulid()->toBase32(),
            'nama'       => 'Super Admin',
            'email'      => $adminUser,
            'password'   => $hash,
            'role'       => 1,
            'company_id' => $companyId,
            'created_at' => $now,
            'updated_at' => $now,
        ];
        $payload = array_intersect_key($payload, array_flip($cols));

        DB::connection('tenant')->table($userTable)->insert($payload);
    }

    public function onRenew(string $dbName, array $manifest, array $ctx = []): void
    {
        // NO OPERATION DULU karena belum dipakai
        // $this->setTenantConn($dbName);
        // DB::connection('tenant')->table('mst_company')->limit(1)->update([
        //     'license_end_at' => $ctx['end_date'] ?? null,
        //     'updated_at'     => now(),
        // ]);
    }

    public function onUpgrade(
        string $dbName, array $manifest, ?string $pkgCode, ?string $pkgName, array $ctx = []
    ): void {

        // NO OP DULU karena belum dipakai

        // $this->setTenantConn($dbName);
        // // Contoh: set feature flags sesuai paket
        // $features = $this->mapFeaturesByPackage($pkgCode);
        // foreach ($features as $f) {
        //     DB::connection('tenant')->table('feature_flags')
        //       ->updateOrInsert(['key' => $f['key']], ['enabled' => $f['enabled']]);
        // }
    }

    public function enforceActiveState(string $dbName, bool $isActive, array $manifest): void
    {

        // NO OP dulu karena belum dipakai

        // $this->setTenantConn($dbName);
        // DB::connection('tenant')->table('mst_company')->limit(1)->update([
        //     'is_active'  => $isActive,
        //     'updated_at' => now(),
        // ]);
    }

    // BELUM KEPAKAI MISAL NANTI UNTUK DI UPGRADE PAKET
    protected function mapFeaturesByPackage(?string $pkgCode): array
    {
        // mapping simple contoh
        return match (strtoupper((string)$pkgCode)) {
            'BASIC'   => [['key'=>'ADV_REPORT', 'enabled'=>0], ['key'=>'MULTI_BRANCH','enabled'=>0]],
            'PREMIUM' => [['key'=>'ADV_REPORT', 'enabled'=>1], ['key'=>'MULTI_BRANCH','enabled'=>0]],
            'ULTIMATE'=> [['key'=>'ADV_REPORT', 'enabled'=>1], ['key'=>'MULTI_BRANCH','enabled'=>1]],
            default   => [],
        };
    }
}