<?php

namespace App\Services\Provisioning\Drivers;

interface ProductProvisionerDriver
{
    public function ensureDatabase(string $dbName): void;

    /** Purchase: jalankan migrasi & seeder */
    public function runMigrations(string $dbName, array $manifest): void;
    public function seedTenant(string $dbName, array $manifest): void;

    /** Purchase: bootstrap company + superadmin */
    public function bootstrapTenant(
        string $dbName,
        string $companyId,
        string $companyPassHash,
        string $adminEmail,
        string $adminUser,
        string $adminPlainPass,
        array  $manifest
    ): void;

    /** Renew/Upgrade hook (opsional per produk) */
    public function onRenew(string $dbName, array $manifest, array $ctx = []): void;

    public function onUpgrade(
        string $dbName,
        array $manifest,
        ?string $pkgCode,
        ?string $pkgName,
        array $ctx = []
    ): void;

    /** Sinkron state aktif/nonaktif di tenant (opsional) */
    public function enforceActiveState(string $dbName, bool $isActive, array $manifest): void;

    /** Create DB User & Password */
    public function provisionDbUser(string $dbName): array;

    /** Flush Previleges User DB */
    public function hardenPrivileges(string $dbName, string $username): void;
    public function getLastTenantCreds(): ?array; // optional cache
}