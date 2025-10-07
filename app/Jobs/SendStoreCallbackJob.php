<?php

namespace App\Jobs;

use App\Models\ProvisioningJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendStoreCallbackJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public $tries = 5;
    public $backoff = [10, 30, 60, 120];

    public function __construct(public string $jobId) {}

    public function handle(): void
    {
        $job = ProvisioningJob::findOrFail($this->jobId);

        $url = rtrim(env('STORE_WEBHOOK_URL', ''), '/');
        $sec = env('STORE_WEBHOOK_SECRET', '');
        if (!$url || !$sec) {
            Log::warning('STORE_WEBHOOK_* not set; skip callback');
            return;
        }

        $payload = [
            'job_id'        => (string) $job->id,
            'order_id'      => (string) $job->order_id,
            'customer_id'   => (string) $job->customer_id,
            'product_code'  => $job->product_code,
            'status'        => $job->status, // finished|failed|processing
            'app_url'       => data_get($job->meta, 'app_url'),
            'database_name' => data_get($job->meta, 'db_name'),
            'company_id'    => data_get($job->meta, 'company_id'),
        ];

        $body = json_encode($payload);
        $sig  = hash_hmac('sha256', $body, $sec);

        $resp = Http::timeout(10)->retry(2, 500)
            ->withHeaders([
                'Accept'            => 'application/json',
                'Content-Type'      => 'application/json',
                'X-Agile-Signature' => $sig,
            ])->post($url, $payload);

        if (!$resp->successful()) {
            Log::error('Store callback failed', ['status'=>$resp->status(),'body'=>$resp->body()]);
            // biar di-retry oleh queue
            $this->release(30);
            return;
        }

        Log::info('Store callback ok', ['job_id' => $job->id]);
    }
}
