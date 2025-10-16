<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;

class ProvisionedMail extends Mailable
{
    use Queueable;

    public function __construct(
        public string $product,
        public string $appUrl,
        public string $username,
        public string $password,
        public string $recipientName,
    ) {}

    public function build()
    {
        return $this->subject("Welcome to {$this->product} - Your account is ready")
            ->markdown('emails.provisioned');
    }
}