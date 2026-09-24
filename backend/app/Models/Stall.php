<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Stall extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'hall',
        'stall_number',
        'special_discount',
        'category',
        'is_hidden',
    ];

    protected $casts = [
        'is_hidden' => 'boolean',
    ];

    /**
     * Map database column names to camelCase for frontend compatibility if needed
     */
    public function toArray()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'hall' => $this->hall,
            'stallNumber' => $this->stall_number,
            'specialDiscount' => $this->special_discount,
            'category' => $this->category,
            'isHidden' => (bool) $this->is_hidden,
        ];
    }
}
