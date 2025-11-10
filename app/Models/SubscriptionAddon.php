<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SubscriptionAddon extends Model
{
    use HasUuids;
    protected $table = 'subscription_addons';
    protected $fillable = [
        'subscription_instance_id','feature_code','feature_name','addon_code',
        'price_amount','currency','qty','unit_price','pricing_mode','kind',
        'order_id','midtrans_order_id','purchased_at',
        'billable_from_start','follow_base_duration','cycle_code',
    ];

    protected $casts = [
        'qty' => 'integer',
        'price_amount' => 'integer',
        'unit_price' => 'integer',
        'follow_base_duration' => 'boolean',
        'purchased_at' => 'datetime',
        'billable_from_start' => 'date',
    ];
}
