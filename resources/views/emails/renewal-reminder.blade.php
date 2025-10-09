@component('mail::message')
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
@endcomponent