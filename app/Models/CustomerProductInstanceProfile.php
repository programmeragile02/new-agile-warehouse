<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerProductInstanceProfile extends Model
{
    protected $fillable = [
        'customer_product_instance_id',
        'customer_name',
        'customer_email',
        'customer_phone',
    ];

    public function instance()
    {
        return $this->belongsTo(CustomerProductInstance::class, 'customer_product_instance_id');
    }
}