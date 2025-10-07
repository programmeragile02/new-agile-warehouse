"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { DataUserHeader, DataUserFilters, DataUserTable, ResultsInfo } from "./data-user-page-contents";
import { deleteData, fetchData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "../app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
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

const ITEMS_PER_PAGE = 10

export function DataUserPage() {
    const router = useRouter();
    const [items, setItems] = useState<Record<string, any>[]>([]);
    // const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);

    const refetch = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            // kalau nanti butuh stats juga:
            // const [dataItems/*, dataStats*/] = await Promise.all([
            //   fetchData("data-users", { signal }),
            //   fetchModuleStats({ signal }),
            // ]);
            const dataItems = await fetchData("data-users", { signal });
            if (signal?.aborted) return;
            setItems(dataItems);
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
    }, [toast]);

    // scroll awal (tetap terpisah)
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    // initial load
    useEffect(() => {
        const ctrl = new AbortController();
        refetch(ctrl.signal);
        return () => ctrl.abort();
    }, [refetch]);

    const filteredDataUser = useMemo(() => {
        // return items.filter((item) => {
           // const matchesSearch =
            
            // const matchesStatus = statusFilter === "all" || item?.status === statusFilter
            // const matchesType = typeFilter === "all" || item?.type === typeFilter

            // return matchesSearch && matchesStatus && matchesType

            // return matchesSearch;

            const toSearchStr = (v: unknown): string => (v == null ? "" : Array.isArray(v) ? v.join(" ") : String(v)).toLowerCase();

            const q = (searchTerm ?? "").toLowerCase();
            if (!q) return items;

            const SEARCH_KEYS = ["nama","email","noHp","password"] as const;

            return items.filter((item) => SEARCH_KEYS.some((k) => toSearchStr((item as any)[k]).includes(q)));

        // })
    }, [items, searchTerm]);

    const totalPages = Math.ceil(filteredDataUser.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredDataUser.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleDelete = async (id: string) => {
        try {
            await deleteData("data-users", id);
            toast({ title: "Berhasil!", description: "Data DataUser berhasil dihapus." });
            setItems((prev) => prev.filter((item) => item.id !== id));
        } catch (error: any) {
            toast({
            title: "Gagal menghapus",
            description: error.message || "Terjadi kesalahan",
            variant: "destructive",
            });
        }
    };

    const handleAdd = () => {
        router.push("/data-user/create");
    };

    const handleView = (id: string) => {
        router.push(`/data-user/view/${id}`);
    };

    return (
        <>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    {/* NOTEE BREADCUMB DI SESUAIKAN SAMA ROUTE MENU NANTI */}
                    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <SidebarTrigger className="-ml-1 h-7 w-7 border border-black/20 text-black hover:bg-black/10 hover:text-black dark:border-white/30 dark:text-white dark:hover:bg-white/20 dark:hover:text-white" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink
                                        href="/"
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink
                                        href="/vehicles" // linknya juga diubah ketika sudah ada modul menu
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        {/* Operations */} {/* diisi nama modul menu y */}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-foreground">
                                        Data User
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </header>

                    <div className="flex flex-1 flex-col">
                        <div className="space-y-6 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <DataUserHeader onAdd={handleAdd} />
                                <ActionBar entity="data-users" onDone={() => refetch()} />
                            </div>
                            <DataUserFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                            <ResultsInfo total={filteredDataUser.length} currentPage={currentPage} itemsPerPage={ITEMS_PER_PAGE} />
                            <DataUserTable handleView={handleView} handleDelete={handleDelete} filteredDataUser={filteredDataUser} />
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
    // return <DataUserContents items={items} loading={loading} stats={stats} />;
}