<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FeatureBuilderProductRENTVIXSeeder extends Seeder
{
    public function run(): void
    {
        // Gunakan product_code (string)
        $productCode = 'RENTVIX';

        // Hapus semua fitur milik product_code ini (termasuk yang soft-deleted)
        DB::table('mst_feature_builder')->where('product_code', $productCode)->delete();

        // Snapshot data fitur
        $rows = array (
  0 => 
  array (
    'id' => 1,
    'product_id' => '469261a0-2956-49af-be1f-0a9036dc4ce7',
    'product_code' => 'RENTVIX',
    'parent_id' => NULL,
    'name' => 'Kirim Reminder Whatsapp',
    'feature_code' => 'wa.core',
    'type' => 'feature',
    'description' => 'Fitur Notifikasi Reminder Whatsapp',
    'crud_menu_id' => NULL,
    'price_addon' => 0,
    'trial_available' => true,
    'trial_days' => 7,
    'is_active' => true,
    'order_number' => 1,
    'deleted_at' => NULL,
    'created_at' => 
    \Illuminate\Support\Carbon::__set_state(array(
       'endOfTime' => false,
       'startOfTime' => false,
       'constructedObjectId' => '00000000000005170000000000000000',
       'clock' => NULL,
       'localMonthsOverflow' => NULL,
       'localYearsOverflow' => NULL,
       'localStrictModeEnabled' => NULL,
       'localHumanDiffOptions' => NULL,
       'localToStringFormat' => NULL,
       'localSerializer' => NULL,
       'localMacros' => NULL,
       'localGenericMacros' => NULL,
       'localFormatFunction' => NULL,
       'localTranslator' => NULL,
       'dumpProperties' => 
      array (
        0 => 'date',
        1 => 'timezone_type',
        2 => 'timezone',
      ),
       'dumpLocale' => NULL,
       'dumpDateProperties' => NULL,
       'date' => '2025-08-27 10:41:22.000000',
       'timezone_type' => 3,
       'timezone' => 'Asia/Jakarta',
    )),
    'updated_at' => 
    \Illuminate\Support\Carbon::__set_state(array(
       'endOfTime' => false,
       'startOfTime' => false,
       'constructedObjectId' => '00000000000005160000000000000000',
       'clock' => NULL,
       'localMonthsOverflow' => NULL,
       'localYearsOverflow' => NULL,
       'localStrictModeEnabled' => NULL,
       'localHumanDiffOptions' => NULL,
       'localToStringFormat' => NULL,
       'localSerializer' => NULL,
       'localMacros' => NULL,
       'localGenericMacros' => NULL,
       'localFormatFunction' => NULL,
       'localTranslator' => NULL,
       'dumpProperties' => 
      array (
        0 => 'date',
        1 => 'timezone_type',
        2 => 'timezone',
      ),
       'dumpLocale' => NULL,
       'dumpDateProperties' => NULL,
       'date' => '2025-08-27 11:33:01.000000',
       'timezone_type' => 3,
       'timezone' => 'Asia/Jakarta',
    )),
  ),
  1 => 
  array (
    'id' => 2,
    'product_id' => '469261a0-2956-49af-be1f-0a9036dc4ce7',
    'product_code' => 'RENTVIX',
    'parent_id' => 1,
    'name' => 'Fitur Notifikasi Booking',
    'feature_code' => 'wa.send-booking',
    'type' => 'subfeature',
    'description' => 'Fitur Notifikasi Booking Kendaraan',
    'crud_menu_id' => 3,
    'price_addon' => 0,
    'trial_available' => false,
    'trial_days' => NULL,
    'is_active' => true,
    'order_number' => 1,
    'deleted_at' => NULL,
    'created_at' => 
    \Illuminate\Support\Carbon::__set_state(array(
       'endOfTime' => false,
       'startOfTime' => false,
       'constructedObjectId' => '00000000000005110000000000000000',
       'clock' => NULL,
       'localMonthsOverflow' => NULL,
       'localYearsOverflow' => NULL,
       'localStrictModeEnabled' => NULL,
       'localHumanDiffOptions' => NULL,
       'localToStringFormat' => NULL,
       'localSerializer' => NULL,
       'localMacros' => NULL,
       'localGenericMacros' => NULL,
       'localFormatFunction' => NULL,
       'localTranslator' => NULL,
       'dumpProperties' => 
      array (
        0 => 'date',
        1 => 'timezone_type',
        2 => 'timezone',
      ),
       'dumpLocale' => NULL,
       'dumpDateProperties' => NULL,
       'date' => '2025-08-27 10:41:48.000000',
       'timezone_type' => 3,
       'timezone' => 'Asia/Jakarta',
    )),
    'updated_at' => 
    \Illuminate\Support\Carbon::__set_state(array(
       'endOfTime' => false,
       'startOfTime' => false,
       'constructedObjectId' => '00000000000004fb0000000000000000',
       'clock' => NULL,
       'localMonthsOverflow' => NULL,
       'localYearsOverflow' => NULL,
       'localStrictModeEnabled' => NULL,
       'localHumanDiffOptions' => NULL,
       'localToStringFormat' => NULL,
       'localSerializer' => NULL,
       'localMacros' => NULL,
       'localGenericMacros' => NULL,
       'localFormatFunction' => NULL,
       'localTranslator' => NULL,
       'dumpProperties' => 
      array (
        0 => 'date',
        1 => 'timezone_type',
        2 => 'timezone',
      ),
       'dumpLocale' => NULL,
       'dumpDateProperties' => NULL,
       'date' => '2025-08-27 11:56:48.000000',
       'timezone_type' => 3,
       'timezone' => 'Asia/Jakarta',
    )),
  ),
  2 => 
  array (
    'id' => 3,
    'product_id' => '469261a0-2956-49af-be1f-0a9036dc4ce7',
    'product_code' => 'RENTVIX',
    'parent_id' => 1,
    'name' => 'Kirim Reminder Pengembalian Unit',
    'feature_code' => 'wa.send-return',
    'type' => 'subfeature',
    'description' => 'Fitur Kirim Reminder Pengembalian Unit',
    'crud_menu_id' => 3,
    'price_addon' => 0,
    'trial_available' => false,
    'trial_days' => NULL,
    'is_active' => true,
    'order_number' => 2,
    'deleted_at' => NULL,
    'created_at' => 
    \Illuminate\Support\Carbon::__set_state(array(
       'endOfTime' => false,
       'startOfTime' => false,
       'constructedObjectId' => '00000000000005140000000000000000',
       'clock' => NULL,
       'localMonthsOverflow' => NULL,
       'localYearsOverflow' => NULL,
       'localStrictModeEnabled' => NULL,
       'localHumanDiffOptions' => NULL,
       'localToStringFormat' => NULL,
       'localSerializer' => NULL,
       'localMacros' => NULL,
       'localGenericMacros' => NULL,
       'localFormatFunction' => NULL,
       'localTranslator' => NULL,
       'dumpProperties' => 
      array (
        0 => 'date',
        1 => 'timezone_type',
        2 => 'timezone',
      ),
       'dumpLocale' => NULL,
       'dumpDateProperties' => NULL,
       'date' => '2025-08-27 11:39:02.000000',
       'timezone_type' => 3,
       'timezone' => 'Asia/Jakarta',
    )),
    'updated_at' => 
    \Illuminate\Support\Carbon::__set_state(array(
       'endOfTime' => false,
       'startOfTime' => false,
       'constructedObjectId' => '00000000000005150000000000000000',
       'clock' => NULL,
       'localMonthsOverflow' => NULL,
       'localYearsOverflow' => NULL,
       'localStrictModeEnabled' => NULL,
       'localHumanDiffOptions' => NULL,
       'localToStringFormat' => NULL,
       'localSerializer' => NULL,
       'localMacros' => NULL,
       'localGenericMacros' => NULL,
       'localFormatFunction' => NULL,
       'localTranslator' => NULL,
       'dumpProperties' => 
      array (
        0 => 'date',
        1 => 'timezone_type',
        2 => 'timezone',
      ),
       'dumpLocale' => NULL,
       'dumpDateProperties' => NULL,
       'date' => '2025-08-27 16:17:45.000000',
       'timezone_type' => 3,
       'timezone' => 'Asia/Jakarta',
    )),
  ),
);

        // Pastikan kolom product_code konsisten
        foreach ($rows as &$r) {
            $r['product_code'] = $productCode;
        }
        unset($r);

        // Insert ulang
        foreach ($rows as $r) {
            DB::table('mst_feature_builder')->insert($r);
        }
    }
}
