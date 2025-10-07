"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  RefreshCw,
  RotateCcw,
  Trash2,
  Loader2,
  Code,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { restore, forceDelete, deletedData as deletedDataAPI } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "@/components/ui/button";

interface DaftarKendaraanTrashProps {
  onClose: () => void;
}

export function DaftarKendaraanTrash({ onClose }: DaftarKendaraanTrashProps) {
    const [deletedData, setDeletedData] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);

    const col1 = "jenis";
    const col1Label = "Jenis";
    const col2 = "warna";
    const col2Label = "Warna";

    const fetchDeletedData = async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await deletedDataAPI("daftar-kendaraans");
            const data = response.data || [];

            setDeletedData(data);
        } catch (error) {
            console.error("Error fetching deleted data: ", error);
            setDeletedData([]);
            toast({
                title: "Error",
                description:
                "Failed load deleted data. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    // load
    useEffect(() => {
        fetchDeletedData();
    }, []);

    // Search changes
    useEffect(() => {
        if (!loading) {
        const timeoutId = setTimeout(() => {
            fetchDeletedData();
        }, 500);
        return () => clearTimeout(timeoutId);
        }
    }, [searchQuery]);

    // handle restore
    const handleRestore = async (id: string) => {
        try {
            await restore("daftar-kendaraans", id);
            toast({
                title: "Sukses!",
                description: "Berhasil mengembalikan data",
            });
            fetchDeletedData();
        } catch (error) {
            toast({
                title: "Gagal",
                description: "Gagal mengembalikan data",
                variant: "destructive",
            });
        } finally {
            setRestoreDialogOpen(false);
        }
    }

    // handle delete permanen (force)
    const handlePermanentDelete = async (id: string) => {
        try {
            await forceDelete("daftar-kendaraans", id);
            toast({
                title: "Sukses!",
                description: "Data berhasil dihapus secara permanen",
            });
            fetchDeletedData();
        } catch (error) {
            toast({
                title: "Gagal",
                description:
                "Gagal menghapus data secara permanen, silahkan coba lagi",
                variant: "destructive",
            });
        } finally {
            setPermanentDeleteDialogOpen(false);
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
                    <CardContent className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <span className="text-slate-600">Memuat data sampah...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center mt-0">
            <Card className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Trash2 className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-slate-900">
                                    Sampah Daftar Kendaraan
                                </CardTitle>
                                <CardDescription>
                                    Kelola data Daftar Kendaraan yang dihapus
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-slate-300 bg-transparent"
                        >
                            Tutup
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Search and Controls */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Cari data yang dihapus..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 border-slate-200 focus:border-red-500 focus:ring-red-500/20"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchDeletedData(true)}
                            disabled={refreshing}
                            className="border-slate-200 hover:bg-slate-50"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>

                    {/* Deleted List */}
                    {deletedData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Trash2 className="h-16 w-16 text-slate-400 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                {searchQuery
                                ? "Data tidak ditemukan"
                                : "Sampah kosong"}
                            </h3>
                            <p className="text-slate-600 text-center max-w-md">
                                {searchQuery
                                ? "Coba ulangi pencarian anda."
                                : "Tidak ada yang dihapus. Data yang dihapus akan muncul disini."}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{col1Label}</TableHead>
                                        <TableHead>{col2Label}</TableHead>
                                        <TableHead className="text-right">Dihapus pada</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deletedData.map((data) => (
                                        <TableRow key={data.id}>
                                            <TableCell>{String(data[col1] ?? "-")}</TableCell>
                                            <TableCell>{String(data[col2] ?? "-")}</TableCell>
                                            <TableCell className="text-right">
                                                {formatDate(data.deleted_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 pt-2">

                                                    {/* Restore Confirmation Dialog */}
                                                    <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="flex items-center gap-2">
                                                                    <RotateCcw className="h-5 w-5 text-green-600" />
                                                                    Restore data ini
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Apakah kamu yakin untuk mengembalikan data ini?
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleRestore(data.id)}
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    Restore
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                        setRestoreDialogOpen(true);
                                                        }}
                                                        className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                                                    >
                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                        Restore
                                                    </Button>

                                                    {/* Permanent Delete Confirmation Dialog */}
                                                    <AlertDialog
                                                        open={permanentDeleteDialogOpen}
                                                        onOpenChange={setPermanentDeleteDialogOpen}
                                                    >
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                                                    <AlertTriangle className="h-5 w-5" />
                                                                    Hapus permanen
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription className="space-y-2">
                                                                    <p>
                                                                        <strong className="text-red-600">PERHATIAN:</strong> Kamu akan menghapus data ini secara permanen.
                                                                    </p>
                                                                    <p>
                                                                        Aksi ini <strong>TIDAK BISA DIKEMBALIKAN</strong> dan akan menghapus permanen data terkait
                                                                    </p>
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handlePermanentDelete(data.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Hapus Permanen
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                        setPermanentDeleteDialogOpen(true);
                                                        }}
                                                        className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Hapus Permanen
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}