"use client";

import { useState } from "react";
import { Car, Circle, Edit, Eye, Fuel, MapPin, Plus, Trash2, Users, Download, Sparkles, Upload, FileSpreadsheet, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { type Vehicle } from "@/lib/vehicle-data";

import { useMediaQuery } from "@/hooks/use-media-query";
import { downloadExcel, downloadPdf } from "@/lib/api";

const formatRupiah = (v: number | string) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(
    typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : v
  );

// Header
export function DaftarKendaraanHeader({
  onAdd,
  search,
  status,
  onOpenTrash,
  deletedCount = 0,
}: {
  onAdd: () => void;
  search?: string;
  status?: string;
  onOpenTrash?: () => void;
  deletedCount?: number;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await downloadExcel("daftar-kendaraans", {
        // metadata header + tanda tangan di file Excel:
          city: "Boyolali",
          approved_by_name: "Manager Operasional",
          approved_by_title: "Manager Operasional",
          // approved_date: "21/08/2025", // kalau ingin set manual

          // set true kalau backend pakai session/cookie auth
          withCredentials: false,
      },
      "daftarKendaraan_export.xlsx"
    );
    } catch (e: any) {
      alert(e?.message || "Gagal export Excel");
    } finally {
      setIsExporting(false);
    }
  }

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await downloadPdf("daftar-kendaraans", {
        approver_name: "Budi Santoso",
        approver_title: "Kepala Operasional",
        place: "Boyolali",  
        // columns: "plate_number,brand,year,status", // kalau mau custom kolom
        // limit: 200,
        withCredentials: false,
      }, "daftarKendaraan_report.pdf");
    } catch (e: any) {
      alert(e?.message || "Gagal export PDF");
    } finally {
      setIsExporting(false);
    }
  }

  // next feature
  const handleImportExcel = () => alert("TODO: Import CSV/Excel");

  return (
    <div className="sticky top-16 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 -mx-4 px-4 pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daftar Kendaraan</h1>
          <p className="text-muted-foreground">Ini adalah master daftar kendaraan</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {onOpenTrash && (
            <Button
              variant="outline"
              onClick={onOpenTrash}
              className="relative border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sampah
              {deletedCount > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-700 border-red-200">
                  {deletedCount}
                </Badge>
              )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="shrink-0 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 text-purple-700 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                disabled={isExporting || isImporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting || isImporting ? "Processing..." : "Export/Import"}{" "}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 p-2 bg-white/95 backdrop-blur-sm border-purple-100 shadow-xl"
            >
              <DropdownMenuItem
                onClick={handleExportPDF}
                disabled={isExporting || isImporting}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    Modern PDF Report
                  </div>
                  <div className="text-xs text-gray-500">
                    Export ke PDF dengan tampilan yang cantik
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportExcel}
                disabled={isExporting || isImporting}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    Export ke CSV/Excel
                  </div>
                  <div className="text-xs text-gray-500">
                    Data terstruktur untuk analisis
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <DropdownMenuItem
                onClick={handleImportExcel}
                disabled={isExporting || isImporting}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                  <Upload className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    Import dari CSV
                  </div>
                  <div className="text-xs text-gray-500">
                    Upload data Daftar Kendaraan bulk
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={onAdd} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Daftar Kendaraan
          </Button>
        </div>
      </div>
    </div>
  );
}

