"use client";

import { useEffect, useMemo, useState } from "react";
import {
    UserManagementHeader,
    UserManagementStats,
    UserManagementFilters,
    UserManagementTable,
    ResultsInfo,
} from "./user-management-page-contents";
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

const ITEMS_PER_PAGE = 10;

export function UserManagementPage() {
    const router = useRouter();
    const [items, setItems] = useState<Record<string, any>[]>([]);
    // const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [dataItems] = await Promise.all([
                    // const [dataItems, dataStats] = await Promise.all([
                    fetchData("user_managements"),
                    // fetchModuleStats(),
                ]);

                // === Normalisasi: buat role_label agar tabel & search pakai nama level, bukan id ===
                const normalized = (dataItems || []).map((r: any) => ({
                    ...r,
                    role_label:
                        r.role_name ??
                        r.levelUser?.nama_level ??
                        r.role?.nama_level ??
                        r.nama_level ??
                        r.namaLevel ??
                        (typeof r.role === "string" ? r.role : ""), // fallback kalau API belum kirim label
                }));

                setItems(normalized);
                // setStats(dataStats);
            } catch (err) {
                toast({
                    title: "Gagal Memuat Data",
                    description:
                        "Terjadi kesalahan saat mengambil data dari server",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const filteredUserManagement = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return items.filter((item) => {
            const nama = (item.nama ?? "").toLowerCase();
            const email = (item.email ?? "").toLowerCase();
            const telp = String(
                item.nomor_telp ?? item.nomorTelp ?? ""
            ).toLowerCase();
            const roleLabel = (item.role_label ?? "").toLowerCase();
            const status = (item.status ?? "").toLowerCase();
            const foto = (item.foto ?? "").toLowerCase();

            const matchesSearch =
                nama.includes(q) ||
                email.includes(q) ||
                telp.includes(q) ||
                roleLabel.includes(q) ||
                status.includes(q) ||
                foto.includes(q);

            // const matchesStatus = statusFilter === "all" || item?.status === statusFilter
            // const matchesType = typeFilter === "all" || item?.type === typeFilter

            // return matchesSearch && matchesStatus && matchesType

            return matchesSearch;
        });
    }, [items, searchTerm]);

    const totalPages = Math.ceil(
        filteredUserManagement.length / ITEMS_PER_PAGE
    );
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredUserManagement.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    const handleDelete = async (id: string) => {
        try {
            await deleteData("user_managements", id);
            toast({
                title: "Berhasil!",
                description: "Data UserManagement berhasil dihapus.",
            });
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
        router.push("/user-management/create");
    };

    const handleView = (id: string) => {
        router.push(`/user-management/view/${id}`);
    };

    return (
        <>
            {/* NOTEE BREADCUMB DI SESUAIKAN SAMA ROUTE MENU NANTI */}
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                {/* ✅ Perbaikan visibilitas di light mode */}
                <SidebarTrigger
                    className="-ml-1 h-7 w-7 border border-border text-foreground hover:bg-muted hover:text-foreground
                         dark:border-white/30 dark:text-white dark:hover:bg-white/10"
                />
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
                                href="/" // linknya juga diubah ketika sudah ada modul menu
                                className="text-muted-foreground hover:text-foreground"
                            >
                                User
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-foreground">
                                User Management
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col">
                <div className="space-y-6 p-4">
                    <UserManagementHeader onAdd={handleAdd} />
                    <UserManagementStats items={filteredUserManagement ?? []} />

                    <UserManagementFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                    <ResultsInfo
                        total={filteredUserManagement.length}
                        currentPage={currentPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                    <UserManagementTable
                        handleView={handleView}
                        handleDelete={handleDelete}
                        filteredUserManagement={filteredUserManagement}
                    />
                </div>
            </div>
        </>
    );
    // return <UserManagementContents items={items} loading={loading} stats={stats} />;
}
