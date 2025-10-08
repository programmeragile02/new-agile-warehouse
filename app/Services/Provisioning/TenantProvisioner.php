<?php

namespace App\Services\Provisioning;

use App\Mail\AddonActivatedMail;
use App\Mail\RenewMail;
use App\Mail\UpgradeMail;
use App\Models\CustomerProductInstance;
use App\Models\ProvisioningJob;
use App\Services\WhatsappTemplates;
use App\Services\WhatsappSender;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\ProvisionedMail;

// Driver contracts & implementations
use App\Services\Provisioning\Drivers\ProductProvisionerDriver;
use App\Services\Provisioning\Drivers\LaravelDriver;
use App\Services\Provisioning\Drivers\NextPrismaDriver;

class TenantProvisioner
{
    /**
     * Entry point: jalankan provisioning berdasarkan intent.
     * - purchase: buat tenant/DB baru + kredensial
     * - renew:    update masa aktif instance lama (tanpa buat DB baru)
     * - upgrade:  update paket/durasi (in-place), bisa jalankan skrip upgrade di tenant bila perlu
     */
    public function provision(ProvisioningJob $job): void
    {
        try {
            $intent = strtolower((string) $job->intent ?: 'purchase');

            Log::info('TP: start provision', [
                'job_id'   => $job->id,
                'intent'   => $intent,
                'order_id' => $job->order_id,
                'product'  => $job->product_code,
            ]);

            switch ($intent) {
                case 'renew':
                    $this->applyRenewInPlace($job);
                    break;

                case 'upgrade':
                    $this->applyUpgradeInPlace($job);
                    break;

                case 'addon':
                    $this->applyAddon($job);
                    break;

                case 'purchase':
                default:
                    $this->applyPurchaseNewInstance($job);
                    break;
            }

            Log::info('TP: done', ['job_id' => $job->id, 'intent' => $intent]);

        } catch (Exception $e) {
            Log::error('TP: failed', [
                'job_id' => $job->id ?? null,
                'error'  => $e->getMessage(),
                'trace'  => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * PURCHASE — Buat instance baru per produk/stack.
     */
    protected function applyPurchaseNewInstance(ProvisioningJob $job): void
    {
        // Validasi email customer
        $adminEmail = data_get($job->meta, 'customer_email');
        if (!$adminEmail) {
            throw new \InvalidArgumentException('Missing meta.customer_email in job.');
        }
        $customerName = data_get($job->meta, 'customer_name');

        // Tentukan dbName sekali (idempoten)
        $dbName = data_get($job->meta, 'db_name');
        if (!$dbName) {
            $short  = Str::lower($job->product_code);        // mis. rentvix / tirtabening
            $suffix = substr(Str::uuid()->toString(), 0, 8); // ab12cd34
            $dbName = "{$short}_{$suffix}";

            $job->meta = array_merge($job->meta ?? [], ['db_name' => $dbName]);
            $job->save();
        }

        // Ambil manifest + driver untuk productCode
        $manifest = $this->getManifest($job->product_code);
        $driver   = $this->resolveDriver($manifest);

        // Pastikan DB ada (per-driver; idempoten)
        $driver->ensureDatabase($dbName);

        // Jalankan migrasi + seeder sesuai stack
        $driver->runMigrations($dbName, $manifest);
        $driver->seedTenant($dbName, $manifest);

        // Generate kredensial company & admin
        $companyId       = $this->generateUniqueCompanyId($job->product_code);
        $companyPassword = Str::password(12, true, true, false);
        $companyPassHash = Hash::make($companyPassword);

        $adminUser = 'admin@'.$dbName;
        $adminPass = Str::password(12, true, true, false);

        // Bootstrap tenant (company + super admin) via driver
        $driver->bootstrapTenant(
            dbName:           $dbName,
            companyId:        $companyId,
            companyPassHash:  $companyPassHash,
            adminEmail:       $adminEmail,
            adminUser:        $adminUser,
            adminPlainPass:   $adminPass,
            manifest:         $manifest
        );

        // Bentuk URL app: gunakan url_template dari manifest bila ada
        $appUrl = $this->deriveAppUrlUsingManifest($manifest, $job->product_code, explode('_', $dbName, 2)[1] ?? '');

        // Tentukan subscription_instance_id (kalau Store sudah kirim, pakai itu; jika tidak, generate)
        $subscriptionInstanceId = $job->subscription_instance_id ?: (string) Str::uuid();

        // Simpan mapping central (instance baru)
        CustomerProductInstance::updateOrCreate(
            ['order_id' => $job->order_id, 'product_code' => $job->product_code],
            [
                'subscription_instance_id' => $subscriptionInstanceId,

                'customer_id'   => $job->customer_id,
                'product_name'  => $job->product_name,
                'package_code'  => data_get($job->package, 'code'),
                'package_name'  => data_get($job->package, 'name'),
                'duration_code' => data_get($job->duration, 'code'),
                'duration_name' => data_get($job->duration, 'name'),

                'start_date'    => $job->start_date,
                'end_date'      => $job->end_date,
                'is_active'     => (bool) $job->is_active, // harus true bila order paid

                'midtrans_order_id' => $job->midtrans_order_id,
                'status'            => $job->is_active ? 'active' : 'inactive',

                'database_name'          => $dbName,
                'app_url'                => $appUrl,
                'company_id'             => $companyId,
                'company_password_plain' => $companyPassword, // opsional: null-kan setelah dikirim
                'company_password_hash'  => $companyPassHash,
                'admin_email'            => $adminEmail,
                'admin_username'         => $adminUser,
                'admin_password_plain'   => $adminPass,       // opsional: null-kan setelah dikirim
            ]
        );

        // Kirim email kredensial
        try {
            Mail::to($adminEmail)->send(new ProvisionedMail(
                product: $job->product_code,
                appUrl:  $appUrl,
                companyId: $companyId,
                companyPassword: $companyPassword,
                username: $adminUser,
                password: $adminPass,
                recipientName: $customerName,
            ));
            Log::info('TP: email sent');
        } catch (Exception $e) {
            Log::error('TP: email failed', ['err' => $e->getMessage()]);
        }

        // Kirim WA
        if ($phone = data_get($job->meta, 'customer_phone')) {
            $text = WhatsappTemplates::purchase([
                'product_name'     => $job->product_name ?? $job->product_code,
                'customer_name'    => data_get($job->meta, 'customer_name', 'Pelanggan'),
                'app_url'          => $appUrl,
                'company_id'       => $companyId,
                'company_password' => $companyPassword,
                'admin_username'   => $adminUser,
                'admin_password'   => $adminPass,
            ]);

            app(WhatsappSender::class)->sendTemplate(to: $phone, text: $text);
        }
    }

    /**
     * RENEW — Perpanjangan masa aktif instance (in-place)
     */
    protected function applyRenewInPlace(ProvisioningJob $job): void
    {
        $instance = $this->resolveInstanceForBaseOrder($job);
        if (!$instance) {
            throw new \RuntimeException("Base instance not found for renew (base_order_id={$job->base_order_id}).");
        }

        // Update masa aktif INSTANCE lama sesuai tanggal dari Store (central)
        $instance->end_date          = $this->maxDate($instance->end_date, $job->end_date);
        $instance->is_active         = (bool) $job->is_active;
        $instance->midtrans_order_id = $job->midtrans_order_id ?: $instance->midtrans_order_id;
        $instance->status            = $instance->is_active ? 'active' : 'inactive';
        $instance->save();

        // Sinkron ke tenant via driver: onRenew + enforceActiveState
        $manifest = $this->getManifest($job->product_code);
        $driver   = $this->resolveDriver($manifest);

        if ($dbName = $instance->database_name) {
            $driver->onRenew($dbName, $manifest, [
                'instance_id' => $instance->subscription_instance_id,
                'end_date'    => $instance->end_date,
            ]);
            $driver->enforceActiveState($dbName, (bool) $instance->is_active, $manifest);
        }

        // Notifikasi email
        $email = data_get($job->meta, 'customer_email');
        if ($email) {
            Mail::to($email)->send(new RenewMail(
                product:       $job->product_name ?? $job->product_code,
                appUrl:        $instance->app_url ?? '#',
                recipientName: data_get($job->meta, 'customer_name', 'Customer'),
                endDate:       Carbon::parse($instance->end_date)->isoFormat('D MMMM Y'),
            ));
        }

        // kirim wa
        if ($phone = data_get($job->meta, 'customer_phone')) {
            $text = WhatsappTemplates::renew([
                'product_name'  => $job->product_name ?? $job->product_code,
                'customer_name' => data_get($job->meta, 'customer_name', 'Pelanggan'),
                'end_date_fmt'  => Carbon::parse($instance->end_date)->isoFormat('D MMMM Y'),
            ]);
            app(WhatsappSender::class)->sendTemplate(to: $phone, text: $text);
        }
    }

    /**
     * UPGRADE — Ubah paket/durasi (in-place)
     */
    protected function applyUpgradeInPlace(ProvisioningJob $job): void
    {
        $instance = $this->resolveInstanceForBaseOrder($job);
        if (!$instance) {
            throw new \RuntimeException("Base instance not found for upgrade (base_order_id={$job->base_order_id}).");
        }

        // Update paket/durasi sesuai kiriman Store (central)
        $pkgCode = data_get($job->package, 'code');
        $pkgName = data_get($job->package, 'name');
        $durCode = data_get($job->duration, 'code');
        $durName = data_get($job->duration, 'name');

        if ($pkgCode) $instance->package_code  = $pkgCode;
        if ($pkgName) $instance->package_name  = $pkgName;
        if ($durCode) $instance->duration_code = $durCode;
        if ($durName) $instance->duration_name = $durName;

        // Hormati periode dari Store → upgrade = extend
        if ($job->start_date) {
            $instance->start_date = $this->minDate($instance->start_date, $job->start_date);
        }
        if ($job->end_date) {
            $instance->end_date = $this->maxDate($instance->end_date, $job->end_date);
        }

        if (!is_null($job->is_active)) {
            $instance->is_active = (bool) $job->is_active;
        } else {
            $instance->is_active = $instance->end_date
                ? Carbon::parse($instance->end_date)->endOfDay()->gte(now())
                : $instance->is_active;
        }

        $instance->midtrans_order_id = $job->midtrans_order_id ?: $instance->midtrans_order_id;
        $instance->status            = $instance->is_active ? 'active' : 'inactive';
        $instance->save();

        // Sinkron ke tenant via driver: onUpgrade + enforceActiveState
        $manifest = $this->getManifest($job->product_code);
        $driver   = $this->resolveDriver($manifest);

        if ($dbName = $instance->database_name) {
            $driver->onUpgrade(
                dbName:    $dbName,
                manifest:  $manifest,
                pkgCode:   $instance->package_code,
                pkgName:   $instance->package_name,
                ctx:       [
                    'duration_code' => $instance->duration_code,
                    'duration_name' => $instance->duration_name,
                ]
            );
            $driver->enforceActiveState($dbName, (bool) $instance->is_active, $manifest);
        }

        // Notifikasi email
        $email = data_get($job->meta, 'customer_email');
        if ($email) {
            Mail::to($email)->send(new UpgradeMail(
                product:       $job->product_name ?? $job->product_code,
                appUrl:        $instance->app_url ?? '#',
                recipientName: data_get($job->meta, 'customer_name', 'Customer'),
                packageName:   $instance->package_name ?? '-',
                durationName:  $instance->duration_name ?? '-',
                startDate:     Carbon::parse($instance->start_date)->isoFormat('D MMM Y'),
                endDate:       Carbon::parse($instance->end_date)->isoFormat('D MMM Y'),
            ));
        }

        // kirim wa
        if ($phone = data_get($job->meta, 'customer_phone')) {
            $text = WhatsappTemplates::upgrade([
                'product_name'  => $job->product_name ?? $job->product_code,
                'customer_name' => data_get($job->meta, 'customer_name', 'Pelanggan'),
                'package_name'  => $instance->package_name,
                'duration_name' => $instance->duration_name,
                'start_date_fmt'=> Carbon::parse($instance->start_date)->isoFormat('D MMM Y'),
                'end_date_fmt'  => Carbon::parse($instance->end_date)->isoFormat('D MMM Y'),
            ]);
            app(WhatsappSender::class)->sendTemplate(to: $phone, text: $text);
        }
    }

    /**
     * ADD ON
     */
    protected function applyAddon(ProvisioningJob $job): void
    {
        // Wajib punya instance id
        $instanceId = $job->subscription_instance_id;
        if (!$instanceId) {
            throw new \InvalidArgumentException('Missing subscription_instance_id for addon.');
        }

        // Ambil daftar fitur dari meta.addons
        $addons = data_get($job->meta, 'addons.features', []);
        if (!is_array($addons) || empty($addons)) {
            // Tidak ada fitur — tidak perlu apa-apa
            return;
        }

        // Upsert per fitur ke subscription_addons
        foreach ($addons as $f) {
            $code   = (string) ($f['feature_code'] ?? '');
            if ($code === '') continue;

            $name   = (string) ($f['name'] ?? $code);
            $price  = (int) ($f['price'] ?? 0);

            \App\Models\SubscriptionAddon::updateOrCreate(
                [
                    'subscription_instance_id' => $instanceId,
                    'feature_code'             => $code,
                ],
                [
                    'feature_name'     => $name,
                    'price_amount'     => $price,
                    'currency'         => 'IDR',
                    'order_id'         => $job->order_id,
                    'midtrans_order_id'=> $job->midtrans_order_id,
                    'purchased_at'     => now(),
                ]
            );

            // Tandai override → enabled=true
            \App\Models\SubscriptionFeatureOverride::updateOrCreate(
                [
                    'subscription_instance_id' => $instanceId,
                    'feature_code'             => $code,
                ],
                [
                    'enabled'   => true,
                    'source'    => 'addon',
                    'updated_at'=> now(),
                ]
            );
        }

        // (Opsional) jika kamu mau set flag di tenant DB, panggil driver di sini:
        // $manifest = $this->getManifest($job->product_code);
        // $driver   = $this->resolveDriver($manifest);
        // if ($instance = \App\Models\CustomerProductInstance::where('subscription_instance_id', $instanceId)->first()) {
        //     if ($db = $instance->database_name) {
        //         // tulis ke tabel feature_flags tenant, dsb. (tidak diimplementasi sekarang)
        //     }
        // }

        // Anggap add-on selalu non-downtime & tanpa ubah status job instance.

        // kirim email
        $email = data_get($job->meta, 'customer_email');
        if ($email) {
            $instance = CustomerProductInstance::where('subscription_instance_id', $instanceId)->first();
            $addonsForMail = collect($addons)->map(fn($a) => [
                'name'  => $a['name'] ?? ($a['feature_code'] ?? '-'),
                'price' => (int)($a['price'] ?? 0),
            ])->values()->all();

            Mail::to($email)->send(new AddonActivatedMail(
                product:       $job->product_name ?? $job->product_code,
                appUrl:        $instance?->app_url ?? '#',
                recipientName: data_get($job->meta, 'customer_name', 'Customer'),
                addons:        $addonsForMail,
            ));
        }

        // kirim wa
        if ($phone = data_get($job->meta, 'customer_phone')) {
            $text = WhatsappTemplates::addon([
                'product_name'  => $job->product_name ?? $job->product_code,
                'customer_name' => data_get($job->meta, 'customer_name', 'Pelanggan'),
                'addons'        => array_values($addons), // array of ['name','price']
            ]);
            app(WhatsappSender::class)->sendTemplate(to: $phone, text: $text);
        }
    }

    /**
     * Cari instance untuk renew/upgrade:
     * - Prefer subscription_instance_id bila dikirim
     * - Else pakai base_order_id + product_code
     * - Else fallback: latest active by (customer_id, product_code)
     */
    protected function resolveInstanceForBaseOrder(ProvisioningJob $job): ?CustomerProductInstance
    {
        if ($job->subscription_instance_id) {
            $found = CustomerProductInstance::where('subscription_instance_id', $job->subscription_instance_id)->first();
            if ($found) return $found;
        }

        if ($job->base_order_id) {
            $found = CustomerProductInstance::where('order_id', $job->base_order_id)
                ->where('product_code', $job->product_code)
                ->first();
            if ($found) return $found;
        }

        return CustomerProductInstance::where('customer_id', $job->customer_id)
            ->where('product_code', $job->product_code)
            ->orderByDesc('created_at')
            ->first();
    }

    /* ======================
     * UTILITIES / HELPERS
     * ====================== */

    /**
     * Ambil manifest per produk dari service container.
     */
    protected function getManifest(string $productCode): array
    {
        /** @var \App\Services\Provisioning\ProductManifest $svc */
        $svc = app('product.manifest');
        return $svc->get($productCode);
    }

    /**
     * Resolve driver berdasarkan manifest['stack'].
     */
    protected function resolveDriver(array $manifest): ProductProvisionerDriver
    {
        $stack = $manifest['stack'] ?? 'laravel';
        return match ($stack) {
            'next-prisma' => app(NextPrismaDriver::class),
            'laravel'     => app(LaravelDriver::class),
            default       => throw new \RuntimeException("Unknown stack: {$stack}"),
        };
    }

    /**
     * Generate Company ID unik untuk tenant.
     */
    protected function generateUniqueCompanyId(string $productCode): string
    {
        $prefix = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $productCode)); // RENTVIX / TIRTABENING
        for ($i=0; $i<30; $i++) {
            $suffix = (string) random_int(1000, 999999);
            $candidate = "{$prefix}_{$suffix}";
            $exists = CustomerProductInstance::where('product_code', $productCode)
                ->where('company_id', $candidate)
                ->exists();
            if (!$exists) return $candidate;
        }
        return "{$prefix}_".Str::upper(Str::random(8));
    }

    /**
     * Bentuk URL app memakai url_template dari manifest (fallback ke deriveAppUrl lama).
     * url_template contoh: '{base}/tirtabening-{suffix}'
     */
    protected function deriveAppUrlUsingManifest(array $manifest, string $productCode, string $suffix): string
    {
        $base = rtrim(config('app.front_app_base', 'https://apps.agile.local'), '/');

        if (!empty($manifest['url_template'])) {
            $tpl = $manifest['url_template'];
            $repl = [
                '{base}'   => $base,
                '{suffix}' => $suffix,
                '{slug}'   => strtolower($productCode),
                '{code}'   => strtoupper($productCode),
            ];
            return strtr($tpl, $repl);
        }

        // fallback gaya lama
        $slug = strtolower($productCode);
        return "{$base}/{$slug}-{$suffix}";
    }

    /**
     * Helper maxDate & minDate untuk renewal & upgrade.
     */
    protected function maxDate($a, $b)
    {
        if (empty($a)) return $b;
        if (empty($b)) return $a;
        $ca = Carbon::parse($a);
        $cb = Carbon::parse($b);
        return $ca->gte($cb) ? $a : $b;
    }

    protected function minDate($a, $b)
    {
        if (!$a) return $b ? Carbon::parse($b) : null;
        if (!$b) return $a ? Carbon::parse($a) : null;
        $ca = Carbon::parse($a); $cb = Carbon::parse($b);
        return $ca->lte($cb) ? $ca : $cb;
    }
}

// old

// namespace App\Services\Provisioning;

// use App\Models\CustomerProductInstance;
// use App\Models\ProvisioningJob;
// use Carbon\Carbon;
// use Exception;
// use Illuminate\Support\Facades\Artisan;
// use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Hash;
// use Illuminate\Support\Facades\Log;
// use Illuminate\Support\Facades\Mail;
// use Illuminate\Support\Facades\Schema;
// use Illuminate\Support\Str;
// use App\Mail\ProvisionedMail;

// class TenantProvisioner
// {
//     /**
//      * Entry point: jalankan provisioning berdasarkan intent.
//      * - purchase: buat tenant/DB baru + kredensial
//      * - renew:    update masa aktif instance lama (tanpa buat DB baru)
//      * - upgrade:  update paket/durasi (in-place), bisa jalankan skrip upgrade di tenant bila perlu
//      */
//     public function provision(ProvisioningJob $job): void
//     {
//         try {
//             $intent = strtolower((string) $job->intent ?: 'purchase');

//             Log::info('TP: start provision', [
//                 'job_id'   => $job->id,
//                 'intent'   => $intent,
//                 'order_id' => $job->order_id,
//                 'product'  => $job->product_code,
//             ]);

//             switch ($intent) {
//                 case 'renew':
//                     $this->applyRenewInPlace($job);
//                     break;

//                 case 'upgrade':
//                     $this->applyUpgradeInPlace($job);
//                     break;

//                 case 'purchase':
//                 default:
//                     $this->applyPurchaseNewInstance($job);
//                     break;
//             }

//             Log::info('TP: done', ['job_id' => $job->id, 'intent' => $intent]);

//         } catch (Exception $e) {
//             Log::error('Failed generate account', ['error'=> $e->getMessage()]);
//         }
//     }

//     /**
//      * PURCHASE
//      */
//     protected function applyPurchaseNewInstance(ProvisioningJob $job): void
//     {
//         // Validasi email customer
//         $adminEmail = data_get($job->meta, 'customer_email');
//         if (!$adminEmail) {
//             throw new \InvalidArgumentException('Missing meta.customer_email in job.');
//         }
//         $customerName = data_get($job->meta, 'customer_name');

//         // Tentukan dbName sekali (idempoten)
//         $dbName = data_get($job->meta, 'db_name');
//         if (!$dbName) {
//             $short  = Str::lower($job->product_code);           // rentvix
//             $suffix = substr(Str::uuid()->toString(), 0, 8);    // ab12cd34
//             $dbName = "{$short}_{$suffix}";

//             $job->meta = array_merge($job->meta ?? [], ['db_name' => $dbName]);
//             $job->save();
//         }

//         // pastikan DB ada
//         $this->ensureDatabaseExists($dbName);

//         // set koneksi tenant
//         $this->setTenantConnection($dbName);

//         // migrasi & seeder produk
//         $this->migrateAndSeed($dbName, $job->product_code);
//         $this->seedProductFiles($job->product_code);

//         // buaat kredensial company_id & admin tenant
//         $companyId       = $this->generateUniqueCompanyId($job->product_code);
//         $companyPassword = Str::password(12, true, true, false);
//         $companyPassHash = Hash::make($companyPassword);

//         $adminUser = 'admin@'.$dbName;
//         $adminPass = Str::password(12, true, true, false);

//         // upsert company_id + admin di tenant
//         $this->upsertTenantCompany($dbName, $companyId, $companyPassHash);
//         $this->createTenantSuperAdmin($dbName, $adminUser, $adminUser, $adminPass, $companyId);

//         // simpan mapping central (instance baru)
//         $appUrl = $this->deriveAppUrl($job->product_code, explode('_', $dbName, 2)[1] ?? '');

//         // tentukan subscription_instance_id (kalau Store sudah kirim, pakai itu; kalau tidak, generate)
//         $subscriptionInstanceId = $job->subscription_instance_id ?: (string) Str::uuid();

//         CustomerProductInstance::updateOrCreate(
//             ['order_id' => $job->order_id, 'product_code' => $job->product_code],
//             [
//                 'subscription_instance_id' => $subscriptionInstanceId,

//                 'customer_id'   => $job->customer_id,
//                 'product_name'  => $job->product_name,
//                 'package_code'  => data_get($job->package, 'code'),
//                 'package_name'  => data_get($job->package, 'name'),
//                 'duration_code' => data_get($job->duration, 'code'),
//                 'duration_name' => data_get($job->duration, 'name'),

//                 'start_date'    => $job->start_date,
//                 'end_date'      => $job->end_date,
//                 'is_active'     => (bool) $job->is_active, // harus true bila order paid

//                 'midtrans_order_id' => $job->midtrans_order_id,
//                 'status'            => $job->is_active ? 'active' : 'inactive',

//                 'database_name'          => $dbName,
//                 'app_url'                => $appUrl,
//                 'company_id'             => $companyId,
//                 'company_password_plain' => $companyPassword, // opsional: null-kan setelah dikirim
//                 'company_password_hash'  => $companyPassHash,
//                 'admin_email'            => $adminEmail,
//                 'admin_username'         => $adminUser,
//                 'admin_password_plain'   => $adminPass,       // opsional: null-kan setelah dikirim
//             ]
//         );

//         // 8) Kirim email/WA kredensial
//         try {
//             Mail::to($adminEmail)->send(new ProvisionedMail(
//                 product: $job->product_code,
//                 appUrl:  $appUrl,
//                 companyId: $companyId,
//                 companyPassword: $companyPassword,
//                 username: $adminUser,
//                 password: $adminPass,
//                 recipientName: $customerName,
//             ));
//             Log::info('TP: email sent');
//         } catch (Exception $e) {
//             Log::error('TP: email failed', ['err' => $e->getMessage()]);
//         }

//         if ($phone = data_get($job->meta, 'customer_phone')) {
//             app(\App\Services\WhatsappSender::class)->sendTemplate(
//                 to: $phone,
//                 text:
// "*Aktivasi Berhasil*🎉

// Terima kasih telah memilih *{$job->product_code}*.  
// Akun Anda sudah aktif dan siap digunakan.

// ━━━━━━━━━━━━━━━━━━━━
// 📝 Akses Aplikasi   : {$appUrl}  

// 🏢 Company ID       : {$companyId}  
// 🔑 Company Pass     : {$companyPassword}  

// 👤 Admin User       : {$adminUser}  
// 🔒 Admin Pass       : {$adminPass}  
// ━━━━━━━━━━━━━━━━━━━━

// 📖 *Langkah Awal*  
// 1. Login menggunakan *Company ID* di atas.  
// 2. Masuk dengan *Admin User* dan *Admin Pass*.  
// 3. Segera ubah kata sandi Admin demi keamanan.  

// 🤝 Selamat bergabung bersama kami.  
// Tim Support *Agile Store* siap membantu jika ada kendala.  
// Hubungi: support@agilestore.com atau WhatsApp ini"
//             );
//         }
//     }

//     /**
//      * RENEW / PERPANJANGAN (IN PLACE)
//      */
//     protected function applyRenewInPlace(ProvisioningJob $job)
//     {
//         $instance = $this->resolveInstanceForBaseOrder($job);
//         if (!$instance) {
//             throw new \RuntimeException("Base instance not found for renew (base_order_id={$job->base_order_id}).");
//         }

//         // Update masa aktif INSTANCE lama sesuai tanggal dari Store
//         $instance->end_date         = $this->maxDate($instance->end_date, $job->end_date);
//         $instance->is_active        = (bool) $job->is_active;
//         $instance->midtrans_order_id= $job->midtrans_order_id ?: $instance->midtrans_order_id;
//         $instance->status           = $instance->is_active ? 'active' : 'inactive';

//         // // (opsional) bila Store kirim subscription_instance_id baru, simpan—tapi umumnya renew tidak mengubahnya
//         // if ($job->subscription_instance_id) {
//         //     $instance->subscription_instance_id = $job->subscription_instance_id;
//         // }

//         $instance->save();

//         $email = data_get($job->meta, 'customer_email');
//         if ($email) {
//             try {
//                 Mail::raw(
//                     "Langganan {$job->product_code} Anda telah diperpanjang. Masa aktif hingga {$instance->end_date}.",
//                     function ($m) use ($email) {
//                         $m->to($email)->subject('Perpanjangan Berhasil');
//                     }
//                 );
//             } catch (\Throwable $e) {
//                 Log::warning('TP: renew notice mail failed', ['err'=>$e->getMessage()]);
//             }
//         }
//     }

//     /**
//      * UPGRADE PACKAGE (IN PLACE)
//      */
//     protected function applyUpgradeInPlace(ProvisioningJob $job): void
//     {
//         $instance = $this->resolveInstanceForBaseOrder($job);
//         if (!$instance) {
//             throw new \RuntimeException("Base instance not found for upgrade (base_order_id={$job->base_order_id}).");
//         }

//         // Update paket/durasi sesuai kiriman Store (periode default dipertahankan)
//         $pkgCode = data_get($job->package, 'code');
//         $pkgName = data_get($job->package, 'name');
//         $durCode = data_get($job->duration, 'code');
//         $durName = data_get($job->duration, 'name');

//         if ($pkgCode) $instance->package_code  = $pkgCode;
//         if ($pkgName) $instance->package_name  = $pkgName;
//         if ($durCode) $instance->duration_code = $durCode;
//         if ($durName) $instance->duration_name = $durName;

//         // Hormati periode dari Store → upgrade = extend
//         //    - start_date: pakai paling awal (jaga histori)
//         //    - end_date  : pakai paling akhir (extend)
//         if ($job->start_date) {
//             $instance->start_date = $this->minDate($instance->start_date, $job->start_date);
//         }
//         if ($job->end_date) {
//             $instance->end_date = $this->maxDate($instance->end_date, $job->end_date);
//         }

//         if (!is_null($job->is_active)) {
//             $instance->is_active = (bool) $job->is_active;
//         } else {
//             // fallback defensif: aktifkan jika end_date di masa depan
//             $instance->is_active = $instance->end_date
//                 ? Carbon::parse($instance->end_date)->endOfDay()->gte(now())
//                 : $instance->is_active;
//         }

//         $instance->midtrans_order_id = $job->midtrans_order_id ?: $instance->midtrans_order_id;
//         $instance->status            = $instance->is_active ? 'active' : 'inactive';
//         $instance->save();

//         // (Opsional) jalankan skrip upgrade di tenant (menambah feature flag, dsb)
//         // try {
//         //     $this->maybeRunTenantUpgradeScripts($instance->database_name, $job->product_code, $pkgCode, $pkgName);
//         // } catch (\Throwable $e) {
//         //     Log::warning('TP: tenant upgrade scripts failed', ['err'=>$e->getMessage()]);
//         // }

//         // email notifikasi singkat
//         $email = data_get($job->meta, 'customer_email');
//         if ($email) {
//             try {
//                 Mail::raw(
//                     "Paket {$job->product_code} Anda telah di-upgrade ke {$instance->package_name}.",
//                     function ($m) use ($email) {
//                         $m->to($email)->subject('Upgrade Paket Berhasil');
//                     }
//                 );
//             } catch (\Throwable $e) {
//                 Log::warning('TP: upgrade notice mail failed', ['err'=>$e->getMessage()]);
//             }
//         }
//     }

//     /**
//      * Cari instance untuk renew/upgrade:
//      * - Prefer subscription_instance_id bila dikirim
//      * - Else pakai base_order_id + product_code
//      * - Else fallback: latest active by (customer_id, product_code)
//      */
//     protected function resolveInstanceForBaseOrder(ProvisioningJob $job): ?CustomerProductInstance
//     {
//         if ($job->subscription_instance_id) {
//             $found = CustomerProductInstance::where('subscription_instance_id', $job->subscription_instance_id)->first();
//             if ($found) return $found;
//         }

//         if ($job->base_order_id) {
//             $found = CustomerProductInstance::where('order_id', $job->base_order_id)
//                 ->where('product_code', $job->product_code)
//                 ->first();
//             if ($found) return $found;
//         }

//         return CustomerProductInstance::where('customer_id', $job->customer_id)
//             ->where('product_code', $job->product_code)
//             ->orderByDesc('created_at')
//             ->first();
//     }

//     /**
//      * UTILITIES (DB/MIGRATE/SEED/ETC)
//      */

//     /** Pastikan DB ada; jika dihapus manual, buat lagi. */
//     protected function ensureDatabaseExists(string $dbName): void
//     {
//         // Cek ada/tidak via INFORMATION_SCHEMA (aman untuk binding)
//         $exists = DB::select(
//             "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
//             [$dbName]
//         );

//         if (empty($exists)) {
//             // Buat DB kalau belum ada
//             DB::statement(
//                 "CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
//             );
//         }
//     }

//     /** Pasang koneksi 'tenant' ke DB yang diminta + purge/reconnect. */
//     protected function setTenantConnection(string $dbName): void
//     {
//         config(['database.connections.tenant' => [
//             'driver'   => 'mysql',
//             'host'     => env('DB_HOST','127.0.0.1'),
//             'port'     => env('DB_PORT','3306'),
//             'database' => $dbName,
//             'username' => env('DB_USERNAME','root'),
//             'password' => env('DB_PASSWORD',''),
//             'charset'  => 'utf8mb4',
//             'collation'=> 'utf8mb4_unicode_ci',
//             'prefix'   => '',
//             'strict'   => false,
//         ]]);

//         DB::purge('tenant');
//         DB::reconnect('tenant');
//         Schema::connection('tenant')->getConnection()->reconnect();
//     }

//     /** Jalankan migrasi + seeder umum produk. */
//     protected function migrateAndSeed(string $dbName, string $productCode): void
//     {
//         \Log::info('TP: start migrate', compact('dbName','productCode'));

//         $relativePath = strtolower($productCode).'/lav-gen/database/migrations';
//         $fullPath     = base_path($relativePath);
//         if (!is_dir($fullPath)) {
//             // fallback ke tenants folder (opsional)
//             $relativePath = 'database/migrations/tenants/'.strtolower($productCode);
//             $fullPath     = base_path($relativePath);
//             if (!is_dir($fullPath)) {
//                 \Log::error('TP: migration path not found', compact('relativePath'));
//                 throw new \RuntimeException("Migration path not found for product {$productCode}");
//             }
//         }

//         \Artisan::call('migrate', [
//             '--database' => 'tenant',
//             '--path'     => $relativePath,
//             '--force'    => true,
//         ]);
//         \Log::info('TP: migrate done', ['out' => \Artisan::output()]);

//         // (opsional) seeder umum per-produk (via class di app)
//         $seederClass = "Database\\Seeders\\Tenants\\".Str::studly(strtolower($productCode))."Seeder";
//         if (class_exists($seederClass)) {
//             \Artisan::call('db:seed', [
//                 '--database' => 'tenant',
//                 '--class'    => $seederClass,
//                 '--force'    => true,
//             ]);
//             \Log::info('TP: generic seeder done', ['class'=>$seederClass, 'out'=>\Artisan::output()]);
//         } else {
//             \Log::info('TP: generic seeder not found', ['class'=>$seederClass]);
//         }
//     }

//     /** Seeder file khusus (Menu/LevelUser) bila ada. */
//     protected function seedProductFiles(string $productCode): void
//     {
//         // MENU
//         $menuSeederPath = strtolower($productCode).'/lav-gen/database/seeders/MenuSeeder.php';
//         $menuFull = base_path($menuSeederPath);
//         \Log::info('TP: try menu seeder', ['path'=>$menuSeederPath]);

//         if (file_exists($menuFull)) {
//             require_once $menuFull;
//             \Log::info('TP: menu seeder required');

//             $fqcn = 'Database\\Seeders\\MenuSeeder';
//             if (class_exists($fqcn)) {
//                 // pastikan koneksi tenant dipakai
//                 \Artisan::call('db:seed', [
//                     '--database' => 'tenant',
//                     '--class'    => $fqcn,
//                     '--force'    => true,
//                 ]);
//                 \Log::info('TP: menu seeder executed', ['out'=>\Artisan::output()]);
//             } else {
//                 \Log::error('TP: MenuSeeder FQCN not found after require', ['fqcn'=>$fqcn, 'path'=>$menuSeederPath]);
//             }
//         } else {
//             \Log::warning('TP: MenuSeeder file not found', ['path'=>$menuSeederPath]);
//         }

//         // LEVEL USER
//         $levelSeederPath = strtolower($productCode).'/lav-gen/database/seeders/LevelUserSeeder.php';
//         $levelFull = base_path($levelSeederPath);
//         \Log::info('TP: try level seeder', ['path'=>$levelSeederPath]);

//         if (file_exists($levelFull)) {
//             require_once $levelFull;
//             \Log::info('TP: level seeder required');

//             $fqcn = 'Database\\Seeders\\LevelUserSeeder';
//             if (class_exists($fqcn)) {
//                 \Artisan::call('db:seed', [
//                     '--database' => 'tenant',
//                     '--class'    => $fqcn,
//                     '--force'    => true,
//                 ]);
//                 \Log::info('TP: level seeder executed', ['out'=>\Artisan::output()]);
//             } else {
//                 \Log::error('TP: LevelUserSeeder FQCN not found after require', ['fqcn'=>$fqcn, 'path'=>$levelSeederPath]);
//             }
//         } else {
//             \Log::warning('TP: LevelUserSeeder file not found', ['path'=>$levelSeederPath]);
//         }
//     }

//     /** Upsert company ke DB tenant. */
//     protected function upsertTenantCompany(string $dbName, string $companyCode, string $companyPassHash): void
//     {
//         if (!Schema::connection('tenant')->hasTable('mst_company')) {
//             throw new \RuntimeException("Table mst_company not found in tenant DB ({$dbName}).");
//         }

//         $q   = DB::connection('tenant')->table('mst_company');
//         $row = $q->first();
//         $now = now();

//         if ($row) {
//             $q->where('id', $row->id)->update([
//                 'company_id'      => $companyCode,
//                 'password' => $companyPassHash,
//                 'updated_at'      => $now,
//             ]);
//         } else {
//             $q->insert([
//                 'id'              => Str::ulid()->toBase32(),
//                 'company_id'      => $companyCode,
//                 'name'            => 'Default Company',
//                 'password' => $companyPassHash,
//                 'created_at'      => $now,
//                 'updated_at'      => $now,
//             ]);
//         }
//     }

//     /** Buat super admin di tenant. */
//     protected function createTenantSuperAdmin(string $dbName, string $email, string $username, string $adminPlainPass, string $companyCode): void
//     {
//         $userTable = Schema::connection('tenant')->hasTable('user_management')
//             ? 'user_management'
//             : (Schema::connection('tenant')->hasTable('users') ? 'users' : null);

//         if (!$userTable) {
//             throw new \RuntimeException("No user table found in tenant DB ({$dbName}).");
//         }

//         $hash = Hash::make($adminPlainPass);
//         $payload = [
//             'id'         => Str::ulid()->toBase32(),
//             'nama'       => 'Super Admin',
//             'email'      => $username,
//             'password'   => $hash,
//             'role'       => 1,
//             'company_id' => $companyCode,
//             'created_at' => now(),
//             'updated_at' => now(),
//         ];

//         $cols    = DB::connection('tenant')->getSchemaBuilder()->getColumnListing($userTable);
//         $payload = array_intersect_key($payload, array_flip($cols));

//         DB::connection('tenant')->table($userTable)->insert($payload);
//     }

//     /** Upsert instance mapping di central. (Dipakai di purchase) */
//     protected function upsertCustomerInstance(
//         ProvisioningJob $job,
//         string $dbName,
//         string $companyId,
//         string $companyPassword,
//         string $companyPassHash,
//         string $adminEmail,
//         string $adminUser,
//         string $adminPass,
//         string $appUrl,
//     ): void {
//         // disarankan buat UNIQUE INDEX (order_id, product_code) di tabel ini
//         CustomerProductInstance::updateOrCreate(
//             ['order_id' => $job->order_id, 'product_code' => $job->product_code],
//             [
//                 'subscription_instance_id' => $job->subscription_instance_id ?: (string) Str::uuid(),

//                 'customer_id'   => $job->customer_id,
//                 'product_name'  => $job->product_name,
//                 'package_code'  => data_get($job->package, 'code'),
//                 'package_name'  => data_get($job->package, 'name'),
//                 'duration_code' => data_get($job->duration, 'code'),
//                 'duration_name' => data_get($job->duration, 'name'),

//                 'start_date'    => $job->start_date,
//                 'end_date'      => $job->end_date,
//                 'is_active'     => (bool) $job->is_active,

//                 'midtrans_order_id' => $job->midtrans_order_id,
//                 'status'            => $job->is_active ? 'active' : 'inactive',

//                 'database_name'          => $dbName,
//                 'app_url'                => $appUrl,
//                 'company_id'             => $companyId,
//                 'company_password_plain' => $companyPassword,
//                 'company_password_hash'  => $companyPassHash,
//                 'admin_email'            => $adminEmail,
//                 'admin_username'         => $adminUser,
//                 'admin_password_plain'   => $adminPass,
//             ]
//         );
//     }

//     /** Generate Company ID unik untuk tenant. */
//     protected function generateUniqueCompanyId(string $productCode): string
//     {
//         $prefix = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $productCode)); // RENTVIX
//         for ($i=0; $i<30; $i++) {
//             $suffix = (string) random_int(1000, 999999);
//             $candidate = "{$prefix}_{$suffix}";
//             $exists = CustomerProductInstance::where('product_code', $productCode)
//                 ->where('company_id', $candidate)
//                 ->exists();
//             if (!$exists) return $candidate;
//         }
//         return "{$prefix}_".Str::upper(Str::random(8));
//     }

//     /** Bentuk URL app dari productCode + suffix db. */
//     protected function deriveAppUrl(string $productCode, string $suffix): string
//     {
//         $base = rtrim(config('app.front_app_base', 'https://apps.agile.local'), '/');
//         $slug = strtolower($productCode);
//         return "{$base}/{$slug}-{$suffix}";
//     }

//     /** TODO: Skrip upgrade paket di tenant (feature flags, dsb). */
//     protected function maybeRunTenantUpgradeScripts(?string $dbName, string $productCode, ?string $pkgCode, ?string $pkgName): void
//     {
//         if (!$dbName) return;

//         // contoh: set feature flags sesuai $pkgCode
//         // - pasang koneksi tenant
//         $this->setTenantConnection($dbName);

//         // TODO: taruh logic khusus produk di sini (mis. update table feature_flag)
//         Log::info('TP: maybeRunTenantUpgradeScripts', compact('dbName','productCode','pkgCode','pkgName'));
//     }

//     /** Helper maxdate & minDate untuk renewal & upgrade. */
//     protected function maxDate($a, $b)
//     {
//         if (empty($a)) return $b;
//         if (empty($b)) return $a;
//         $ca = Carbon::parse($a);
//         $cb = Carbon::parse($b);
//         return $ca->gte($cb) ? $a : $b;
//     }

//     private function minDate($a, $b)
//     {
//         if (!$a) return $b ? Carbon::parse($b) : null;
//         if (!$b) return $a ? Carbon::parse($a) : null;
//         $ca = Carbon::parse($a); $cb = Carbon::parse($b);
//         return $ca->lte($cb) ? $ca : $cb;
//     }
// }