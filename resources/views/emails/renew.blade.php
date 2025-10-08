@component('mail::message')
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
@endcomponent