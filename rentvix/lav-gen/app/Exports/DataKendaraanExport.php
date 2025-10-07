<?php

namespace App\Exports;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class DataKendaraanExport implements
    FromCollection, WithHeadings, WithMapping, WithEvents, WithCustomStartCell, ShouldAutoSize
{
    public function __construct(
        protected ?string $search = null,
        protected ?string $status = null,
        protected string $city = 'Jakarta',
        protected ?string $approvedByName = 'Manager Operasional',
        protected ?string $approvedByTitle = 'Manager Operasional',
        protected ?string $approvedDate = null
    ) {}

    public function collection(): Collection
    {
        $q = DB::table('mst_kendaraan');

        if ($this->search) {
            $s = "%{$this->search}%";
            $q->where(function($qq) use ($s) {
                $cols = DB::getSchemaBuilder()->getColumnListing('mst_kendaraan');
                foreach ($cols as $c) $qq->orWhere($c, 'like', $s);
            });
        }

        if ($this->status && DB::getSchemaBuilder()->hasColumn('mst_kendaraan', $this->statusColumn())) {
            $q->where($this->statusColumn(), $this->status);
        }

        return collect($q->orderBy('id','desc')->get());
    }

    public function headings(): array
    {
        return ['New Content', 'New Content', 'New Content', 'New Content'];
    }

    public function map($r): array
    {
        return [
            $r->foto_depan,
            $r->model,
            $r->lokasi,
            $r->status
        ];
    }

    // Tetap pakai baris 6 untuk heading tabel
    public function startCell(): string { return 'A6'; }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $e) {
                Carbon::setLocale('id');

                $s = $e->sheet->getDelegate();

                // ==== Dimensi tabel (dinamis) ====
                $headings       = $this->headings();
                $lastColIndex   = count($headings);
                $lastCol        = Coordinate::stringFromColumnIndex($lastColIndex);
                $tableHeaderRow = 6;
                $dataStartRow   = $tableHeaderRow + 1;
                $dataEndRow     = max($dataStartRow, $s->getHighestRow());

                // ==== LETTERHEAD (Logo kiri + teks tengah + garis bawah) ====
                $s->getColumnDimension('A')->setWidth(20);

                $logoAbs = public_path('logo/rentvixpro-transparent.png'); // e.g. public/logo/rentvix.png
                if (is_file($logoAbs)) {
                    $img = new Drawing();
                    $img->setName('Logo');
                    $img->setPath($logoAbs);
                    $img->setHeight(84);   // tinggi logo px (disarankan 42–70)
                    $img->setCoordinates('A1');
                    $img->setOffsetX(4);
                    $img->setOffsetY(2);
                    $img->setWorksheet($s);
                }

                // Teks kop (rata tengah)
                $s->mergeCells("A1:{$lastCol}1");
                $s->mergeCells("A2:{$lastCol}2");
                $s->mergeCells("A3:{$lastCol}3");
                $s->mergeCells("A4:{$lastCol}4");

                $s->setCellValue('A1', 'RENTVIX PRO'); // mis. "RENTVIX PRO"
                $s->setCellValue('A2', 'Data Kendaraan - Export');
                $s->setCellValue('A4', 'Generated at: '.now()->translatedFormat('d F Y H:i'));

                $s->getStyle("A1:{$lastCol}1")->getFont()->setBold(true)->setSize(16);
                $s->getStyle("A2:{$lastCol}2")->getFont()->setBold(true)->setSize(13);
                $s->getStyle("A3:{$lastCol}3")->getFont()->setSize(10);
                $s->getStyle("A4:{$lastCol}4")->getFont()->setSize(9)->setItalic(true);

                $s->getStyle("A1:{$lastCol}4")->getAlignment()
                  ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                  ->setVertical(Alignment::VERTICAL_CENTER);

                // Garis tebal di bawah baris 4 (ciri kop surat)
                $s->getStyle("A4:{$lastCol}4")->getBorders()->getBottom()
                  ->setBorderStyle(Border::BORDER_MEDIUM);

                // ==== HEADER TABEL ====
                $s->getStyle("A{$tableHeaderRow}:{$lastCol}{$tableHeaderRow}")
                  ->getFont()->setBold(true);
                $s->getStyle("A{$tableHeaderRow}:{$lastCol}{$tableHeaderRow}")
                  ->getFill()->setFillType(Fill::FILL_SOLID)
                  ->getStartColor()->setARGB('FFEFEFEF');
                $s->getStyle("A{$tableHeaderRow}:{$lastCol}{$tableHeaderRow}")
                  ->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

                // ==== FORMAT KOLOM (opsional; diisi generator) ====
                // no special formats

                // ==== BORDER TABEL ====
                $tableRange = "A{$tableHeaderRow}:{$lastCol}{$dataEndRow}";
                $s->getStyle($tableRange)->applyFromArray([
                    'borders' => [
                        'outline'    => ['borderStyle' => Border::BORDER_THIN],
                        'horizontal' => ['borderStyle' => Border::BORDER_HAIR],
                        'vertical'   => ['borderStyle' => Border::BORDER_HAIR],
                    ],
                ]);

                // ==== META EXPORT (kiri bawah) ====
                $metaTopRow = $dataEndRow + 4;
                $user = Auth::user();
                $by   = $user?->name ?: 'Unknown User';
                if ($user?->email) $by .= " ({$user->email})";

                $s->setCellValue("A{$metaTopRow}",    'Di Export oleh');
                $s->setCellValue("B{$metaTopRow}",    $by);
                $s->setCellValue("A".($metaTopRow+1), 'Di Export pada');
                $s->setCellValue("B".($metaTopRow+1), now()->translatedFormat('d F Y H:i'));

                // ==== Summary ====
                $sumTitle = $metaTopRow + 3;
                $s->setCellValue("A{$sumTitle}", 'Ringkasan:');
                $s->getStyle("A{$sumTitle}")->getFont()->setBold(true);

                $total = DB::table('mst_kendaraan')->count();
                $s->setCellValue("A".($sumTitle+1), 'Total Data Kendaraan');
                $s->setCellValue("B".($sumTitle+1), $total);

                $statusCol = $this->statusColumn();
                if ($statusCol && \Schema::hasColumn('mst_kendaraan', $statusCol)) {
                    $rows = DB::table('mst_kendaraan')
                        ->select($statusCol.' as v', DB::raw('count(*) c'))
                        ->groupBy($statusCol)->get();
                    $r = $sumTitle + 2;
                    foreach ($rows as $row) {
                        $s->setCellValue("A{$r}", ucfirst((string)$row->v));
                        $s->setCellValue("B{$r}", (int)$row->c);
                        $r++;
                    }
                }

                // ==== TANDA TANGAN (di dalam lebar tabel, tanpa outline) ====
                $sigWidthCols = 3;
                $sigRightIdx  = $lastColIndex;
                $sigLeftIdx   = max(1, $lastColIndex - $sigWidthCols + 1);
                $sigLeft      = Coordinate::stringFromColumnIndex($sigLeftIdx);
                $sigRight     = Coordinate::stringFromColumnIndex($sigRightIdx);

                $line = $metaTopRow;
                $city = $this->city;
                $dateApproval = $this->approvedDate ?: now()->translatedFormat('d F Y');

                $s->mergeCells("{$sigLeft}{$line}:{$sigRight}{$line}");
                $s->setCellValue("{$sigLeft}{$line}", "{$city}, {$dateApproval}");
                $line++;

                $s->mergeCells("{$sigLeft}{$line}:{$sigRight}{$line}");
                $s->setCellValue("{$sigLeft}{$line}", "Disetujui oleh,");
                $line++;

                $s->mergeCells("{$sigLeft}{$line}:{$sigRight}{$line}");
                $s->getRowDimension($line)->setRowHeight(24);
                $line++;

                $s->mergeCells("{$sigLeft}{$line}:{$sigRight}{$line}");
                $s->getStyle("{$sigLeft}{$line}:{$sigRight}{$line}")
                  ->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THIN);
                $line++;

                // $s->mergeCells("{$sigLeft}{$line}:{$sigRight}{$line}");
                // $s->setCellValue("{$sigLeft}{$line}", $this->approvedByName ?: '');
                // $s->getStyle("{$sigLeft}{$line}:{$sigRight}{$line}")->getFont()->setBold(true);
                // $line++;

                $s->mergeCells("{$sigLeft}{$line}:{$sigRight}{$line}");
                $s->setCellValue("{$sigLeft}{$line}", $this->approvedByTitle ?: '');
            },
        ];
    }

    private function statusColumn(): ?string
    {
        $col = 'status';
        return $col !== '' ? $col : null;
    }
}