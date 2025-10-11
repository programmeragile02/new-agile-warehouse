{{-- <table class="subcopy" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td>
{{ Illuminate\Mail\Markdown::parse($slot) }}
</td>
</tr>
</table> --}}

<table class="subcopy" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #e2e8f0;margin-top:24px;padding-top:20px">
<tr><td>{{ Illuminate\Mail\Markdown::parse($slot) }}</td></tr>
</table>
