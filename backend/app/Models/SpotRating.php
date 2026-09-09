<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpotRating extends Model
{
    protected $fillable = [
        'spot_id',
        'score',
        'ip_address',
    ];

    public function spot(): BelongsTo
    {
        return $this->belongsTo(Spot::class, 'spot_id', 'id');
    }
}
