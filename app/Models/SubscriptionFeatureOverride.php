<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SubscriptionFeatureOverride extends Model
{
    use HasUuids;
    protected $table = 'subscription_feature_overrides';
    protected $fillable = [
        'subscription_instance_id',
        'feature_code',
        'enabled',
        'source',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];
}
