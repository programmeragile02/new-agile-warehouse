"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    Edit,
    Eye,
    Plus,
    Trash2,
    Mail,
    Phone,
    Crown,
    ArrowLeft,
} from "lucide-react";

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
import { Switch } from "@/components/ui/switch";

import { API_URL, updateData } from "@/lib/api";

/* ======================= Helpers ======================= */

// BASE backend dari API_URL (hapus /api di belakang)
const BASE_URL = API_URL.replace(/\/api\/?$/, "");

/** Normalisasi path file foto agar relatif terhadap disk public. */
function normalizeFotoPath(raw: string) {
    if (!raw) return null;
    const cleaned = raw.replace(/^\/+/, "");
    const noStorage = cleaned.replace(/^storage\//, "");
    return { cleaned, noStorage };
}

/** Status helpers */
function isActiveStatus(statusRaw: any) {
    const s = String(statusRaw ?? "")
        .toLowerCase()
        .trim();
    return s === "aktif" || s === "active" || s === "on";
}
function getStatusBadgeClassByBool(isActive: boolean) {
    return isActive
        ? "bg-green-100 text-green-800 border border-green-200"
        : "bg-red-100 text-red-800 border border-red-200";
}
function getStatusLabel(isActive: boolean) {
    return isActive ? "Active" : "Inactive";
}

/** Badge role — samakan seperti contoh gambar */
function getRoleBadgeClass(roleRaw: any) {
    const r = String(roleRaw ?? "").toLowerCase();

    if (r.includes("super")) return "bg-red-500 text-white";
    if (r.includes("admin")) return "bg-blue-500 text-white";
    if (r.includes("kasir") || r.includes("cashier"))
        return "bg-green-500 text-white";
    if (
        r.includes("operasional") ||
        r.includes("operational") ||
        r.includes("ops")
    )
        return "bg-amber-500 text-white";
    if (r.includes("viewer") || r.includes("read") || r.includes("view"))
        return "bg-gray-500 text-white";
    return "bg-slate-200 text-slate-900";
}

/* ======================= Thumbnail Foto (dengan fallback) ======================= */
function PhotoThumb({ item }: { item: any }) {
    const absolut =
        item?.foto_url && /^https?:\/\//i.test(String(item.foto_url))
            ? String(item.foto_url)
            : null;

    const pathInfo = normalizeFotoPath(String(item?.foto || ""));
    const candidates: string[] = [];

    if (absolut) candidates.push(absolut);
    if (pathInfo?.noStorage)
        candidates.push(`${BASE_URL}/public-files/${pathInfo.noStorage}`);
    if (pathInfo?.cleaned) {
        const isAlreadyStorage = pathInfo.cleaned.startsWith("storage/");
        candidates.push(
            `${BASE_URL}/${
                isAlreadyStorage
                    ? pathInfo.cleaned
                    : `storage/${pathInfo.cleaned}`
            }`
        );
    }

    const [idx, setIdx] = useState(0);
    const src = candidates[idx];

    if (!src) {
        return (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground border">
                N/A
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={item?.nama ? `Foto ${item.nama}` : "Foto user"}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover border"
            unoptimized
            onError={() => {
                if (idx < candidates.length - 1) setIdx(idx + 1);
            }}
        />
    );
}

/* ======================= Header ======================= */
export function UserManagementHeader({ onAdd }: { onAdd: () => void }) {
    // ✅ Tambah tombol Back yang berfungsi, tampil hanya di mobile (md:hidden)
    const router = useRouter();

    return (
        <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 -mx-4 px-4 pt-4">
            {/* Back button di ATAS judul (mobile only) */}
            <div className="md:hidden mb-3">
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    aria-label="Kembali"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Kembali</span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        User Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage system users and their access
                    </p>
                </div>
                <Button onClick={onAdd} className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah User Management
                </Button>
            </div>
        </div>
    );
}

/* ======================= Filters ======================= */
export function UserManagementFilters({
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
                        {/* Menggunakan ikon Eye sesuai kode sebelumnya (UI tidak diubah) */}
                        <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    </div>
                    <div className="flex gap-2">
                        {/* filter lain (disembunyikan) */}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* ======================= NEW: Stats Cards ======================= */
export function UserManagementStats({ items }: { items: any[] }) {
    const totalUsers = items.length;
    const activeUsers = items.filter((u) => isActiveStatus(u.status)).length;
    const inactiveUsers = totalUsers - activeUsers;
    const adminUsers = items.filter((u) => {
        const r = String(
            u.role_name ??
                u.levelUser?.nama_level ??
                u.role?.nama_level ??
                u.role_label ??
                (typeof u.role === "string" ? u.role : "")
        )
            .toLowerCase()
            .trim();
        return r.includes("super") || r.includes("admin");
    }).length;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                            {totalUsers}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Total Users
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {activeUsers}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Active Users
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {inactiveUsers}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Inactive Users
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {adminUsers}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Admin Users
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/* ======================= Results Info ======================= */
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
                {Math.min(startIndex + itemsPerPage, total)} of {total} User
                Management
            </p>
        </div>
    );
}

/* ======================= Table (Desktop) + Cards (Mobile) ======================= */
export function UserManagementTable({
    handleView,
    handleDelete,
    filteredUserManagement,
}: {
    handleView: (id: string | number) => void;
    handleDelete: (id: string | number) => void;
    filteredUserManagement: any[];
}) {
    // Override status lokal (agar toggle langsung terasa)
    const [statusOverride, setStatusOverride] = useState<
        Record<string | number, boolean>
    >({});

    async function onToggleStatus(item: any, nextVal: boolean) {
        const id = item.id;
        const prevVal = statusOverride[id] ?? isActiveStatus(item.status);
        setStatusOverride((m) => ({ ...m, [id]: nextVal }));
        try {
            const newStatus = nextVal ? "Aktif" : "Tidak Aktif";
            await updateData("user_managements", id, { status: newStatus });
        } catch {
            setStatusOverride((m) => ({ ...m, [id]: prevVal }));
        }
    }

    /** =============== DESKTOP TABLE (md and up) =============== */
    const DesktopTable = (
        <Card className="hidden md:block">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-foreground">
                                User
                            </TableHead>
                            <TableHead className="text-foreground">
                                Contact
                            </TableHead>
                            <TableHead className="text-foreground">
                                Role
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
                        {filteredUserManagement?.length ? (
                            filteredUserManagement.map((item: any) => {
                                const roleLabel =
                                    item.role_name ??
                                    item.levelUser?.nama_level ??
                                    item.role?.nama_level ??
                                    item.role_label ??
                                    (typeof item.role === "string"
                                        ? item.role
                                        : "");

                                const baseActive = isActiveStatus(item.status);
                                const currentActive =
                                    statusOverride[item.id] ?? baseActive;

                                return (
                                    <TableRow key={item.id}>
                                        {/* USER */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <PhotoThumb item={item} />
                                                <div className="leading-tight">
                                                    <div className="flex items-center gap-1">
                                                        <p className="font-medium text-foreground">
                                                            {item.nama ?? "-"}
                                                        </p>
                                                        {String(roleLabel)
                                                            .toLowerCase()
                                                            .includes(
                                                                "super"
                                                            ) && (
                                                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        ID: {item.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* CONTACT */}
                                        <TableCell>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center gap-2 text-foreground">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span className="truncate">
                                                        {item.email ?? "-"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-foreground">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <span className="truncate">
                                                        {item.nomor_telp ??
                                                            item.nomorTelp ??
                                                            "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* ROLE */}
                                        <TableCell>
                                            {roleLabel ? (
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(
                                                        roleLabel
                                                    )}`}
                                                >
                                                    {roleLabel}
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>

                                        {/* STATUS */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    className={getStatusBadgeClassByBool(
                                                        currentActive
                                                    )}
                                                >
                                                    {getStatusLabel(
                                                        currentActive
                                                    )}
                                                </Badge>
                                                <Switch
                                                    checked={currentActive}
                                                    onCheckedChange={(val) =>
                                                        onToggleStatus(
                                                            item,
                                                            Boolean(val)
                                                        )
                                                    }
                                                />
                                            </div>
                                        </TableCell>

                                        {/* AKSI */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleView(item.id)
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Link
                                                    href={`/user-management/edit/${item.id}`}
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
                                                                menghapus data
                                                                ini?
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
                            })
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-10 text-muted-foreground"
                                >
                                    Tidak ada data.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    /** =============== MOBILE CARDS (below md) =============== */
    const MobileCards = (
        <div className="md:hidden space-y-3">
            {filteredUserManagement?.length ? (
                filteredUserManagement.map((item: any) => {
                    const roleLabel =
                        item.role_name ??
                        item.levelUser?.nama_level ??
                        item.role?.nama_level ??
                        item.role_label ??
                        (typeof item.role === "string" ? item.role : "");

                    const baseActive = isActiveStatus(item.status);
                    const currentActive = statusOverride[item.id] ?? baseActive;

                    return (
                        <Card key={item.id} className="border-border bg-card">
                            <CardContent className="p-4">
                                {/* Header: avatar + nama + role pill */}
                                <div className="flex items-start gap-3">
                                    <PhotoThumb item={item} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <p className="font-medium text-card-foreground truncate">
                                                {item.nama ?? "-"}
                                            </p>
                                            {String(roleLabel)
                                                .toLowerCase()
                                                .includes("super") && (
                                                <Crown className="h-3.5 w-3.5 text-amber-500" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            ID: {item.id}
                                        </p>
                                    </div>
                                    {roleLabel ? (
                                        <span
                                            className={`ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium ${getRoleBadgeClass(
                                                roleLabel
                                            )}`}
                                        >
                                            {roleLabel}
                                        </span>
                                    ) : null}
                                </div>

                                {/* Kontak */}
                                <div className="mt-3 space-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate text-card-foreground">
                                            {item.email ?? "-"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate text-card-foreground">
                                            {item.nomor_telp ??
                                                item.nomorTelp ??
                                                "-"}
                                        </span>
                                    </div>
                                </div>

                                {/* Status + Switch */}
                                <div className="mt-3 flex items-center justify-between">
                                    <Badge
                                        className={getStatusBadgeClassByBool(
                                            currentActive
                                        )}
                                    >
                                        {getStatusLabel(currentActive)}
                                    </Badge>
                                    <Switch
                                        checked={currentActive}
                                        onCheckedChange={(val) =>
                                            onToggleStatus(item, Boolean(val))
                                        }
                                    />
                                </div>

                                {/* Actions */}
                                <div className="mt-3 flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleView(item.id)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Link
                                        href={`/user-management/edit/${item.id}`}
                                    >
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
                                                    Yakin ingin menghapus data
                                                    ini?
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
                })
            ) : (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        Tidak ada data.
                    </CardContent>
                </Card>
            )}
        </div>
    );

    return (
        <>
            {DesktopTable}
            {MobileCards}
        </>
    );
}
