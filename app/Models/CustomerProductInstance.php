<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Str;

class CustomerProductInstance extends Model
{
    use HasUuids;

    protected $fillable = [
        // identity
        'id',
        'subscription_instance_id', // stabil untuk siklus renew/upgrade
        'order_id',                 // order yang melahirkan instance (purchase)
        'customer_id',

        // product & plan
        'product_code',
        'product_name',
        'package_code',
        'package_name',
        'duration_code',
        'duration_name',

        // lifecycle
        'start_date',
        'end_date',
        'is_active',
        'status',                   // active|inactive (opsi lain sesuai kebijakanmu)

        // pembayaran terakhir terkait perubahan ini (opsional)
        'midtrans_order_id',

        // tenant info
        'database_name',
        'app_url',
        'company_id',
        'company_password_plain',   // opsional: null-kan setelah dikirim
        'company_password_hash',
        'admin_email',
        'admin_username',
        'admin_password_plain',     // opsional: null-kan setelah dikirim

        // tambahan
        'meta',  // json
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date'   => 'datetime',
        'is_active'  => 'boolean',
        'meta'       => 'array',
    ];

    // computed attribute: aktif saat ini (flag true & belum lewat end_date)
    protected $appends = ['is_currently_active'];

    protected static function booted()
    {
        static::creating(function ($m) {
            if (!$m->id) $m->id = (string) Str::uuid();
            if (!$m->subscription_instance_id) $m->subscription_instance_id = (string) Str::uuid();
        });
    }

    public function getIsCurrentlyActiveAttribute(): bool
    {
        $today = now()->startOfDay();
        $end   = $this->end_date instanceof Carbon
            ? $this->end_date->copy()->startOfDay()
            : null;

        return (bool) $this->is_active && (is_null($end) || $end->greaterThanOrEqualTo($today));
    }

    /** Scope: yang aktif “sekarang” */
    public function scopeActiveNow($q)
    {
        $today = now()->toDateString();
        return $q->where('is_active', true)
                 ->where(function ($qq) use ($today) {
                     $qq->whereNull('end_date')
                        ->orWhereDate('end_date', '>=', $today);
                 });
    }
}
