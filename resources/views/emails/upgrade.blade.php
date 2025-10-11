{{-- @component('mail::message')
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
@endcomponent --}}
@component('mail::message')
# 🚀 Paket Diupgrade — {{ $product }}

Halo {{ $recipientName }},

Paket kamu telah **berhasil diupgrade**. Fitur-fitur baru sudah aktif!

@component('mail::panel')
**📦 Paket:** {{ $packageName }}  
**⏳ Durasi:** {{ $durationName }}  
**🗓️ Periode:** {{ $startDate }} — {{ $endDate }}
@endcomponent

@component('mail::button', ['url' => $appUrl, 'color' => 'primary'])
Jelajahi Fitur Baru
@endcomponent
@endcomponent
