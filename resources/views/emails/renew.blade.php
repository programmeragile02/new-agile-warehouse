{{-- @component('mail::message')
# Subscription Renewed — {{ $product }}

Hello {{ $recipientName }},

Your subscription has been renewed.

@component('mail::panel')
**Active Until:** {{ $endDate }}
@endcomponent

Thanks for staying with us. Need help? Reply to this email anytime.

@component('mail::button', ['url' => $appUrl])
Open {{ $product }}
@endcomponent
@endcomponent --}}

@component('mail::message')
# ♻️ Berhasil Diperpanjang — {{ $product }}

Halo {{ $recipientName }},

Langganan kamu **berhasil diperpanjang**.

@component('mail::panel')
**✅ Aktif Sampai:** {{ $endDate }}
@endcomponent

Terima kasih telah tetap bersama kami. Semoga operasional kamu makin lancar!

@component('mail::button', ['url' => $appUrl, 'color' => 'primary'])
Buka {{ $product }}
@endcomponent
@endcomponent
