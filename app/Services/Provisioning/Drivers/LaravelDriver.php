<?php

namespace App\Services\Provisioning\Drivers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class LaravelDriver implements ProductProvisionerDriver
{
    protected ?array $lastTenantCreds = null;

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

    protected function adminConn()
    {
        return DB::connection('mysql');
    }

    protected function safeIdent(string $s): string
    {
        if (!preg_match('/^[A-Za-z0-9_]+$/', $s)) {
            throw new \InvalidArgumentException("Invalid identifier: {$s}");
        }
        return $s;
    }

    protected function setTenantConn(string $dbName, ?array $creds = null): void
    {
        config(['database.connections.tenant' => [
            'driver'   => 'mysql',
            'host'     => env('DB_HOST','127.0.0.1'),
            'port'     => env('DB_PORT','3306'),
            'database' => $dbName,
            'username' => $creds['username'] ?? env('DB_USERNAME','root'),
            'password' => $creds['password'] ?? env('DB_PASSWORD',''),
            'charset'  => 'utf8mb4',
            'collation'=> 'utf8mb4_unicode_ci',
            'prefix'   => '',
            'strict'   => false,
        ]]);

        DB::purge('tenant');
        DB::reconnect('tenant');
        Schema::connection('tenant')->getConnection()->reconnect();
    }

    public function provisionDbUser(string $dbName): array
    {
        $db   = $this->safeIdent($dbName);
        $user = 'u_'.Str::lower(Str::random(12));
        $pass = Str::password(24, true, true, true);

        // Escape single-quote di password
        $passQ = str_replace("'", "\\'", $pass);

        // Penting: gunakan SINGLE QUOTE utk user & host; JANGAN backtick
        // Dan JANGAN pakai placeholder ? di CREATE USER / GRANT
        $this->adminConn()->statement("CREATE USER IF NOT EXISTS '{$user}'@'%' IDENTIFIED BY '{$passQ}'");

        // Saat provisioning: ALL biar migrate/seed lancar
        $this->adminConn()->statement("GRANT ALL PRIVILEGES ON `{$db}`.* TO '{$user}'@'%'");

        return $this->lastTenantCreds = ['username'=>$user, 'password'=>$pass];
    }

    public function hardenPrivileges(string $dbName, string $username): void
    {
        $db = $this->safeIdent($dbName);
        $u  = $this->safeIdent($username);

        $this->adminConn()->statement("REVOKE ALL PRIVILEGES, GRANT OPTION FROM '{$u}'@'%'");
        $this->adminConn()->statement("
            GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE, SHOW VIEW,
                CREATE TEMPORARY TABLES, REFERENCES
            ON `{$db}`.* TO '{$u}'@'%'
        ");
    }

    public function runMigrations(string $dbName, array $manifest): void
    {
        // 1) Buat user tenant
        $creds = $this->provisionDbUser($dbName);

        // 2) Migrate pakai user tenant
        $this->setTenantConn($dbName, $creds);

        $relPath = $manifest['paths']['migrations'] ?? null;
        if (!$relPath || !is_dir(base_path($relPath))) {
            throw new \RuntimeException("Laravel migration path not found: {$relPath}");
        }

        Artisan::call('migrate', [
            '--database' => 'tenant',
            '--path'     => $relPath,
            '--force'    => true,
        ]);

        // 3) Hardening privileges runtime
        $this->hardenPrivileges($dbName, $creds['username']);
    }

    public function seedTenant(string $dbName, array $manifest): void
    {
        // gunakan koneksi tenant (sudah diset saat runMigrations)
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
    ): void
    {
        // Koneksi tenant sudah di-set di runMigrations (pakai user tenant)
        // Upsert company + super admin seperti versi Anda sebelumnya

        $this->setTenantConn($dbName, $this->getLastTenantCreds());

        // Upsert company
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

        // Buat super admin (tabel fleksibel)
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

    public function getLastTenantCreds(): ?array
    {
        return $this->lastTenantCreds;
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