<?php

namespace App\Jobs;

use App\Models\ProvisioningJob;
use App\Services\Provisioning\TenantProvisioner;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class ProvisionOrderJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function __construct(public string $jobId) {}

    public function handle(TenantProvisioner $prov): void
    {
        $job = ProvisioningJob::findOrFail($this->jobId);
        if ($job->status === 'finished') return;

        $job->update(['status' => 'processing']);

        try {
            $prov->provision($job);
            $job->update(['status' => 'finished', 'finished_at' => now()]);
        } catch (\Throwable $e) {
            \Log::error('Provision failed', ['job_id'=>$job->id, 'err'=>$e->getMessage()]);
            $job->update(['status'=>'failed','error_message'=>$e->getMessage()]);
            throw $e;
        }
    }
}