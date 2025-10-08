@component('mail::message')
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
@endcomponent