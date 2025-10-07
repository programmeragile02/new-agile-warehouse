<?php

namespace App\Http\Controllers\Provisioning;

use App\Http\Controllers\Controller;
use App\Jobs\ProvisionOrderJob;
use App\Models\ProvisioningJob;
use Illuminate\Http\Request;
use Log;

class JobsController extends Controller
{
    public function store(Request $req)
    {
        // HMAC signature check
        $raw  = $req->getContent(); // RAW body persis
        $secret    = config('services.store_webhook.secret', '');
        $signature = $req->header('X-Agile-Signature', '');
        $computed  = hash_hmac('sha256', $req->getContent(), $secret);

        Log::info('WAREHOUSE RECEIVE', [
            'sig_header' => substr($signature, 0, 16),
            'sig_calc'   => substr($computed, 0, 16),
            'match'      => hash_equals($computed, $signature),
            'len'        => strlen($raw),
            'db'         => \DB::connection()->getDatabaseName(), // debug: db aktif
        ]);

        if (!$secret || !hash_equals($computed, $signature)) {
            abort(401, 'Invalid signature');
        }

        // Validate
        $data = $req->validate([
            'id'         => 'required|uuid',
            'order_id'   => 'required|uuid',
            'customer_id'=> 'required|string',

            'intent'     => 'nullable|string|in:purchase,renew,upgrade,addon',
            'base_order_id' => 'nullable|uuid',

            'product_code' => 'required|string|max:50',
            'product_name' => 'nullable|string',

            'package'    => 'nullable|array',
            'package.code' => 'nullable|string',
            'package.name' => 'nullable|string',

            'duration'   => 'nullable|array',
            'duration.code' => 'nullable|string',
            'duration.name' => 'nullable|string',

            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
            'is_active'  => 'nullable|boolean',

            'midtrans_order_id' => 'nullable|string',
            'subscription_instance_id' => 'nullable|uuid',

            'customer_name'  => 'nullable|string',
            'customer_email' => 'required|email',
            'customer_phone' => 'nullable|string|max:30',

            'addons'                          => 'nullable|array',
            'addons.features'                 => 'nullable|array',
            'addons.features.*.feature_code'  => 'required_with:addons.features|string',
            'addons.features.*.name'          => 'nullable|string',
            'addons.features.*.price'         => 'nullable|integer',
        ]);

        // Idempotent insert
        $job = ProvisioningJob::firstOrCreate(
            ['id' => $data['id']],
            [
                'order_id'    => $data['order_id'],
                'customer_id' => $data['customer_id'],
                'intent'      => $data['intent'] ?? 'purchase',
                'base_order_id' => $data['base_order_id'] ?? null,

                'product_code'=> $data['product_code'],
                'product_name'=> $data['product_name'] ?? null,

                'start_date'  => $data['start_date'] ?? null,
                'end_date'    => $data['end_date'] ?? null,
                'is_active'   => (bool) ($data['is_active'] ?? false),

                'midtrans_order_id' => $data['midtrans_order_id'] ?? null,
                'subscription_instance_id' => $data['subscription_instance_id'] ?? null,

                'status'      => 'pending',
                'requested_at'=> now(),
                'package'     => $data['package'] ?? null,
                'duration'    => $data['duration'] ?? null,
                'meta'        => [
                    'customer_name'  => $data['customer_name'] ?? null,
                    'customer_email' => $data['customer_email'],
                    'customer_phone' => $data['customer_phone'] ?? null,
                    'addons'         => $data['addons'] ?? null,
                ],
            ]
        );

        Log::info('WAREHOUSE JOB UPSERT', [
            'job_id' => $job->id,
            'exists' => $job->wasRecentlyCreated ? false : true,
        ]);

        if ($job->wasRecentlyCreated || $job->status === 'failed') {
            dispatch(new ProvisionOrderJob($job->id))->onQueue('provisioning');
        }

        return response()->json([
            'success' => true,
            'data'    => ['job_id' => $job->id, 'status' => $job->status],
        ], 202);
    }
}
