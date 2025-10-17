<?php

namespace App\Services\Provisioning;

use App\Mail\AddonActivatedMail;
use App\Mail\RenewMail;
use App\Mail\UpgradeMail;
use App\Models\CustomerProductInstance;
use App\Models\CustomerProductInstanceProfile;
use App\Models\CustomerProductInstanceUser;
use App\Models\ProvisioningJob;
use App\Models\SubscriptionAddon;
use App\Models\SubscriptionFeatureOverride;
use App\Services\WhatsappTemplates;
use App\Services\WhatsappSender;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Crypt;
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
            $short  = Str::lower($job->product_code);        // mis. rentvix / natabanyu
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

        // Ambil kredensial DB tenant yang barusan dibuat (jika driver support)
        $creds = method_exists($driver, 'getLastTenantCreds') ? $driver->getLastTenantCreds() : null;

        // Generate kredensial company & admin
        $companyId       = $this->generateUniqueCompanyId($job->product_code);
        $companyPassword = Str::password(12, true, true, false);
        $companyPassHash = Hash::make($companyPassword);

        $adminUser = $adminEmail;
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
        $instance = CustomerProductInstance::updateOrCreate(
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

        CustomerProductInstanceUser::updateOrCreate(
            [
                'product_code' => $job->product_code,
                'email'        => strtolower($adminEmail),   // constraint: uq_cpiu_prod_email
            ],
            [
                'company_id'    => $companyId,
                'password_hash' => Hash::make($adminPass),
                'password_plain'=> $adminPass,               // OPSIONAL, untuk transisi/onboarding
                'is_active'     => true,
                'updated_at'    => null,
                'created_at'    => now(),                    
            ]
        );

        // Simpan kredensial DB per-tenant (terenkripsi)
        if ($creds) {
            $instance->database_username     = $creds['username'] ?? null;
            $instance->database_password_enc = isset($creds['password']) ? Crypt::encryptString($creds['password']) : null;
            $instance->database_host         = env('DB_HOST','127.0.0.1');
            $instance->database_port         = env('DB_PORT','3306');
            $instance->save();
        }

        // upsert profil 1:1 dari meta
        CustomerProductInstanceProfile::updateOrCreate(
            ['customer_product_instance_id' => $instance->id],
            [
                'customer_name'  => data_get($job->meta, 'customer_name'),
                'customer_email' => data_get($job->meta, 'customer_email'),
                'customer_phone' => data_get($job->meta, 'customer_phone'),
            ]
        );

        // Kirim email kredensial
        try {
            Mail::to($adminEmail)->send(new ProvisionedMail(
                product: $job->product_code,
                appUrl:  $appUrl,
                username: $adminEmail,
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
                'admin_username'   => $adminEmail,
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

        // update informasi customer jika ada perubahan
        $profileUpdates = array_filter([
            'customer_name'  => data_get($job->meta, 'customer_name'),
            'customer_email' => data_get($job->meta, 'customer_email'),
            'customer_phone' => data_get($job->meta, 'customer_phone'),
        ], fn($v) => !is_null($v));

        if (!empty($profileUpdates)) {
            CustomerProductInstanceProfile::updateOrCreate(
                ['customer_product_instance_id' => $instance->id],
                $profileUpdates
            );
        }

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

        // update informasi customer jika ada perubahan
        $profileUpdates = array_filter([
            'customer_name'  => data_get($job->meta, 'customer_name'),
            'customer_email' => data_get($job->meta, 'customer_email'),
            'customer_phone' => data_get($job->meta, 'customer_phone'),
        ], fn($v) => !is_null($v));

        if (!empty($profileUpdates)) {
            CustomerProductInstanceProfile::updateOrCreate(
                ['customer_product_instance_id' => $instance->id],
                $profileUpdates
            );
        }

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

        $parents = data_get($job->meta, 'addons.parents', []); // array of {feature_code,name,price}
        $grant   = data_get($job->meta, 'addons.grant', []);   // array of codes (parent + children)

        \Log::info('TP: addon payload', [
            'parents_count' => count($parents),
            'grant_count'   => is_array($grant) ? count($grant) : 0,
        ]);

        // 1) Catat pembelian parent berharga → subscription_addons
        foreach ($parents as $p) {
            $code  = (string)($p['feature_code'] ?? '');
            if ($code === '') continue;

            SubscriptionAddon::updateOrCreate(
                [
                    'subscription_instance_id' => $instanceId,
                    'feature_code'             => $code,
                ],
                [
                    'feature_name'      => (string)($p['name'] ?? $code),
                    'price_amount'      => (int)($p['price'] ?? 0),
                    'currency'          => 'IDR',
                    'order_id'          => $job->order_id,
                    'midtrans_order_id' => $job->midtrans_order_id,
                    'purchased_at'      => now(),
                ]
            );
        }

        // 2) Enable seluruh fitur yang digrant (parent + anak) → overrides
        foreach ((array)$grant as $code) {
            $code = (string)$code;
            if ($code === '') continue;

            SubscriptionFeatureOverride::updateOrCreate(
                [
                    'subscription_instance_id' => $instanceId,
                    'feature_code'             => $code,
                ],
                [
                    'enabled'    => true,
                    'source'     => 'addon',
                    'updated_at' => now(),
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

        // --- Notifikasi: Email & WhatsApp (tidak memblok proses) ---
        try {
            $email    = data_get($job->meta, 'customer_email');
            $phone    = data_get($job->meta, 'customer_phone');
            $custName = data_get($job->meta, 'customer_name', 'Customer');

            // URL aplikasi (opsional, untuk tombol di email & info di WA)
            $instance = CustomerProductInstance::where('subscription_instance_id', $instanceId)->first();
            $appUrl   = $instance?->app_url ?? '#';

            // Ambil parent berbayar untuk notifikasi (nama + harga)
            $parentsForNotify = collect($parents)
                ->map(fn($p) => [
                    'name'  => (string)($p['name'] ?? ($p['feature_code'] ?? '-')),
                    'price' => (int)($p['price'] ?? 0),
                ])
                ->values()
                ->all();

            // ==== EMAIL ====
            if ($email && !empty($parentsForNotify)) {
                try {
                    // gunakan queue agar provisioning cepat & idempotent
                    Mail::to($email)->send(new AddonActivatedMail(
                        product:       $job->product_name ?? $job->product_code,
                        appUrl:        $appUrl,
                        recipientName: $custName,
                        addons:        $parentsForNotify // parent saja
                    ));
                } catch (\Throwable $e) {
                    Log::warning('TP: send AddonActivatedMail failed', ['err' => $e->getMessage()]);
                }
            }

            // ==== WHATSAPP ====
            if ($phone && !empty($parentsForNotify)) {
                try {
                    // Kirim sesuai kontrak WhatsappTemplates::addon => expects ['addons' => [ ['name','price'], ... ]]
                    $waText = WhatsappTemplates::addon([
                        'product_name'  => $job->product_name ?? $job->product_code,
                        'customer_name' => $custName,
                        'addons'        => $parentsForNotify,   // parent saja
                        // opsional, jika mau dipakai di template:
                        'app_url'       => $appUrl,
                        'granted_total' => is_array($grant) ? count($grant) : 0,
                    ]);

                    app(WhatsappSender::class)->sendTemplate(
                        to:   $phone,
                        text: $waText
                    );
                } catch (\Throwable $e) {
                    Log::warning('TP: send WA addon failed', ['err' => $e->getMessage()]);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('TP: notification (email/wa) wrapper failed', ['err' => $e->getMessage()]);
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
        $prefix = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $productCode)); // RENTVIX / NATABANYU
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
     * url_template contoh: '{base}/natabanyu-{suffix}'
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