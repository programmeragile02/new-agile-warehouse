@component('mail::message')
# 🎁 Add-ons Aktif — {{ $product }}

Halo {{ $recipientName }},

Add-ons berikut **sudah aktif** untuk produk **{{ $product }}** kamu:

@component('mail::panel')
@foreach($addons as $a)
✔️ **{{ $a['name'] }}** — <strong>IDR {{ number_format($a['price'] ?? 0, 0, ',', '.') }}</strong>  
@endforeach
@endcomponent

Nikmati fitur tambahannya, **tanpa downtime**.

@component('mail::button', ['url' => $appUrl, 'color' => 'primary'])
Buka {{ $product }}
@endcomponent

> Butuh bantuan? Cukup balas email ini—tim kami siap bantu.
@endcomponent
