{{-- @component('mail::message')
# Renewal Reminder — {{ $product }}

Hello {{ $recipientName }},

Your subscription will *expire* on **{{ $endDateHuman }}**.  
To keep your service running without interruption, please renew promptly.

@component('mail::panel')
**Product:** {{ $product }}  
**Expiration Date:** {{ $endDateHuman }}
@endcomponent

@isset($renewUrl)
@component('mail::button', ['url' => $renewUrl])
Renew Now
@endcomponent
@endisset

@isset($appUrl)
You can also access the app at: <a href="{{ $appUrl }}">{{ $appUrl }}</a>
@endisset

---

## Tips
- Ensure a valid payment method so the renewal can be processed smoothly.  
- After renewal, refresh the application if needed.

## Support
Email: **support@agilestore.com**  
Documentation: **https://docs.agilestore.example**

@slot('subcopy')
> Security: Keep your *Company ID* confidential. Avoid sharing credentials via email/chat.
@endslot
@endcomponent --}}
@component('mail::message')
# ⏰ Pengingat Perpanjangan — {{ $product }}

Halo {{ $recipientName }},

Langganan kamu akan **berakhir** pada **{{ $endDateHuman }}**.  
Agar layanan tetap berjalan tanpa gangguan, silakan perpanjang segera.

@component('mail::panel')
**📦 Produk:** {{ $product }}  
**🗓️ Tanggal Berakhir:** {{ $endDateHuman }}
@endcomponent

@isset($renewUrl)
@component('mail::button', ['url' => $renewUrl, 'color' => 'primary'])
Perpanjang Sekarang
@endcomponent
@endisset

@isset($appUrl)
Kamu juga bisa mengakses aplikasi di: <a href="{{ $appUrl }}">{{ $appUrl }}</a>
@endisset

@slot('subcopy')
🔐 **Keamanan:** Rahasiakan *Company ID*. Hindari berbagi kredensial via email/chat.
@endslot
@endcomponent
