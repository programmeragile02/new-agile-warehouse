@component('mail::message')
# Add-ons Activated — {{ $product }}

Hello {{ $recipientName }},

The following add-ons have been activated for your product {{ $product }}:

@component('mail::panel')
@foreach($addons as $a)
• {{ $a['name'] }} — IDR {{ number_format($a['price'] ?? 0, 0, ',', '.') }}/month  
@endforeach
@endcomponent

They’re live now — no downtime required.

@component('mail::button', ['url' => $appUrl])
Open {{ $product }}
@endcomponent
@endcomponent