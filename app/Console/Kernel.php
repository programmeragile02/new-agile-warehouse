<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // ============================================
        // Renewal Reminders (WhatsApp ID + Email EN)
        // ============================================

        // D-7 (H-7) — kirim setiap hari jam 09:00 WIB
        $schedule->command('renewals:cpi --days=7')
            ->timezone('Asia/Jakarta')
            ->dailyAt('09:00')
            ->onOneServer()         // kalau pakai multiple workers/servers
            ->withoutOverlapping()  // cegah overlap jika eksekusi lama
            ->runInBackground();    // jangan blokir scheduler

        // (OPSIONAL) D-3 — jam 09:15 WIB
        // $schedule->command('renewals:cpi --days=3')
        //     ->timezone('Asia/Jakarta')
        //     ->dailyAt('09:15')
        //     ->onOneServer()
        //     ->withoutOverlapping()
        //     ->runInBackground();

        // (OPSIONAL) D-1 — jam 09:30 WIB
        // $schedule->command('renewals:cpi --days=1')
        //     ->timezone('Asia/Jakarta')
        //     ->dailyAt('09:30')
        //     ->onOneServer()
        //     ->withoutOverlapping()
        //     ->runInBackground();

        // ============================================
        // (OPSIONAL) Staging/Local: dry-run dulu
        // ============================================
        if (app()->environment('local', 'staging')) {
            $schedule->command('renewals:cpi --days=7 --dry-run')
                ->timezone('Asia/Jakarta')
                ->dailyAt('08:55')
                ->onOneServer()
                ->withoutOverlapping()
                ->runInBackground();
        }

        // ============================================
        // (OPSIONAL) Housekeeping contoh
        // ============================================
        // $schedule->command('queue:prune-batches --hours=48')
        //     ->daily()
        //     ->onOneServer()
        //     ->runInBackground();

        // $schedule->command('model:prune') // jika pakai Prunable
        //     ->daily()
        //     ->onOneServer()
        //     ->runInBackground();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}

// belum dipakai ya
// protected function schedule(Schedule $schedule): void
// {
//     // contoh tiap 15 menit
//     // $schedule->command('warehouse:sync-products')->everyFifteenMinutes();
// }