"use client";

import React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { DaftarKendaraanHeader, DaftarKendaraanFilters, DaftarKendaraanTable, ResultsInfo, PaginationControls } from "./daftar-kendaraan-page-contents";
import { deleteData, fetchPaginatedData, deletedData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "../ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "../ui/separator";
import { useRouter } from "next/navigation";

import ActionBar from "@/components/actions/ActionBar";
import { Trash2 } from "lucide-react";
import { DaftarKendaraanTrash } from "./daftar-kendaraan-trash";

const ITEMS_PER_PAGE = 10

export function DaftarKendaraanPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [items, setItems] = useState<Record<string, any>[]>([]);
    // const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [showTrash, setShowTrash] = useState(false);
    const [deletedCount, setDeletedCount] = useState(0);

    const [meta, setMeta] = useState<{
        current_page?: number;
        per_page?: number;
        total?: number | null;
        last_page?: number | null;
        from?: number | null;
        to?: number | null;
    }>({});

    const refetch = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            // kalau nanti butuh stats juga:
            // const [dataItems/*, dataStats*/] = await Promise.all([
            //   fetchData("daftar-kendaraans", { signal }),
            //   fetchModuleStats({ signal }),
            // ]);
            const dataItems = await fetchPaginatedData("daftar-kendaraans", {
                signal,
                params: {
                    page: currentPage,
                    per_page: ITEMS_PER_PAGE,
                }
            });
            if (signal?.aborted) return;
            setItems(dataItems?.data ?? []);
            setMeta(dataItems?.meta ?? {});
            // setStats(dataStats);
        } catch (err: any) {
            if (err?.name === "AbortError") return;
            toast({
                title: "Gagal Memuat Data",
                description: err?.message || "Terjadi kesalahan saat mengambil data dari server",
                variant: "destructive",
            });
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [toast, currentPage]);

    // scroll awal (tetap terpisah)
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    // initial load
    useEffect(() => {
        fetchDeletedCount();
        const ctrl = new AbortController();
        refetch(ctrl.signal);
        return () => ctrl.abort();
    }, [refetch]);

    const filteredDaftarKendaraan = useMemo(() => {
        // return items.filter((item) => {
           // const matchesSearch =
            
            // const matchesStatus = statusFilter === "all" || item?.status === statusFilter
            // const matchesType = typeFilter === "all" || item?.type === typeFilter

            // return matchesSearch && matchesStatus && matchesType

            // return matchesSearch;

            const toSearchStr = (v: unknown): string => (v == null ? "" : Array.isArray(v) ? v.join(" ") : String(v)).toLowerCase();

            const q = (searchTerm ?? "").toLowerCase();
            if (!q) return items;

            const SEARCH_KEYS = ["jenis","warna","foto_depan","foto_samping"] as const;

            return items.filter((item) => SEARCH_KEYS.some((k) => toSearchStr((item as any)[k]).includes(q)));

        // })
    }, [items, searchTerm]);

    const fetchDeletedCount = async() => {
        try {
            const response = await deletedData("daftar-kendaraans");
            setDeletedCount(response.total);
        } catch (error) {
            console.error("Error fetching deleted count:", error);
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteData("daftar-kendaraans", id);
            toast({ title: "Sukses!", description: "Data dipindahkan ke sampah." });
            setItems((prev) => prev.filter((item) => item.id !== id));
            fetchDeletedCount();
        } catch (error: any) {
            toast({
            title: "Gagal menghapus",
            description: error.message || "Terjadi kesalahan",
            variant: "destructive",
            });
        }
    };

    const handleAdd = () => {
        router.push("/daftar-kendaraan/create");
    };

    const handleView = (id: string) => {
        // view belum dibuat jadi dinonaktifkan dulu
        // router.push(`/daftar-kendaraan/view/${id}`);
        router.push(`/#`);
    };

    const openTrash = () => setShowTrash(true);
    const closeTrash = () => {
        setShowTrash(false);
        // Refresh counter setelah modal ditutup (misal ada restore/delete permanen)
        fetchDeletedCount();
        // Opsional: refresh list aktif
        // const ctrl = new AbortController();
        // refetch(ctrl.signal);
        // ctrl.abort();
    };

    const handleCloseTrash = useCallback(async () => {
    setShowTrash(false);
        await fetchDeletedCount();
        await refetch(); // PANGGIL TANPA signal agar tidak ter-abort
    }, [refetch]);

    const CRUMBS = [{"title":"Data & Armada","route_path":null,"level":1,"type":"group"},{"title":"Kendaraan (Armada)","route_path":null,"level":2,"type":"module"},{"title":"Daftar Kendaraan","route_path":"/daftar-kendaraan","level":3,"type":"menu"}] as { title: string; route_path?: string|null; level: number; type: string }[];

    return (
        <>
            {/* Trash Modal */}
            {showTrash && (
                <DaftarKendaraanTrash
                onClose={handleCloseTrash}
                />
            )}
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <SidebarTrigger className="-ml-1 h-7 w-7 border border-black/20 text-black hover:bg-black/10 hover:text-black dark:border-white/30 dark:text-white dark:hover:bg-white/20 dark:hover:text-white" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {/* <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink
                                href="/"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem> */}
                        {CRUMBS.map((c, i) => (
                            <React.Fragment key={i}>
                                {i < CRUMBS.length - 1 ? (
                                    <>
                                        <BreadcrumbItem className="md:block">
                                            {/* <BreadcrumbLink href={c.route_path || "#"} className="text-muted-foreground hover:text-foreground"> */}
                                                {c.title}
                                            {/* </BreadcrumbLink> */}
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="md:block" />
                                    </>
                                ) : (
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="text-foreground">
                                            {c.title /* item terakhir = halaman saat ini */}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                )}
                                </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col">
                <div className="space-y-6 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <DaftarKendaraanHeader onAdd={handleAdd} onOpenTrash={openTrash} deletedCount={deletedCount} />
                        <ActionBar entity="daftar-kendaraans" onDone={() => refetch()} />
                    </div>
                    <DaftarKendaraanFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                    <ResultsInfo
                        total={meta?.total ?? filteredDaftarKendaraan.length}
                        currentPage={meta?.current_page ?? 1}
                        itemsPerPage={meta?.per_page ?? ITEMS_PER_PAGE}
                        from={
                            meta?.from ??
                            ((meta?.current_page ?? 1) - 1) *
                                (meta?.per_page ?? ITEMS_PER_PAGE) +
                                1
                        }
                        to={
                            meta?.to ??
                            (meta?.current_page ?? 1) * (meta?.per_page ?? ITEMS_PER_PAGE)
                        }
                    />
                    <DaftarKendaraanTable handleView={handleView} handleDelete={handleDelete} filteredDaftarKendaraan={filteredDaftarKendaraan} />
                    <PaginationControls
                        currentPage={meta?.current_page ?? 1}
                        lastPage={
                            meta?.last_page ??
                            Math.max(
                                1,
                                Math.ceil(
                                (meta?.total ?? filteredDaftarKendaraan.length) /
                                    (meta?.per_page ?? ITEMS_PER_PAGE)
                                )
                            )
                        }
                        onPageChange={setCurrentPage}
                        loading={loading}
                    />
                </div>
            </div>
        </>
    );
}