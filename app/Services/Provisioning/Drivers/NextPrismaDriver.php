<?php

namespace App\Services\Provisioning\Drivers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class NextPrismaDriver implements ProductProvisionerDriver
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
        // Default connection "mysql" harus punya CREATE USER/GRANT OPTION
        return DB::connection('mysql');
    }

    protected function safeIdent(string $s): string
    {
        if (!preg_match('/^[A-Za-z0-9_]+$/', $s)) {
            throw new \InvalidArgumentException("Invalid identifier: {$s}");
        }
        return $s;
    }

    protected function composeDatabaseUrl(string $dbName): string
    {
        $user = rawurlencode((string) env('DB_USERNAME','root'));
        $pass = rawurlencode((string) env('DB_PASSWORD',''));
        $host = trim((string) env('DB_HOST','127.0.0.1'));
        $port = preg_replace('/\D/', '', (string) trim((string) env('DB_PORT','3306'))) ?: '3306';
        return "mysql://{$user}:{$pass}@{$host}:{$port}/{$dbName}";
    }

    protected function composeDatabaseUrlWithCreds(string $dbName, string $user, string $pass): string
    {
        $host = trim((string) env('DB_HOST','127.0.0.1'));
        $port = preg_replace('/\D/', '', (string) trim((string) env('DB_PORT','3306'))) ?: '3306';
        return "mysql://".rawurlencode($user).":".rawurlencode($pass)."@{$host}:{$port}/{$dbName}";
    }

    protected function run(array $cmd, string $cwd, array $env = []): void
    {
        $p = new Process($cmd, $cwd, array_merge($_ENV, $env));
        $p->setTimeout(900);
        $p->mustRun();
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
        $project = $manifest['paths']['next_root'] ?? null;
        if (!$project || !is_dir($project)) {
            throw new \RuntimeException("Next root not found: {$project}");
        }

        // Buat user tenant khusus db ini
        $creds = $this->provisionDbUser($dbName);

        // Jalankan prisma dengan user tenant
        $dbUrl = $this->composeDatabaseUrlWithCreds($dbName, $creds['username'], $creds['password']);
        $dbUrl = trim(str_replace(["\r", "\n"], '', $dbUrl));
        \Log::info('TP: Prisma migrate DSN', ['dsn' => preg_replace('#(mysql://[^:]+:)[^@]+(@)#', '$1****$2', $dbUrl)]);
        $this->run(['npx','prisma','generate'], $project, ['DATABASE_URL'=>$dbUrl, 'DB_PORT' => '3306',]);
        \Log::info('TP: Prisma migrate DSN', ['dsn' => preg_replace('#(mysql://[^:]+:)[^@]+(@)#', '$1****$2', $dbUrl)]);
        $this->run(['npx','prisma','migrate','deploy'], $project, ['DATABASE_URL'=>$dbUrl, 'DB_PORT' => '3306',]);
        \Log::info('TP: Prisma migrate DSN', ['dsn' => preg_replace('#(mysql://[^:]+:)[^@]+(@)#', '$1****$2', $dbUrl)]);
        $this->run(['npx','prisma','db','push', '--accept-data-loss'], $project, ['DATABASE_URL'=>$dbUrl, 'DB_PORT' => '3306',]);

        // Hardening privilege untuk runtime
        $this->hardenPrivileges($dbName, $creds['username']);

        // if (!empty($manifest['seed']['use_prisma_seed'])) {
        //     // Prisma default seed (prisma/seed.ts)
        //     $this->run(['npx','prisma','db','seed'], $project, ['DATABASE_URL'=>$dbUrl]);
        // }
    }

    public function seedTenant(string $dbName, array $manifest): void
    {
        $project = $manifest['paths']['next_root'] ?? null;
        if (!$project || !is_dir($project)) return;

        $script = $manifest['seed']['tenant_script'] ?? null; // e.g. 'scripts/tenant-seed.ts'
        if (!$script) return;

        // Pakai kredensial terakhir untuk konsistensi
        $creds = $this->getLastTenantCreds();
        $dbUrl = $creds
            ? $this->composeDatabaseUrlWithCreds($dbName, $creds['username'], $creds['password'])
            : $this->composeDatabaseUrl($dbName);

        $this->run(['npx','tsx',$script], $project, ['DATABASE_URL'=>$dbUrl]);
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
        $project = $manifest['paths']['next_root'] ?? null;
        $script  = $manifest['bootstrap']['script'] ?? 'scripts/bootstrap-tenant.ts';
        if (!$project || !$script) return;

        $creds = $this->getLastTenantCreds();
        $dbUrl = $creds
            ? $this->composeDatabaseUrlWithCreds($dbName, $creds['username'], $creds['password'])
            : $this->composeDatabaseUrl($dbName);

        $this->run([
            'npx', 'tsx', $script,
            "--companyId={$companyId}",
            "--companyPassHash={$companyPassHash}",
            "--adminEmail={$adminEmail}",
            "--adminUser={$adminUser}",
            "--adminPass={$adminPlainPass}",
        ], $project, ['DATABASE_URL'=>$dbUrl]);
    }

    public function onRenew(string $dbName, array $manifest, array $ctx = []): void
    {

        // NO OP dulu karena belum dipakai

        // $project = $manifest['paths']['next_root'] ?? null;
        // if (!$project) return;

        // $dbUrl = $this->composeDatabaseUrl($dbName);
        // $end   = $ctx['end_date'] ?? '';
        // $this->run(['npx','tsx','scripts/tenant-renew.ts',"--endDate={$end}"], $project, ['DATABASE_URL'=>$dbUrl]);
    }

    public function onUpgrade(
        string $dbName, array $manifest, ?string $pkgCode, ?string $pkgName, array $ctx = []
    ): void {

        // NO OP DULU karena belum dipakai

        // $project = $manifest['paths']['next_root'] ?? null;
        // if (!$project) return;

        // $dbUrl = $this->composeDatabaseUrl($dbName);
        // $this->run(['npx','prisma','migrate','deploy'], $project, ['DATABASE_URL'=>$dbUrl]);
        // $code = $pkgCode ?? '';
        // $this->run(['npx','tsx','scripts/set-package-flags.ts',"--pkgCode={$code}"], $project, ['DATABASE_URL'=>$dbUrl]);
    }

    public function enforceActiveState(string $dbName, bool $isActive, array $manifest): void
    {

        // NO OPERATION DULU karena belum dipakai

        // $project = $manifest['paths']['next_root'] ?? null;
        // if (!$project) return;

        // $dbUrl = $this->composeDatabaseUrl($dbName);
        // $this->run(['npx','tsx','scripts/set-active-state.ts',"--active=".($isActive?'1':'0')], $project, ['DATABASE_URL'=>$dbUrl]);
    }

    public function getLastTenantCreds(): ?array
    {
        return $this->lastTenantCreds;
    }
}