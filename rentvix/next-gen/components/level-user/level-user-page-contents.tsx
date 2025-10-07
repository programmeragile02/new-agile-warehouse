"use client";

import { Edit, Eye, Plus, Trash2, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Eye as EyeIcon } from "lucide-react";

// Header (dengan tombol Back khusus mobile)
export function LevelUserHeader({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 -mx-4 px-4 pt-4">
            {/* ⬇️ Tombol back hanya tampil di mobile */}
            <div className="mb-2 md:hidden">
                <Link href="/" className="inline-flex">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Kembali</span>
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Level User
                    </h1>
                    <p className="text-muted-foreground">
                        Kelola level akses pengguna sistem
                    </p>
                </div>
                <Button onClick={onAdd} className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Level User
                </Button>
            </div>
        </div>
    );
}

/* ======================= STATS CARDS ======================= */
export function LevelUserStats({
    items,
    stats,
}: {
    items: Record<string, any>[];
    stats?: any | null;
}) {
    const totalLevels =
        stats?.total_levels ?? (Array.isArray(items) ? items.length : 0);
    const activeLevels =
        stats?.active_levels ??
        (Array.isArray(items)
            ? items.filter(
                  (x) => String(x.status ?? "").toLowerCase() === "aktif"
              ).length
            : 0);
    const inactiveLevels =
        stats?.inactive_levels ??
        (Array.isArray(items)
            ? items.filter(
                  (x) => String(x.status ?? "").toLowerCase() === "tidak aktif"
              ).length
            : 0);
    const totalUsers =
        stats?.total_users ??
        (Array.isArray(items)
            ? items.reduce(
                  (acc, it) =>
                      acc + Number(it.users_count ?? it.usersCount ?? 0),
                  0
              )
            : 0);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                        <span>Total Level</span>
                        <span className="opacity-60">🛡️</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {totalLevels}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        Level akses tersedia
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                        <span>Level Aktif</span>
                        <span className="text-green-600">^</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                        {activeLevels}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        Level yang aktif
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                        <span>Level Tidak Aktif</span>
                        <span className="text-red-600">^</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                        {inactiveLevels}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        Level yang tidak aktif
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                        <span>Total Users</span>
                        <Users className="h-4 w-4 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {totalUsers}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        Pengguna terdaftar
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Filter
export function LevelUserFilters({
    searchTerm,
    setSearchTerm,
}: {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
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
                        <EyeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    </div>
                    <div className="flex gap-2">
                        {/* filter tambahan kalau perlu */}
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
                Showing {startIndex + 1}-
                {Math.min(startIndex + itemsPerPage, total)} of {total} Level
                User
            </p>
        </div>
    );
}

// Desktop: Table (tidak diubah)
export function LevelUserTable({
    handleView,
    handleDelete,
    filteredLevelUser,
}: {
    handleView: (id: string) => void;
    handleDelete: (id: string) => void;
    filteredLevelUser: Record<string, any>[];
}) {
    function getStatusBadgeClass(statusRaw: any) {
        const s = String(statusRaw ?? "")
            .toLowerCase()
            .trim();
        const isActive = s === "aktif" || s === "active" || s === "on";
        return isActive
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-red-100 text-red-800 border border-red-200";
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-foreground">
                                Nama Level
                            </TableHead>
                            <TableHead className="text-foreground">
                                Deskripsi
                            </TableHead>
                            <TableHead className="text-foreground">
                                Total Users
                            </TableHead>
                            <TableHead className="text-foreground">
                                Status
                            </TableHead>
                            <TableHead className="text-right text-foreground">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLevelUser.map((item: any) => {
                            const totalUsers = Number(
                                item.users_count ?? item.usersCount ?? 0
                            );

                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.nama_level}
                                    </TableCell>
                                    <TableCell>{item.deskripsi}</TableCell>

                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-foreground">
                                            {totalUsers} users
                                        </span>
                                    </TableCell>

                                    <TableCell>
                                        <Badge
                                            className={getStatusBadgeClass(
                                                item.status
                                            )}
                                        >
                                            {item.status ?? "-"}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleView(item.id)
                                                }
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </Button>
                                            <Link
                                                href={`/level-user/edit/${item.id}`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Hapus Data
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Yakin ingin
                                                            menghapus data ini?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Batal
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.id
                                                                )
                                                            }
                                                        >
                                                            Hapus
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

/* ======================= MOBILE CARDS ======================= */
/* Ditampilkan hanya di <md> dari LevelUserPage (md:hidden) */
export function LevelUserCardsMobile({
    handleView,
    handleDelete,
    filteredLevelUser,
}: {
    handleView: (id: string) => void;
    handleDelete: (id: string) => void;
    filteredLevelUser: Record<string, any>[];
}) {
    function statusClasses(sRaw: any) {
        const s = String(sRaw ?? "")
            .toLowerCase()
            .trim();
        const isActive = s === "aktif" || s === "active" || s === "on";
        return isActive
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-red-100 text-red-800 border border-red-200";
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            {filteredLevelUser.map((item: any) => {
                const totalUsers = Number(
                    item.users_count ?? item.usersCount ?? 0
                );
                return (
                    <Card key={item.id}>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-foreground">
                                    {item.nama_level ?? "-"}
                                </div>
                                <Badge className={statusClasses(item.status)}>
                                    {item.status ?? "-"}
                                </Badge>
                            </div>

                            {item.deskripsi && (
                                <p className="text-sm text-muted-foreground">
                                    {item.deskripsi}
                                </p>
                            )}

                            <div className="flex items-center gap-2 text-sm">
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-foreground">
                                    {totalUsers} users
                                </span>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleView(item.id)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>

                                <Link href={`/level-user/edit/${item.id}`}>
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
                                            <AlertDialogTitle>
                                                Hapus Data
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Yakin ingin menghapus data ini?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Batal
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                            >
                                                Hapus
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
