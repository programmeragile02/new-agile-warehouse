<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;

class RenewalReminderMail extends Mailable
{
    use Queueable;

    public function __construct(
        public string  $product,
        public string  $recipientName,
        public string  $companyId,
        public string  $endDateHuman,   // e.g., "October 7, 2025"
        public ?string $packageCode = null,
        public ?string $appUrl     = null,
        public ?string $renewUrl   = null,
    ) {}

    public function build()
    {
        $subject = "Renewal Reminder — {$this->product}";
        return $this->subject($subject)
            ->markdown('emails.renewal-reminder');
    }
}