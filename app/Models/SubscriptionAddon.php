<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SubscriptionAddon extends Model
{
    use HasUuids;
    protected $table = 'subscription_addons';
    protected $fillable = [
        'subscription_instance_id',
        'feature_code','feature_name',
        'price_amount','currency',
        'order_id','midtrans_order_id',
        'purchased_at',
    ];
}
