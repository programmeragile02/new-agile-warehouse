<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsappSender
{
    public function sendTemplate(string $to, string $text): void
    {
        $url    = rtrim(env('WA_SENDER_URL', ''), '/') . '/send';
        $secret = env('WA_HMAC_SECRET', '');

        $payload = ['to' => $to, 'text' => $text];

        // Pastikan opsi JSON sama di kedua sisi
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $sig  = hash_hmac('sha256', $json, $secret);

        $resp = Http::timeout(10)->withHeaders([
            'Accept'            => 'application/json',
            'Content-Type'      => 'application/json',
            'X-Agile-Signature' => $sig,
        ])->withBody($json, 'application/json')   // <— kirim persis string yang ditandatangani
          ->post($url);

        if (!$resp->successful()) {
            Log::error('WA send failed', [
                'to'     => $to,
                'status' => $resp->status(),
                'body'   => $resp->body(),
            ]);
        } else {
            Log::info('WA SENT', [
                'to'   => $to,
                'resp' => $resp->json(),
            ]);
        }
    }
}