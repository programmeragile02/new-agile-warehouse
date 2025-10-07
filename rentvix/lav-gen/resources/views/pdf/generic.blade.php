<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <title>{{ $title }} - PDF</title>
    <style>
        @page {
            margin: 18mm 14mm;
        }

        /* === Poppins lokal (DomPDF) ===
       Taruh file:
       storage/fonts/Poppins-Regular.ttf
       storage/fonts/Poppins-SemiBold.ttf
       storage/fonts/Poppins-Bold.ttf
       storage/fonts/Poppins-ExtraBold.ttf
    */
        @font-face {
            font-family: 'Poppins';
            font-style: normal;
            font-weight: 400;
            src: url('{{ str_replace('\\', '/', storage_path('fonts/Poppins-Regular.ttf')) }}') format('truetype');
        }

        @font-face {
            font-family: 'Poppins';
            font-style: normal;
            font-weight: 700;
            src: url('{{ str_replace('\\', '/', storage_path('fonts/Poppins-Bold.ttf')) }}') format('truetype');
        }

        /* (opsional) */
        @font-face {
            font-family: 'Poppins';
            font-style: italic;
            font-weight: 400;
            src: url('{{ str_replace('\\', '/', storage_path('fonts/Poppins-Italic.ttf')) }}') format('truetype');
        }

        @font-face {
            font-family: 'Poppins';
            font-style: italic;
            font-weight: 700;
            src: url('{{ str_replace('\\', '/', storage_path('fonts/Poppins-BoldItalic.ttf')) }}') format('truetype');
        }

        body {
            font-family: 'Poppins', sans-serif;
            font-size: 10px;
            /* isi konten 10px */
            color: #0F172A;
            /* slate-900 */
        }

        .small {
            font-size: 9px;
            color: #64748B;
        }

        /* slate-500 */
        h4 {
            margin: 10px 0 6px;
            font-size: 11px;
        }

        /* ===== Kop (grid 3 kolom agar judul benar benar center) ===== */
        .kop-wrap {
            display: block;
            padding-bottom: 0;
            margin-bottom: 0;
            border-bottom: none;
        }

        .kop-grid {
            display: table;
            width: 100%;
            table-layout: fixed;
        }

        .kop-cell {
            display: table-cell;
            vertical-align: middle;
        }

        .kop-left {
            width: 25%;
            text-align: left;
        }

        .kop-center {
            width: 50%;
            text-align: center;
        }

        .kop-right {
            width: 25%;
            text-align: right;
        }

        .kop-left img.kop-logo {
            height: 42px;
        }

        .kop-title {
            font-size: 18px;
            /* judul agak besar */
            font-weight: 700;
            letter-spacing: .6px;
            text-transform: uppercase;
            color: #000;
        }

        .kop-sub {
            font-size: 8px;
            color: #7c7c7c;
            margin-top: 2px;
        }

        .kop-company {
            font-weight: 700;
            letter-spacing: .2px;
            color: #000;
            font-size: 10px;
        }

        .kop-meta {
            font-size: 9px;
            color: #000;
        }

        /* garis pemisah kop + jarak ke tabel */
        .kop-rule {
            height: 2px;
            background: #0F172A;
            margin: 10px 0 14px;
        }

        /* ===== Tabel data ===== */
        .table-wrap {
            margin-top: 12px;
            margin-bottom: 26px;
        }

        /* jarak dari kop & ke ringkasan */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
            border: 1px solid #E2E8F0;
            padding: 7px 9px;
            vertical-align: top;
        }

        .data-table th {
            background: #F0F4F8;
            font-weight: 700;
            color: #0F172A;
            font-size: 11px;
        }

        .data-table td {
            color: #1E293B;
            font-size: 10px;
        }

        /* Zebra khusus HANYA untuk tabel data */
        .data-table tbody tr:nth-child(odd) td {
            background: #FCFDFE;
        }

        /* ===== Ringkasan + TTD (pastikan putih bersih) ===== */
        .row-2col {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
        }

        .row-2col td {
            vertical-align: top;
            border: none;
            padding: 0;
            background: #fff;
        }

        .summary-box {
            padding-right: 16px;
            background: #fff;
        }

        .summary-box table {
            background: #fff;
        }

        .summary-box td {
            background: #fff;
            padding: 4px 0;
        }

        .sign-col {
            padding-top: 28px;
            background: #fff;
        }

        /* turunkan panel TTD */
        .sign-box {
            text-align: center;
            background: #fff;
        }

        .sign-space {
            height: 60px;
        }

        .sign-line {
            border-top: 1px solid #0F172A;
            width: 200px;
            margin: 10px auto 0;
        }

        /* footer halaman */
        .footer {
            position: fixed;
            bottom: -10mm;
            left: 0;
            right: 0;
            text-align: right;
            font-size: 9px;
            color: #64748B;
        }
    </style>
