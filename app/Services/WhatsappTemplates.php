<?php

namespace App\Services;

class WhatsappTemplates
{
    public static function purchase(array $d): string
    {
        return trim("
*✅ Aktivasi Berhasil — {$d['product_name']}*

Hai {$d['customer_name']}, akun aplikasi Anda sudah *aktif* dan siap dipakai.

*URL Aplikasi*  : {$d['app_url']}
*Company ID*    : {$d['company_id']}
*Company Pass*  : {$d['company_password']}
*Admin User*    : {$d['admin_username']}
*Admin Pass*    : {$d['admin_password']}

Langkah awal:
1) Login ke {$d['app_url']}
2) Masuk pakai *Company ID* di atas
3) Ubah kata sandi Admin sesegera mungkin

Bantuan & Panduan:
• Email Support: support@agilestore.com
• Dokumentasi   : https://docs.agilestore.example

Terima kasih telah memilih *{$d['product_name']}*. Semoga lancar dan bertumbuh! 
— *Agile Store Support*
        ");
    }

    public static function renew(array $d): string
    {
        return trim("
*🔄 Perpanjangan Berhasil — {$d['product_name']}*

Hai {$d['customer_name']}, langganan Anda telah *diperpanjang*.

*Masa aktif* : s/d {$d['end_date_fmt']}

Tips:
• Pastikan metode pembayaran tersimpan agar perpanjangan berikutnya otomatis.
• Ajak tim Anda bergabung dan atur peran/akses.

Butuh bantuan? Balas pesan ini atau email ke support@agilestore.com
— *Agile Store Support*
        ");
    }

    public static function upgrade(array $d): string
    {
        return trim("
*⬆️ Upgrade Paket Berhasil — {$d['product_name']}*

Hai {$d['customer_name']}, paket langganan Anda telah *diupgrade*.

*Paket*     : {$d['package_name']}
*Durasi*    : {$d['duration_name']}
*Berlaku*   : {$d['start_date_fmt']} s/d {$d['end_date_fmt']}

Perubahan fitur akan aktif tanpa downtime. Silakan *refresh* aplikasi bila perlu.
— *Agile Store Support*
        ");
    }

    public static function addon(array $d): string
    {
        $list = collect($d['addons'] ?? [])
            ->map(fn($i) => "• {$i['name']} (IDR ".number_format($i['price'] ?? 0, 0, ',', '.')."/bln)")
            ->implode("\n");

        return trim("
*➕ Add-on Diaktifkan — {$d['product_name']}*

Hai {$d['customer_name']}, add-on berikut telah *diaktifkan* untuk produk {$d['product_name']}:

{$list}

Add-on aktif seketika tanpa downtime. 
— *Agile Store Support*
        ");
    }

    public static function renewReminderId(array $d): string
    {
        return trim("
*⏰ Pengingat Perpanjangan — {$d['product_name']}*

Hai {$d['customer_name']}, masa aktif langganan Anda akan *berakhir* pada:
*{$d['end_date_fmt']}*.

*Paket*      : {$d['package_code']}

Untuk menghindari gangguan layanan, silakan perpanjang melalui tautan berikut:
{$d['renew_url']}

Butuh bantuan? Balas pesan ini—tim kami siap membantu.
— *Agile Store Support*
        ");
    }
}