<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Support\Str;

class Company extends Authenticatable implements JWTSubject
{
    use SoftDeletes;

    protected $table = 'mst_company';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'password'];
    protected $hidden   = ['password'];
    protected $casts    = ['password' => 'hashed'];

    protected static function booted()
    {
        static::creating(function ($m) {
            if (!$m->id) $m->id = (string) Str::uuid();
        });
    }

    // JWTSubject
    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return ['typ' => 'company']; }
}
