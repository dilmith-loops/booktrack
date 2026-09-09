<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Spot extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'post_type',
        'book_name',
        'author',
        'stall_id',
        'stall_name',
        'hall',
        'stall_number',
        'images',
        'finder_name',
        'finder_handle',
        'timestamp',
        'price_or_offer',
        'shelf_location_note',
        'notes',
        'status',
        'helpful_count',
        'rating_average',
        'rating_count',
        'ai_verified',
        'is_pinned',
        'is_archived',
        'archived_at',
        'archived_by',
        'sampath_card_discount',
        'reply_to_request_id',
        'tagged_requester_name',
        'tagged_requester_handle',
        'is_resolved',
        'resolved_by_spot_id',
    ];

    protected $casts = [
        'images' => 'array',
        'timestamp' => 'integer',
        'helpful_count' => 'integer',
        'rating_average' => 'float',
        'rating_count' => 'integer',
        'ai_verified' => 'boolean',
        'is_pinned' => 'boolean',
        'is_archived' => 'boolean',
        'archived_at' => 'datetime',
        'is_resolved' => 'boolean',
    ];

    public function ratings(): HasMany
    {
        return $this->hasMany(SpotRating::class, 'spot_id', 'id');
    }

    /**
     * Map database attributes to camelCase structure expected by the React frontend.
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'postType' => $this->post_type,
            'bookName' => $this->book_name,
            'author' => $this->author,
            'stallId' => $this->stall_id,
            'stallName' => $this->stall_name,
            'hall' => $this->hall,
            'stallNumber' => $this->stall_number,
            'images' => $this->images ?? [],
            'finderName' => $this->finder_name,
            'finderHandle' => $this->finder_handle,
            'timestamp' => (int) $this->timestamp,
            'priceOrOffer' => $this->price_or_offer,
            'shelfLocationNote' => $this->shelf_location_note,
            'notes' => $this->notes,
            'status' => $this->status,
            'helpfulCount' => (int) $this->helpful_count,
            'ratingAverage' => (float) $this->rating_average,
            'ratingCount' => (int) $this->rating_count,
            'aiVerified' => (bool) $this->ai_verified,
            'isPinned' => (bool) $this->is_pinned,
            'isArchived' => (bool) $this->is_archived,
            'archivedAt' => $this->archived_at?->toISOString(),
            'archivedBy' => $this->archived_by,
            'sampathCardDiscount' => $this->sampath_card_discount,
            'replyToRequestId' => $this->reply_to_request_id,
            'taggedRequesterName' => $this->tagged_requester_name,
            'taggedRequesterHandle' => $this->tagged_requester_handle,
            'isResolved' => (bool) $this->is_resolved,
            'resolvedBySpotId' => $this->resolved_by_spot_id,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
