<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CustomerProductInstanceUser extends Model
{
    protected $table = 'customer_product_instance_users';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'product_code',
        'company_id',
        'email',
        'password_plain',
        'password_hash',
        'is_active',
    ];

    protected static function booted()
    {
        static::creating(function ($m) {
            if (!$m->id) $m->id = (string) Str::uuid();
        });
    }
}
