"use client";

import { useState } from "react";
import {
  Car,
  Circle,
  Edit,
  Eye,
  Fuel,
  MapPin,
  Plus,
  Trash2,
  Users,
  Download,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { type Vehicle } from "@/lib/vehicle-data";

import { useMediaQuery } from "@/hooks/use-media-query";
import { downloadExcel, downloadPdf } from "@/lib/api";

const formatRupiah = (v: number | string) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(
    typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : v
  );

// Header
export function DataKendaraanHeader({
  onAdd,
  search,
  status,
}: {
  onAdd: () => void;
  search?: string;
  status?: string;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await downloadExcel(
        "data-kendaraans",
        {
          // metadata header + tanda tangan di file Excel:
          city: "Boyolali",
          approved_by_name: "Manager Operasional",
          approved_by_title: "Manager Operasional",
          // approved_date: "21/08/2025", // kalau ingin set manual

          // set true kalau backend pakai session/cookie auth
          withCredentials: false,
        },
        "dataKendaraan_export.xlsx"
      );
    } catch (e: any) {
      alert(e?.message || "Gagal export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await downloadPdf(
        "data-kendaraans",
        {
          approver_name: "Budi Santoso",
          approver_title: "Kepala Operasional",
          place: "Boyolali",
          // columns: "plate_number,brand,year,status", // kalau mau custom kolom
          // limit: 200,
          withCredentials: false,
        },
        "dataKendaraan_report.pdf"
      );
    } catch (e: any) {
      alert(e?.message || "Gagal export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // next feature
  const handleImportExcel = () => alert("TODO: Import CSV/Excel");

  return (
    <div className="sticky top-16 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 -mx-4 px-4 pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Kendaraan</h1>
          <p className="text-muted-foreground">Data kendaraan yang disewakan</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="shrink-0 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 text-purple-700 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                disabled={isExporting || isImporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting || isImporting
                  ? "Processing..."
                  : "Export/Import"}{" "}
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
                    Beautiful design with gradients & styling
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
                    Upload data Data Kendaraan bulk
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={onAdd} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Data Kendaraan
          </Button>
        </div>
      </div>
    </div>
  );
}

// Filter
export function DataKendaraanFilters({
  searchTerm,
  setSearchTerm,
}: // statusFilter,
// setStatusFilter,
// typeFilter,
// setTypeFilter,
{
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
              placeholder="Search here..."
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
  );
}

export function ResultsInfo({
  total,
  currentPage,
  itemsPerPage,
}: {
  total: number;
  currentPage: number;
  itemsPerPage: number;
}) {
  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, total)} of{" "}
        {total} Data Kendaraan
      </p>
    </div>
  );
}

// Mobile View
function MobileDataKendaraanCard({
  filteredDataKendaraan,
  handleDelete,
  handleView,
}: {
  filteredDataKendaraan: Record<string, any>;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
}): JSX.Element {
  const router = useRouter();
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Image
            src={filteredDataKendaraan.foto_depan_url || "/placeholder.svg"}
            alt={`${filteredDataKendaraan.model}`}
            width={128}
            height={160}
            className="w-24 h-18 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg truncate text-gray-900 dark:text-foreground">
                  {filteredDataKendaraan.model}
                </h3>
                <p className="text-sm text-gray-600 dark:text-foreground">
                  {filteredDataKendaraan.tahun}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-700 dark:text-foreground" />
                <span className="text-gray-700 dark:text-foreground">
                  {filteredDataKendaraan.lokasi}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-700 dark:text-foreground" />
                <span className="text-gray-700 dark:text-foreground">
                  {filteredDataKendaraan.tahun}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              {/* <span className="font-bold text-lg text-blue-600">
                Rp {formatRupiah(filteredDataKendaraan.)}/day
              </span> */}
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(filteredDataKendaraan.id)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Link href={`/data-kendaraan/edit/${filteredDataKendaraan.id}`}>
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
                        Delete Vehicle
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Are you sure you want to delete{" "}
                        {filteredDataKendaraan.model}? This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(filteredDataKendaraan.id)}
                      >
                        Delete
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
  );
}

// desktop View
export function DataKendaraanTable({
  handleView,
  handleDelete,
  filteredDataKendaraan,
}: {
  handleView: (id: string) => void;
  handleDelete: (id: string) => void;
  filteredDataKendaraan: Record<string, any>;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? (
    <div>
      {filteredDataKendaraan.map((item: any) => (
        <MobileDataKendaraanCard
          key={item.id}
          filteredDataKendaraan={item}
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
              <TableHead className="text-foreground">Foto Depan</TableHead>
              <TableHead className="text-foreground">Model</TableHead>
              <TableHead className="text-foreground">Lokasi</TableHead>
              <TableHead className="text-foreground">Status</TableHead>

              <TableHead className="text-right text-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDataKendaraan.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="text-left">
                  <img
                    src={item.foto_depan_url}
                    alt=""
                    className="w-[64px] h-[64px] object-cover rounded-[0.5rem]"
                  />
                </TableCell>
                <TableCell className="text-left">
                  <div className="text-sm font-semibold text-gray-900 dark:text-foreground">
                    {item.model}
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <div className="text-sm font-normal text-blue-600 dark:text-foreground">
                    {item.lokasi}
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  {(() => {
                    switch (item.status) {
                      case "Avaliable":
                        return (
                          <Badge className="bg-green-100 text-green-700">
                            Avaliable
                          </Badge>
                        );
                      case "Rented":
                        return (
                          <Badge className="bg-blue-100 text-blue-700">
                            Rented
                          </Badge>
                        );
                      case "Maintenance":
                        return (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            Maintenance
                          </Badge>
                        );
                      case "Out Of Service":
                        return (
                          <Badge className="bg-red-100 text-red-700">
                            Out Of Service
                          </Badge>
                        );

                      default:
                        return item.status;
                    }
                  })()}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* show */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(item.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* edit */}
                    <Link href={`/data-kendaraan/edit/${item.id}`}>
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
                          <AlertDialogTitle>Hapus Data</AlertDialogTitle>
                          <AlertDialogDescription>
                            Yakin ingin menghapus data ini?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