// Filter
export function DaftarKendaraanFilters({
  searchTerm,
  setSearchTerm,
  // statusFilter,
  // setStatusFilter,
  // typeFilter,
  // setTypeFilter,
}: {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  // statusFilter: string;
  // setStatusFilter: (val: string) => void;
  // typeFilter: string;
  // setTypeFilter: (val: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Input
              placeholder="Cari disini..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-foreground placeholder:text-muted-foreground"
            />
            <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex gap-2">
            {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Rented">Rented</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Out of Service">Out of Service</SelectItem>
              </SelectContent>
            </Select> */}
            {/* <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Car">Car</SelectItem>
                <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="SUV">SUV</SelectItem>
              </SelectContent>
            </Select>; */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ResultsInfo({
  total,
  currentPage,
  itemsPerPage,
  from,
  to,
}: {
  total: number;
  currentPage: number;
  itemsPerPage: number;
  from?: number | null;
  to?: number | null;
}) {
  const _from = from ?? (currentPage - 1) * itemsPerPage + 1;
  const _to = to ?? Math.min(currentPage * itemsPerPage, total ?? 0);

  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-muted-foreground">
        Menampilkan {_from}-{_to}
        {typeof total === "number" ? ` dari ${total}` : ""} Daftar Kendaraan
      </p>
    </div>
  );
}

// pagination controls
export function PaginationControls({
  currentPage,
  lastPage,
  onPageChange,
  loading,
}: {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}) {
  const prev = () => onPageChange(Math.max(1, currentPage - 1));
  const next = () => onPageChange(Math.min(lastPage, currentPage + 1));

  // tampilkan maksimal 5 nomor halaman di sekitar current
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(lastPage, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        className="px-3 py-1 rounded border text-sm disabled:opacity-50"
        onClick={prev}
        disabled={loading || currentPage <= 1}
      >
        Prev
      </button>

      {start > 1 && (
        <>
          <button
            className="px-3 py-1 rounded border text-sm"
            onClick={() => onPageChange(1)}
            disabled={loading}
          >
            1
          </button>
          {start > 2 && <span className="px-2">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          className={`px-3 py-1 rounded border text-sm ${
            p === currentPage ? "bg-primary text-primary-foreground" : ""
          }`}
          onClick={() => onPageChange(p)}
          disabled={loading || p === currentPage}
        >
          {p}
        </button>
      ))}

      {end < lastPage && (
        <>
          {end < lastPage - 1 && <span className="px-2">…</span>}
          <button
            className="px-3 py-1 rounded border text-sm"
            onClick={() => onPageChange(lastPage)}
            disabled={loading}
          >
            {lastPage}
          </button>
        </>
      )}

      <button
        className="px-3 py-1 rounded border text-sm disabled:opacity-50"
        onClick={next}
        disabled={loading || currentPage >= lastPage}
      >
        Next
      </button>
    </div>
  );
}

// Mobile View
function MobileDaftarKendaraanCard({
  filteredDaftarKendaraan,
  handleDelete,
  handleView,
}: {
  filteredDaftarKendaraan: Record<string, any>;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
}): JSX.Element {
  const router = useRouter();
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Image
            src={filteredDaftarKendaraan.foto_depan_url || "/placeholder.svg"}
            alt={`${filteredDaftarKendaraan.jenis}`}
            width={128}
            height={160}
            className="w-24 h-18 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg truncate text-gray-900 dark:text-foreground">
                  {filteredDaftarKendaraan.jenis}
                </h3>
                <p className="text-sm text-gray-600 dark:text-foreground">
                  {filteredDaftarKendaraan.warna}
                </p>
              </div>
              
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              
            </div>

            <div className="flex justify-between items-center">
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(filteredDaftarKendaraan.id)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Link href={`/daftar-kendaraan/edit/${filteredDaftarKendaraan.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">
                        Hapus Data
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Apakah kamu yakin untuk menghapus {filteredDaftarKendaraan.jenis}? Data ini akan dipindahkan ke sampah.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                        Batal
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(filteredDaftarKendaraan.id)}
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// desktop View
export function DaftarKendaraanTable({
  handleView,
  handleDelete,
  filteredDaftarKendaraan
}: {
  handleView: (id: string) => void;
  handleDelete: (id: string) => void;
  filteredDaftarKendaraan: Record<string, any>;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? (
    <div>
      {filteredDaftarKendaraan.map((item: any) => (
        <MobileDaftarKendaraanCard
          key={item.id}
          filteredDaftarKendaraan={item}
          handleDelete={handleDelete}
          handleView={handleView}
        />
      ))}
    </div>
  ) : (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='text-foreground'>Kendaraan</TableHead>

              <TableHead className="text-right text-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            { filteredDaftarKendaraan.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className='text-left'><div className="text-left flex gap-3">
    <Image src={item.foto_depan_url || '/placeholder.svg'} width={80} height={80} className='rounded-md object-cover' />
    <div>
        <div className='text-sm font-semibold text-gray-900 dark:text-foreground'>{item.jenis}</div>
<div className='text-sm font-normal text-gray-900 dark:text-foreground'>{item.warna}</div>

    </div>
</div></TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* show */}
                    <Button variant="outline" size="sm" onClick={() => handleView(item.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* edit */}
                    <Link href={`/daftar-kendaraan/edit/${item.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Data</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah kamu yakin untuk menghapus data ini?, data ini tidak dihapus permanen dan akan dipindahkan ke sampah.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            )) }
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

