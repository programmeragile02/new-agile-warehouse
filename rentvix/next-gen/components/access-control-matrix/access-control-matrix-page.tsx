"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AccessControlMatrixHeader,
    AccessControlLevelPicker,
    AccessControlStats,
    AccessControlMatrixFilters,
    AccessControlMatrixTable,
    AccessControlMatrixCardsMobile,
    ResultsInfo,
    type MatrixRow,
    type GroupNode,
    type ModuleNode,
    type MenuNode,
    // kita pakai SubmenuNode juga
} from "./access-control-matrix-page-contents";
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
import {
    fetchData,
    fetchMenusTree,
    saveAccessControlMatrixBulk,
} from "@/lib/api";

/* ====== Types dari API tree ====== */
type ApiMenuNode = {
    id: number | string;
    title: string;
    type?: string; // "group" | "module" | "menu" | "submenu"
    level?: number; // fallback
    children?: ApiMenuNode[];
};

/* ====== Normalisasi boolean ====== */
const asBool = (v: any) => v === true || v === 1 || v === "1";

/* ====== Mapper: pastikan SEMUA id leaf numerik ====== */
type SubmenuNode = { type: "submenu"; id: number; label: string };
type MMenuNode = {
    type: "menu";
    id: number;
    label: string;
    children?: SubmenuNode[];
};
type MModuleNode = {
    type: "module";
    id: number;
    label: string;
    children: Array<MMenuNode | MModuleNode>;
};
type MGroupNode = {
    type: "group";
    id: number;
    label: string;
    children: MModuleNode[];
};

const toNum = (v: number | string): number => Number(String(v).trim());

function mapMenusApiToTreeNodes(apiRoots: ApiMenuNode[]): MGroupNode[] {
    const normalizeType = (
        n: ApiMenuNode
    ): "group" | "module" | "menu" | "submenu" => {
        const t = String(n.type ?? "").toLowerCase();
        if (t === "group" || t === "module" || t === "menu" || t === "submenu")
            return t as any;
        const lvl = typeof n.level === "number" ? n.level : 0;
        if (lvl <= 0) return "group";
        if (lvl === 1) return "module";
        if (lvl === 2) return "menu";
        return "submenu";
    };

    const walk = (
        n: ApiMenuNode
    ): MGroupNode | MModuleNode | MMenuNode | SubmenuNode => {
        const t = normalizeType(n);
        const id = toNum(n.id);
        const label = String(n.title ?? "Menu");

        if (t === "submenu") return { type: "submenu", id, label };

        if (t === "menu") {
            const children = Array.isArray(n.children)
                ? n.children.map(walk)
                : [];
            const subs: SubmenuNode[] = [];
            for (const c of children) {
                const ct = (c as any).type;
                if (ct === "submenu") subs.push(c as SubmenuNode);
                else if (ct === "menu")
                    subs.push({
                        type: "submenu",
                        id: (c as any).id,
                        label: (c as any).label,
                    });
            }
            return {
                type: "menu",
                id,
                label,
                children: subs.length ? subs : undefined,
            };
        }

        const kids = Array.isArray(n.children) ? n.children.map(walk) : [];
        if (t === "group")
            return {
                type: "group",
                id,
                label,
                children: kids.filter(
                    (k) => (k as any).type === "module"
                ) as MModuleNode[],
            };
        if (t === "module")
            return {
                type: "module",
                id,
                label,
                children: kids as Array<MMenuNode | MModuleNode>,
            };
        return { type: "submenu", id, label };
    };

    const roots = apiRoots.map(walk);
    return roots.filter((r) => (r as any).type === "group") as MGroupNode[];
}

const ITEMS_PER_PAGE = 9999;

