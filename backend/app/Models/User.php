<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name',
    'email',
    'phone',
    'handle',
    'is_sampath_cardholder',
    'password',
    'otp_code',
    'otp_expires_at',
    'ip_address',
    'is_disabled',
])]
#[Hidden(['password', 'remember_token', 'otp_code'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'handle',
        'is_sampath_cardholder',
        'password',
        'otp_code',
        'otp_expires_at',
        'ip_address',
        'is_disabled',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'otp_expires_at' => 'datetime',
            'is_sampath_cardholder' => 'boolean',
            'is_disabled' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /**
     * Format user model for React frontend UserProfile interface.
     */
    public function toProfileArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone ?: '',
            'handle' => $this->handle ?: ('@' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $this->name))),
            'isSampathCardholder' => (bool) $this->is_sampath_cardholder,
            'registeredAt' => $this->created_at ? (int) $this->created_at->getTimestampMs() : (int) round(microtime(true) * 1000),
            'isAdmin' => false,
            'ipAddress' => $this->ip_address ?: '',
            'isDisabled' => (bool) ($this->is_disabled ?? false),
        ];
    }
}
