<?php

namespace App\Services\Provisioning\Drivers;

use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;

class NextPrismaDriver implements ProductProvisionerDriver
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

    protected function composeDatabaseUrl(string $dbName): string
    {
        $user = env('DB_USERNAME','root');
        $pass = env('DB_PASSWORD','');
        $host = env('DB_HOST','127.0.0.1');
        $port = env('DB_PORT','3306');
        return "mysql://{$user}:{$pass}@{$host}:{$port}/{$dbName}";
    }

    protected function run(array $cmd, string $cwd, array $env = []): void
    {
        $p = new Process($cmd, $cwd, array_merge($_ENV, $env));
        $p->setTimeout(900);
        $p->mustRun();
    }

    public function runMigrations(string $dbName, array $manifest): void
    {
        $project = $manifest['paths']['next_root'] ?? null;
        if (!$project || !is_dir($project)) {
            throw new \RuntimeException("Next root not found: {$project}");
        }
        $dbUrl = $this->composeDatabaseUrl($dbName);

        $this->run(['npx','prisma','generate'], $project, ['DATABASE_URL'=>$dbUrl]);
        $this->run(['npx','prisma','migrate','deploy'], $project, ['DATABASE_URL'=>$dbUrl]);
        $this->run(['npx','prisma','db','push', '--accept-data-loss'], $project, ['DATABASE_URL'=>$dbUrl]);

        // if (!empty($manifest['seed']['use_prisma_seed'])) {
        //     // Prisma default seed (prisma/seed.ts)
        //     $this->run(['npx','prisma','db','seed'], $project, ['DATABASE_URL'=>$dbUrl]);
        // }
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
        $project = $manifest['paths']['next_root'] ?? null;
        $script  = $manifest['bootstrap']['script'] ?? 'scripts/bootstrap-tenant.ts'; // default TS
        if (!$project || !$script) return;

        $dbUrl = $this->composeDatabaseUrl($dbName);
        $this->run([
            'npx', 'tsx', $script, // <— sebelumnya 'node'
            "--companyId={$companyId}",
            "--companyPassHash={$companyPassHash}",
            "--adminEmail={$adminEmail}",
            "--adminUser={$adminUser}",
            "--adminPass={$adminPlainPass}",
        ], $project, ['DATABASE_URL'=>$dbUrl]);
    }

    
    public function seedTenant(string $dbName, array $manifest): void
    {
        $project = $manifest['paths']['next_root'] ?? null;
        if (!$project || !is_dir($project)) return;

        $script = $manifest['seed']['tenant_script'] ?? null; // e.g. 'scripts/tenant-seed.ts'
        if (!$script) return;

        $dbUrl = $this->composeDatabaseUrl($dbName);
        $this->run(['npx','tsx',$script], $project, ['DATABASE_URL'=>$dbUrl]);
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
}