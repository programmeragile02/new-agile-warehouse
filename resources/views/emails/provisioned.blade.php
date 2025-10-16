{{-- @component('mail::message')
# Welcome to {{ $product ?? 'Your Product' }} 🎉

Hello {{ $recipientName ?? 'there' }},

Your application account has been successfully created.  
Here are your login credentials:

@component('mail::panel')
**Application URL:** <a href="{{ $appUrl }}">{{ $appUrl }}</a>  
**Company ID:** {{ $companyId }}  
**Company Password:** {{ $companyPassword }}  
**Username / Email:** {{ $username }}  
**Password:** {{ $password }}
@endcomponent

@component('mail::button', ['url' => $appUrl])
Access {{ $product ?? 'App' }}
@endcomponent

---

## Next Steps
- Change your password immediately after your first login.  
- Invite your team members and assign roles to manage access.  

---

## Need Assistance?
Our support team is here to help you anytime.

**Support:** support@agilestore.example  
**Documentation:** https://docs.agilestore.example

@slot('subcopy')
> Security Tip: Keep your Company ID and password safe. Never share your credentials via email or chat.
@endslot
@endcomponent --}}
@component('mail::message')
# 🎉 Selamat Datang di {{ $product ?? 'Aplikasi Anda' }}

Halo {{ $recipientName ?? 'Pengguna Baru' }},

Akun aplikasi kamu berhasil dibuat.  
Berikut kredensial login:

@component('mail::panel')
**🔗 URL Aplikasi:** <a href="{{ $appUrl }}">{{ $appUrl }}</a>  
**👤 Email / Username:** {{ $username }}  
**🔑 Password:** {{ $password }}
@endcomponent

@component('mail::button', ['url' => $appUrl, 'color' => 'primary'])
Akses {{ $product ?? 'Aplikasi' }}
@endcomponent

---

## Langkah Berikutnya
- 🔐 **Ganti password** setelah login pertama.  
- 👥 **Undang tim** dan atur peran/akses.

---

## Bantuan
Email: **support@agilestore.example**  
Dokumentasi: **https://docs.agilestore.example**

@slot('subcopy')
💡 **Tips Keamanan**: Jaga kerahasiaan *Company ID* dan password. Jangan bagikan via email/chat publik.
@endslot
@endcomponent
