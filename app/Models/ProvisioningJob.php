<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Str;

class ProvisioningJob extends Model
{
    use HasUuids;

    protected $table = 'provisioning_jobs';

    // primary key string (bukan auto increment)
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        // identity
        'id',                       // UUID dari Store (idempotent)
        'order_id',                 // UUID order di Store (bukan midtrans)
        'base_order_id',            // UUID order dasar (untuk renew/upgrade)
        'subscription_instance_id', // (opsional) ID instance langganan yang sama untuk renew/upgrade

        // customer & product
        'customer_id',
        'product_code',
        'product_id',
        'product_name',
        'package',
        'duration',

        // periode & status subscription (dihitung oleh Store)
        'start_date',            // datetime
        'end_date',              // datetime
        'is_active',             // bool

        // pembayaran
        'midtrans_order_id',     // ORD-YYYYMMDD-XXXXXX
        'status',                // pending|processing|finished|failed (status job provisioning)

        // intent
        'intent',                // purchase|renew|upgrade

        // timeline
        'requested_at',
        'finished_at',

        // tambahan
        'error_message',
        'meta' // array
    ];

    protected $casts = [
        'package'     => 'array',
        'duration'    => 'array',
        'meta'        => 'array',
        'is_active'   => 'boolean',
        'start_date'  => 'datetime',
        'end_date'    => 'datetime',
        'requested_at'=> 'datetime',
        'finished_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($m) {
            if (!$m->id) $m->id = (string) Str::uuid();
        });
    }

    /** Helper singkat */
    public function isPurchase(): bool { return $this->intent === 'purchase'; }
    public function isRenew(): bool    { return $this->intent === 'renew'; }
    public function isUpgrade(): bool  { return $this->intent === 'upgrade'; }

    /** Relasi ke instance (jika sudah ada) */
    public function instance()
    {
        return $this->hasOne(CustomerProductInstance::class, 'subscription_instance_id', 'subscription_instance_id');
    }
}
