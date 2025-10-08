<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;

class AddonActivatedMail extends Mailable
{
    use Queueable;

    /**
     * @param array<int,array{name:string,price:int}> $addons
     */
    public function __construct(
        public string $product,
        public string $appUrl,
        public string $recipientName,
        public array  $addons
    ) {}

    public function build()
    {
        return $this->subject("Add-ons Activated — {$this->product}")
            ->markdown('emails.addon');
    }
}