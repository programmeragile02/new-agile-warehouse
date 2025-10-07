"use client";

import { useEffect, useMemo, useState } from "react";
import {
    LevelUserHeader,
    LevelUserFilters,
    LevelUserTable,
    ResultsInfo,
    LevelUserStats,
    LevelUserCardsMobile, // ⬅️ tambahkan ini
} from "./level-user-page-contents";
import { deleteData, fetchData, fetchStats } from "@/lib/api";
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

export function LevelUserPage() {
    const router = useRouter();
    const [items, setItems] = useState<Record<string, any>[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [dataItems, dataStats] = await Promise.all([
                    fetchData("level_users"),
                    fetchStats("level_users"),
                ]);

                setItems(Array.isArray(dataItems) ? dataItems : []);
                setStats(dataStats ?? null);
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

    const filteredLevelUser = useMemo(() => {
        return items.filter((item) => {
            const nama = String(
                item.nama_level ?? item.namaLevel ?? ""
            ).toLowerCase();
            const desk = String(item.deskripsi ?? "").toLowerCase();
            const stat = String(item.status ?? "").toLowerCase();
            const q = searchTerm.toLowerCase();
            return nama.includes(q) || desk.includes(q) || stat.includes(q);
        });
    }, [items, searchTerm]);

    const totalPages =
        Math.ceil(filteredLevelUser.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredLevelUser.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    const handleDelete = async (id: string) => {
        try {
            await deleteData("level_users", id);
            toast({
                title: "Berhasil!",
                description: "Data LevelUser berhasil dihapus.",
            });
            setItems((prev) =>
                prev.filter((item) => String(item.id) !== String(id))
            );
        } catch (error: any) {
            toast({
                title: "Gagal menghapus",
                description: error.message || "Terjadi kesalahan",
                variant: "destructive",
            });
        }
    };

    const handleAdd = () => {
        router.push("/level-user/create");
    };

    const handleView = (id: string) => {
        router.push(`/level-user/view/${id}`);
    };

    return (
        <>
            {/* Breadcrumb */}
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                {/* ⬇️ Perbaikan agar terlihat di light mode */}
                <SidebarTrigger className="-ml-1 h-7 w-7 border border-border text-foreground hover:bg-accent hover:text-foreground dark:border-white/30" />
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
                                href="/"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                User
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-foreground">
                                Level User
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col">
                <div className="space-y-6 p-4">
                    <LevelUserHeader onAdd={handleAdd} />

                    <LevelUserStats items={items} stats={stats} />

                    <LevelUserFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />

                    <ResultsInfo
                        total={filteredLevelUser.length}
                        currentPage={currentPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />

                    {/* ⬇️ Desktop: tabel (tetap sama), Mobile: kartu */}
                    <div className="hidden md:block">
                        <LevelUserTable
                            handleView={handleView}
                            handleDelete={handleDelete}
                            filteredLevelUser={paginatedItems}
                        />
                    </div>

                    <div className="md:hidden">
                        <LevelUserCardsMobile
                            handleView={handleView}
                            handleDelete={handleDelete}
                            filteredLevelUser={paginatedItems}
                        />
                    </div>

                    {/* Pagination sederhana */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 pb-4">
                            <button
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <div className="flex gap-1">
                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                ).map((page) => (
                                    <button
                                        key={page}
                                        className={`w-10 inline-flex items-center justify-center whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium shadow-sm ${
                                            currentPage === page
                                                ? "bg-primary text-primary-foreground"
                                                : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                                onClick={() =>
                                    setCurrentPage((p) =>
                                        Math.min(totalPages, p + 1)
                                    )
                                }
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
