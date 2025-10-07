<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DaftarKendaraan extends Model
{
    use SoftDeletes;
    
    protected $table = 'mst_daftar_kendaraan';
    protected $fillable = [
        'jenis',
        'warna',
        'foto_depan',
        'foto_samping'
    ];

    public function setUpdatedAt($value)
    {
        if ($this->exists && !$this->isDeleting) {
            $this->attributes['updated_at'] = $value;
        }
        return $this;
    }

    protected $isDeleting = false;

    protected function performDeleteOnModel()
    {
        $this->isDeleting = true;
        if (! $this->forceDeleting) {
            $this->{$this->getDeletedAtColumn()} = $this->freshTimestamp();
            $this->saveQuietly();
        } else {
            parent::performDeleteOnModel();
        }
    }

    protected $appends = ['foto_depan_url', 'foto_samping_url'];

    
    
    

    
    public function getFotoDepanUrlAttribute()
    {
        return $this->foto_depan
            ? asset('storage/' . $this->foto_depan)
            : null;
    }

    public function getFotoSampingUrlAttribute()
    {
        return $this->foto_samping
            ? asset('storage/' . $this->foto_samping)
            : null;
    }

}
