<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;

class RenewMail extends Mailable
{
    use Queueable;

    public function __construct(
        public string $product,
        public string $appUrl,
        public string $recipientName,
        public string $endDate // sudah dalam format human (mis. "7 Oktober 2025")
    ) {}

    public function build()
    {
        return $this->subject("Subscription Renewed — {$this->product}")
            ->markdown('emails.renew');
    }
}