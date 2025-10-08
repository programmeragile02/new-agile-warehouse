<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;

class UpgradeMail extends Mailable
{
    use Queueable;

    public function __construct(
        public string $product,
        public string $appUrl,
        public string $recipientName,
        public string $packageName,
        public string $durationName,
        public string $startDate, // "7 Okt 2025"
        public string $endDate    // "7 Nov 2025"
    ) {}

    public function build()
    {
        return $this->subject("Plan Upgraded — {$this->product}")
            ->markdown('emails.upgrade');
    }
}