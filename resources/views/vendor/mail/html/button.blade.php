{{-- @props([
    'url',
    'color' => 'primary',
    'align' => 'center',
])
<table class="action" align="{{ $align }}" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="{{ $align }}">
<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="{{ $align }}">
<table border="0" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td>
<a href="{{ $url }}" class="button button-{{ $color }}" target="_blank" rel="noopener">{!! $slot !!}</a>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table> --}}

@props(['url','color' => 'primary','align' => 'center','title' => null])

@php
  /* Tombol terang + teks gelap agar selalu kebaca */
  $bgGrad = 'linear-gradient(135deg,#e0e7ff,#e9d5ff)'; /* biru muda → ungu muda */
  $border = '#1d4ed8';
  $text   = '#0f172a'; /* BUKAN putih */
  $solid  = '#e0e7ff'; /* fallback VML */
@endphp

<table class="action" align="{{ $align }}" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="{{ $align }}">

  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{ $url }}"
    style="height:44px;v-text-anchor:middle;width:260px;" arcsize="12%" stroke="t"
    strokecolor="{{ $border }}" fillcolor="{{ $solid }}">
    <w:anchorlock/>
    <center style="color:{{ $text }};font-family:Arial,sans-serif;font-size:16px;font-weight:700;">
      {{ trim(preg_replace('/\s+/', ' ', strip_tags($slot))) }}
    </center>
  </v:roundrect>
  <![endif]-->

  <!--[if !mso]><!-- -->
  <a href="{{ $url }}" target="_blank" rel="noopener" {{ $title ? 'title='.$title : '' }}
     style="display:inline-block;background:{{ $bgGrad }};color:{{ $text }};
            text-decoration:none;font-weight:700;font-size:16px;line-height:1;
            padding:14px 24px;border-radius:10px;border:1px solid {{ $border }};
            box-shadow:0 8px 20px rgba(37,99,235,.15);">
    {!! $slot !!}
  </a>
  <!--<![endif]-->

</td></tr>
</table>