</head>

<body>
    @php
        // ==== Logo base64 agar pasti tampil di DomPDF ====
        $logoSrc = null;
        if (!empty($company['logo']) && is_string($company['logo']) && file_exists($company['logo'])) {
            $ext = strtolower(pathinfo($company['logo'], PATHINFO_EXTENSION));
            $mime = $ext === 'jpg' || $ext === 'jpeg' ? 'image/jpeg' : ($ext === 'svg' ? 'image/svg+xml' : 'image/png');
            $logoSrc = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($company['logo']));
        }
    @endphp

    {{-- KOP --}}
    <div class="kop-wrap">
        <div class="kop-grid">
            {{-- Kiri: logo --}}
            <div class="kop-cell kop-left">
                @if ($logoSrc)
                    <img class="kop-logo" src="{{ $logoSrc }}" alt="logo">
                @endif
            </div>

            {{-- Tengah: judul + waktu ekspor --}}
            <div class="kop-cell kop-center">
                <div class="kop-title">{{ $title }}</div>
                <div class="kop-sub">Diekspor: {{ $generated }}</div>
            </div>

            {{-- Kanan: info perusahaan --}}
            <div class="kop-cell kop-right">
                <div class="kop-company">{{ $company['name'] ?? '' }}</div>
                @if (!empty($company['address']))
                    <div class="kop-meta">{{ $company['address'] }}</div>
                @endif
                @if (!empty($company['phone']))
                    <div class="kop-meta">{{ $company['phone'] }}</div>
                @endif
            </div>
        </div>

        {{-- Garis pemisah kop --}}
        <div class="kop-rule"></div>
    </div>

    {{-- TABEL DATA --}}
    {{-- ====== ANALISIS ALIGN PER KOLOM (DINAMIS) ====== --}}
    @php
        use Illuminate\Support\Str as Strx;

        $colAlign = []; // key => left|center|right
        foreach ($columns as $c) {
            $key = $c['source'];
            $disp = strtolower((string) ($c['display'] ?? ''));

            // default
            $align = 'left';

            // aturan pasti
            if (in_array($disp, ['currency', 'number'], true)) {
                $align = 'right';
            } elseif ($key === 'status') {
                $align = 'center';
            } else {
                // kumpulkan nilai kolom (tanpa null)
                $vals = collect($items)->pluck($key)->filter(fn($v) => $v !== null)->values();

                // boolean → center
                if ($vals->count() && $vals->every(fn($v) => is_bool($v))) {
                    $align = 'center';
                } else {
                    // normalisasi untuk cek keseragaman
                    $norm = $vals->map(function ($v) {
                        if (is_bool($v)) {
                            return $v ? '1' : '0';
                        }
                        if (is_numeric($v)) {
                            return (string) $v;
                        }
                        return trim((string) $v);
                    });

                    $allEqual = $norm->count() > 0 && $norm->unique()->count() === 1;

                    // keseragaman panjang (mis: "2024", "2025", plat bernotif sama)
                    $lengths = $norm->map(fn($s) => mb_strlen($s));
                    $lenVar = $lengths->count() ? $lengths->max() - $lengths->min() : 0;
                    $shortish = $lengths->count() ? $lengths->max() <= 12 : false;

                    if ($allEqual || ($lenVar <= 1 && $shortish)) {
                        $align = 'center';
                    }
                }
            }

            $colAlign[$key] = $align;
        }
    @endphp

    <div class="table-wrap">
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:30px; text-align:center;">No</th>
                    @foreach ($columns as $c)
                        @php $k = $c['source']; @endphp
                        <th style="text-align: {{ $colAlign[$k] ?? 'left' }};">
                            {{ $c['label'] ?? \Illuminate\Support\Str::headline($c['source']) }}
                        </th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @forelse ($items as $i => $row)
                    <tr>
                        <td style="text-align:center;">{{ $i + 1 }}</td>
                        @foreach ($columns as $c)
                            @php
                                $key = $c['source'];
                                $val = $row->{$key} ?? null;
                                $disp = strtolower((string) ($c['display'] ?? ''));
                                $ta = $colAlign[$key] ?? 'left'; // text-align dari analisis
                            @endphp
                            <td style="text-align: {{ $ta }};">
                                @switch($disp)
                                    @case('currency')
                                        {{-- kanan secara style + format rupiah --}}
                                        Rp {{ number_format((float) $val, 0, ',', '.') }}
                                    @break

                                    @case('number')
                                        {{ is_numeric($val) ? $val : '' }}
                                    @break

                                    @case('date')
                                        {{ $val ? \Carbon\Carbon::parse($val)->format('d/m/Y') : '' }}
                                    @break

                                    @case('badge')
                                        {{ $val }}
                                    @break

                                    @default
                                        {{ is_bool($val) ? ($val ? 'Ya' : 'Tidak') : $val ?? '' }}
                                @endswitch
                            </td>
                        @endforeach
                    </tr>
                    @empty
                        <tr>
                            <td colspan="{{ count($columns) + 1 }}" style="text-align:center;">Tidak ada data</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        {{-- RINGKASAN + TTD (putih) --}}
        <table class="row-2col">
            <tr>
                <td style="width:65%;">
                    <div class="summary-box">
                        <h4>Ringkasan</h4>
                        <table style="width:100%; border-collapse:collapse;">
                            <tr>
                                <td style="width:200px;">Total Data</td>
                                <td>: <strong>{{ $summary['total'] }}</strong></td>
                            </tr>
                            @if (!empty($summary['by_group']))
                                @foreach ($summary['by_group'] as $g => $n)
                                    <tr>
                                        <td>{{ \Illuminate\Support\Str::headline((string) $g) }}</td>
                                        <td>: {{ $n }}</td>
                                    </tr>
                                @endforeach
                            @endif
                            @if (!empty($summary['sums']))
                                @foreach ($summary['sums'] as $col => $sum)
                                    <tr>
                                        <td>Jumlah {{ \Illuminate\Support\Str::headline($col) }}</td>
                                        <td>: Rp {{ number_format((float) $sum, 0, ',', '.') }}</td>
                                    </tr>
                                @endforeach
                            @endif
                        </table>
                    </div>
                </td>

                <td class="sign-col" style="width:35%;"> {{-- padding-top supaya panel TTD turun --}}
                    <div class="sign-box">
                        <div>
                            @if (!empty($sign['place']))
                                {{ $sign['place'] }},
                            @endif {{ $sign['date'] }}
                        </div>
                        <div style="margin-top:6px;">Disetujui oleh,</div>
                        <div class="sign-space"></div>
                        <div class="sign-line"></div>
                        <div><strong>{{ $sign['name'] }}</strong></div>
                        <div class="small">{{ $sign['title'] }}</div>
                    </div>
                </td>
            </tr>
        </table>

        <div class="footer">
            <script type="text/php">
      if (isset($pdf)) {
        $pdf->page_text(520, 810, "Halaman {PAGE_NUM} / {PAGE_COUNT}", $fontMetrics->get_font("DejaVu Sans","normal"), 9, [0,0,0]);
      }
    </script>
        </div>
    </body>

    </html>