export function AccessControlMatrixPage() {
    const { toast } = useToast();

    const [levels, setLevels] = useState<
        { id: string | number; nama_level: string; status?: string }[]
    >([]);
    const [selectedLevelId, setSelectedLevelId] = useState<
        string | number | null
    >(null);

    const [rawMatrix, setRawMatrix] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [tree, setTree] = useState<MGroupNode[]>([]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    useEffect(() => {
        (async () => {
            try {
                const [lvls, matrix, menus] = await Promise.all([
                    fetchData("level_users"),
                    fetchData("access_control_matrices"),
                    fetchMenusTree(),
                ]);

                const normalizedLevels = (lvls || []).map((x: any) => ({
                    id: x.id,
                    nama_level: x.nama_level ?? x.namaLevel ?? "Level",
                    status: x.status,
                }));

                setLevels(normalizedLevels);
                setRawMatrix(Array.isArray(matrix) ? matrix : []);
                setTree(
                    mapMenusApiToTreeNodes(Array.isArray(menus) ? menus : [])
                );

                const firstActive = normalizedLevels.find(
                    (l: any) => String(l.status ?? "").toLowerCase() === "aktif"
                );
                setSelectedLevelId(
                    firstActive?.id ?? normalizedLevels[0]?.id ?? null
                );
            } catch (err: any) {
                toast({
                    title: "Gagal Memuat Data",
                    description: String(
                        err?.message ??
                            "Terjadi kesalahan saat mengambil data dari server"
                    ),
                    variant: "destructive",
                });
            }
        })();
    }, [toast]);

    // Kumpulkan semua leaf (menu tanpa anak / setiap submenu)
    const allLeaves = useMemo(() => {
        const res: { id: number; label: string }[] = [];
        const walk = (
            nodes: Array<MGroupNode | MModuleNode | MMenuNode | SubmenuNode>
        ) => {
            for (const n of nodes) {
                const t = (n as any).type;
                if (t === "submenu") {
                    res.push({ id: (n as any).id, label: (n as any).label });
                    continue;
                }
                if (t === "menu") {
                    const m = n as MMenuNode;
                    if (!m.children?.length)
                        res.push({ id: m.id, label: m.label });
                    else
                        m.children.forEach((sm) =>
                            res.push({ id: sm.id, label: sm.label })
                        );
                    continue;
                }
                const ch = (n as any).children as any[] | undefined;
                if (ch?.length) walk(ch);
            }
        };
        walk(tree as any[]);
        return res;
    }, [tree]);

    // rowsAll: cocokkan KE DB pakai menu_id saja
    const rowsAll: MatrixRow[] = useMemo(() => {
        const mapById: Record<string, any> = {};
        for (const r of rawMatrix) {
            if (String(r.user_level_id) !== String(selectedLevelId)) continue;
            const key = r.menu_id ?? r.menuId;
            if (key == null) continue;
            mapById[String(key)] = r;
        }
        return allLeaves.map((m) => {
            const found = mapById[String(m.id)] ?? {};
            return {
                id: m.id,
                label: m.label,
                view: asBool(found.view),
                add: asBool(found.add),
                edit: asBool(found.edit),
                delete: asBool(found.delete),
                approve: asBool(found.approve),
            } as MatrixRow;
        });
    }, [rawMatrix, selectedLevelId, allLeaves]);

    // tampilan tabel = rowsVisible (boleh difilter)
    const rowsVisible = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return q
            ? rowsAll.filter((r) => r.label.toLowerCase().includes(q))
            : rowsAll;
    }, [rowsAll, searchTerm]);

    // statistik dihitung dari rowsAll (bukan terfilter)
    const stats = useMemo(() => {
        const totalMenus = rowsAll.length;
        return {
            totalMenus,
            viewCount: rowsAll.filter((r) => r.view).length,
            addCount: rowsAll.filter((r) => r.add).length,
            editCount: rowsAll.filter((r) => r.edit).length,
            deleteCount: rowsAll.filter((r) => r.delete).length,
            approveCount: rowsAll.filter((r) => r.approve).length,
        };
    }, [rowsAll]);

    // helper upsert lokal (pakai menu_id)
    const upsertOne = (
        draft: any[],
        id: number | string,
        key: keyof Omit<MatrixRow, "id" | "label">,
        val: boolean
    ) => {
        const idx = draft.findIndex(
            (x) =>
                String(x.user_level_id) === String(selectedLevelId) &&
                String(x.menu_id ?? x.menuId) === String(id)
        );
        if (idx === -1) {
            draft.push({
                user_level_id: selectedLevelId,
                menu_id: Number(id),
                view: false,
                add: false,
                edit: false,
                delete: false,
                approve: false,
                [key]: val,
            });
        } else {
            draft[idx] = { ...draft[idx], [key]: val };
        }
    };

    const onToggleRow = (
        id: MatrixRow["id"],
        key: keyof Omit<MatrixRow, "id" | "label">,
        val: boolean
    ) => {
        setRawMatrix((prev) => {
            const d = [...prev];
            upsertOne(d, id, key, val);
            return d;
        });
    };

    const onToggleAllColumn = (
        key: keyof Omit<MatrixRow, "id" | "label">,
        val: boolean
    ) => {
        setRawMatrix((prev) => {
            const d = [...prev];
            for (const r of rowsVisible) upsertOne(d, r.id, key, val);
            return d;
        });
    };

    // toggle banyak (untuk parent)
    const onToggleMany = (
        ids: Array<number | string>,
        key: keyof Omit<MatrixRow, "id" | "label">,
        val: boolean
    ) => {
        setRawMatrix((prev) => {
            const d = [...prev];
            for (const id of ids) upsertOne(d, id, key, val);
            return d;
        });
    };

    // SAVE → kirim rowsAll dan pakai snapshot balik
    async function handleSaveLevel() {
        if (!selectedLevelId || !rowsAll.length) return;
        const res = await saveAccessControlMatrixBulk(
            String(selectedLevelId),
            rowsAll
        );
        if (!res?.success)
            throw new Error(res?.message || "Gagal menyimpan izin (bulk).");
        if (Array.isArray(res.data)) {
            setRawMatrix(res.data); // snapshot server → re-render & stats update
        } else {
            const fresh = await fetchData("access_control_matrices");
            setRawMatrix(Array.isArray(fresh) ? fresh : []);
        }
    }

    async function handleResetLevel() {
        setSearchTerm("");
        setExpanded({});
        const fresh = await fetchData("access_control_matrices");
        setRawMatrix(Array.isArray(fresh) ? fresh : []);
    }

    return (
        <>
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <SidebarTrigger className="-ml-1 h-7 w-7 border border-border" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb className="min-w-0">
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
                        <BreadcrumbItem className="truncate">
                            <BreadcrumbPage className="text-foreground">
                                Access Control Matrix
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col">
                <div className="space-y-4 md:space-y-6 p-3 md:p-4">
                    <AccessControlMatrixHeader
                        onAdd={() => {}}
                        onSave={handleSaveLevel}
                        onReset={handleResetLevel}
                    />
                    <AccessControlLevelPicker
                        levels={levels}
                        selectedLevelId={selectedLevelId}
                        setSelectedLevelId={setSelectedLevelId}
                    />
                    <AccessControlStats
                        totalMenus={stats.totalMenus}
                        viewCount={stats.viewCount}
                        addCount={stats.addCount}
                        editCount={stats.editCount}
                        deleteCount={stats.deleteCount}
                        approveCount={stats.approveCount}
                    />
                    <ResultsInfo
                        total={rowsVisible.length}
                        currentPage={1}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                    <AccessControlMatrixFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />

                    <div className="hidden md:block">
                        <AccessControlMatrixTable
                            rows={rowsVisible as MatrixRow[]}
                            tree={tree as unknown as GroupNode[]}
                            expanded={expanded}
                            setExpanded={setExpanded}
                            onToggleRow={onToggleRow}
                            onToggleAllColumn={onToggleAllColumn}
                            onToggleMany={onToggleMany}
                        />
                    </div>

                    <div className="md:hidden">
                        <AccessControlMatrixCardsMobile
                            tree={tree as unknown as GroupNode[]}
                            rows={rowsVisible as MatrixRow[]}
                            onToggleRow={onToggleRow}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
