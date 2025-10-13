{{-- <tr>
<td class="header">
  <a href="{{ config('app.url') }}" style="display:inline-flex;align-items:center;gap:8px;color:#0f172a;">
    <img src="{{ asset('images/agile-logo.png') }}" alt="Agile Store" width="28" height="28" style="border-radius:6px;">
    <span style="font-weight:700;">Agile Store</span>
  </a>
</td>
</tr> --}}
@php
  // URL logo publik (dari config/mail.php → 'logo_url' atau fallback ke APP_URL/images/agile-logo.png)
  $logo = config('mail.logo_url') ?: (rtrim(config('app.url'), '/').'/images/agile-logo.png');
@endphp
<tr>
  <!-- bgcolor = fallback untuk client yang abaikan CSS -->
  <td class="header"
      style="padding:28px 0;background-color:#cdf5ec;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="left" style="padding:0 24px;">
          <a href="{{ config('app.url') }}"
             style="display:inline-flex;align-items:center;gap:10px;color:#ffffff;text-decoration:none">
            <img src="{{ $logo }}" alt="Agile Store" width="36" height="36"
                 style="display:block;border-radius:8px;outline:none;text-decoration:none;">
            <span style="font-weight:800;letter-spacing:.2px;color:#ffffff;">Agile Store</span>
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>


