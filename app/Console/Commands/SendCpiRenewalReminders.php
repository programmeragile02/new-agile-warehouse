<?php

namespace App\Console\Commands;

use App\Mail\RenewalReminderMail;
use App\Models\CustomerProductInstance as CPI;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendCpiRenewalReminders extends Command
{
    protected $signature = 'renewals:cpi
        {--days=7 : H-n before end_date}
        {--dry-run : Log only, no send}';

    protected $description = 'Send WhatsApp (ID) & Email (EN) renewal reminders using CPI + profile';

    public function handle(): int
    {
        $days = (int)($this->option('days') ?: 7);
        $dry  = (bool)$this->option('dry-run');
        $tz   = 'Asia/Jakarta';
        $todayKey = now($tz)->toDateString();

        $lock = Cache::lock("renewals:cpi:{$days}:{$todayKey}", 3600);
        if (!$lock->get()) {
            $this->warn("Already executed for D-{$days} today.");
            return self::SUCCESS;
        }

        try {
            $list = CPI::query()->expiringIn($days)->with('profile')->get();
            $processed = 0;

            foreach ($list as $cpi) {
                $idKey = "renewals:cpi:sent:{$cpi->id}:{$todayKey}:D{$days}";
                if (Cache::has($idKey)) continue;

                // Ambil kontak: profile -> fallback admin_email (untuk email)
                $phone = $cpi->profile?->customer_phone;
                $email = $cpi->profile?->customer_email ?: $cpi->admin_email;
                $name  = $cpi->profile?->customer_name  ?: 'Customer';

                $endId = Carbon::parse($cpi->end_date, $tz)->locale('id')->isoFormat('D MMMM YYYY');   // WA (ID)
                $endEn = Carbon::parse($cpi->end_date, $tz)->locale('en')->isoFormat('MMMM D, YYYY');  // Email (EN)
                $renewUrl = $this->buildRenewUrl($cpi);

                // ===== WhatsApp (ID) — kirim kalau ada nomor
                if ($phone) {
                    $payload = [
                        'customer_name' => $name,
                        'product_name'  => $cpi->product_name ?? $cpi->product_code,
                        'company_id'    => $cpi->company_id,
                        'package_code'  => $cpi->package_code ?? '-',
                        'end_date_fmt'  => $endId,
                        'days'          => $days,
                        'renew_url'     => $renewUrl,
                    ];

                    $waText = \App\Services\WhatsappTemplates::renewReminderId($payload);

                    if ($dry) {
                        Log::info('DRY RUN WA reminder', ['to'=>$phone,'cpi'=>$cpi->id,'msg'=>$waText]);
                    } else {
                        try {
                            app(\App\Services\WhatsappSender::class)->sendTemplate(to: $phone, text: $waText);
                        } catch (\Throwable $e) {
                            Log::warning('WA send failed', ['to'=>$phone,'cpi'=>$cpi->id,'err'=>$e->getMessage()]);
                            // lanjut proses email & penandaan sesuai kebijakan kamu
                        }
                    }
                }

                // ===== Email (EN) — kirim kalau ada email
                if ($email) {
                    if ($dry) {
                        Log::info('DRY RUN Email reminder', ['to'=>$email,'cpi'=>$cpi->id]);
                    } else {
                        Mail::to($email)->send(new RenewalReminderMail(
                            product:       $cpi->product_name ?? $cpi->product_code,
                            recipientName: $name,
                            companyId:     $cpi->company_id,
                            endDateHuman:  $endEn,         // English date
                            packageCode:   $cpi->package_code,
                            appUrl:        $cpi->app_url,
                            renewUrl:      $renewUrl,
                        ));
                    }
                }

                if (!$dry) {
                    Cache::put($idKey, 1, now()->addHours(26));
                    $this->markSent($cpi, $days);
                }

                $processed++;
            }

            $this->info("Reminders processed (D-{$days}): {$processed}");
            return self::SUCCESS;
        } finally {
            optional($lock)->release();
        }
    }

    protected function markSent(CPI $cpi, int $days): void
    {
        $daysSent = (array)($cpi->renewal_reminder_sent_days ?? []);
        if (!in_array($days, $daysSent, true)) $daysSent[] = $days;

        $cpi->forceFill([
            'renewal_reminder_last_sent_at' => now(),
            'renewal_reminder_sent_days'    => array_values($daysSent),
        ])->saveQuietly();
    }

    protected function buildRenewUrl(CPI $cpi): string
    {
        $base = config('app.store_checkout_base', env('STORE_CHECKOUT_BASE', 'http://localhost:3000/checkout'));
        $params = http_build_query([
            'product'  => $cpi->product_code ?? 'TIRTABENING',
            'package'  => $cpi->package_code ?? 'basic',
            'duration' => $cpi->duration_code ?? 'DUR-12',
            'action'   => 'renew',
            'company'  => $cpi->company_id,
        ]);
        return rtrim($base,'?&').'?'.$params;
    }
}