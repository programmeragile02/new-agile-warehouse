@component('mail::message')
# Plan Upgraded — {{ $product }}

Hello {{ $recipientName }},

Your plan has been upgraded successfully.

@component('mail::panel')
**Package:** {{ $packageName }}  
**Duration:** {{ $durationName }}  
**Period:** {{ $startDate }} — {{ $endDate }}
@endcomponent

New features are now available. Enjoy!

@component('mail::button', ['url' => $appUrl])
Open {{ $product }}
@endcomponent
@endcomponent