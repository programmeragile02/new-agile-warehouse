"use client";

import {
    Home,
    Building,
    ChevronRight,
    ArrowLeft,
    ChevronDown,
    Folder as FolderIcon,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    useSidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/lib/contexts/language-context";
import { useEffect, useMemo, useState } from "react";

// Mobile nav (tetap)
import { MobileTabBar } from "@/components/navigation/mobile-tab-bar";
import { MobileMenuDrawer } from "@/components/navigation/mobile-menu-drawer";

/* ===================== CONFIG/API ===================== */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/* ===================== TIPE API & SIDEBAR ===================== */
type ApiNode = {
    id: number | string;
    title: string;
    type?: string | null; // 'group' | 'module' | 'menu' | 'submenu'
    level?: number | null;
    route_path?: string | null;
    icon?: string | null;
    color?: string | null;
    order_number?: number | null;
    children?: ApiNode[];
};

type SidebarLeaf = {
    id: number;
    label: string;
    labelKey?: string;
    href: string;
    icon: any;
};

type SidebarNested = {
    id: string;
    label: string;
    icon: any;
    items: SidebarLeaf[];
};

type SidebarModule = {
    id: string;
    groupId?: string;
    groupName?: string;
    groupColor?: string;
    label: string;
    labelKey?: string;
    icon: any;
    iconBg: string;
    iconColor: string;
    borderColor: string;
    activeBorder: string;
    count?: number;
    description?: string;
    descriptionId?: string;
    items?: SidebarLeaf[];
    nestedItems?: SidebarNested[];
};

/* ===================== ICON HELPER ===================== */
import * as Icons from "lucide-react";
function pascal(s: string) {
    return s
        .replace(/[-_ ]+/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");
}
const FallbackIcon = (Icons as any).Folder ?? FolderIcon;
function resolveIcon(name?: string | null) {
    if (!name) return FallbackIcon;
    const key =
        (name as keyof typeof Icons) || (pascal(name) as keyof typeof Icons);
    return (Icons as any)[key] || FallbackIcon;
}

/* ===================== PERMISSIONS (pakai menu_id) ===================== */
type Perm = { menu_id: number | null; view: boolean };
function buildPermIndex(perms: Perm[]) {
    const byId = new Map<number, boolean>();
    for (const p of perms) if (p.menu_id != null) byId.set(p.menu_id, !!p.view);
    return byId;
}
function canView(menuId: number, idx?: Map<number, boolean>) {
    if (!idx) return true;
    const v = idx.get(menuId);
    return v === undefined ? true : v;
}
function getActiveLevelId(): string | number | undefined {
    try {
        // contoh: payload JWT kamu simpan di LS saat login
        const raw = localStorage.getItem("rvx_user_token_payload");
        if (raw) {
            const p = JSON.parse(raw);
            if (p?.level_id != null) return p.level_id;
        }
    } catch {}
    try {
        // fallback: cari dari perms yang pernah disimpan di LS
        const local = JSON.parse(localStorage.getItem("rvx_perms") || "[]");
        if (
            Array.isArray(local) &&
            local.length &&
            local[0]?.user_level_id != null
        ) {
            return local[0].user_level_id;
        }
    } catch {}
    return undefined;
}

/* ===================== FETCHERS ===================== */
async function fetchMenusTree(params?: {
    product_code?: string;
    include_inactive?: boolean;
    level_id?: string | number; // ← tambah ini
}) {
    const url = new URL(`${API_URL}/menus/tree`);
    if (params?.product_code)
        url.searchParams.set("product_code", params.product_code);
    if (params?.include_inactive) url.searchParams.set("include_inactive", "1");
    if (params?.level_id != null)
        url.searchParams.set("level_id", String(params.level_id)); // ← kirim ke BE

    const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(await res.text());
    const j = await res.json();
    return (Array.isArray(j) ? j : j.data ?? []) as ApiNode[];
}

async function fetchPermsForLevel(levelId: string | number) {
    // Jika punya endpoint filter: `${API_URL}/access_control_matrices?user_level_id=${levelId}`
    const res = await fetch(`${API_URL}/access_control_matrices`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });
    if (!res.ok) return [] as Perm[];
    const j = await res.json();
    const rows = Array.isArray(j) ? j : j.data ?? [];
    return rows.filter(
        (r: any) => String(r.user_level_id) === String(levelId)
    ) as Perm[];
}

/* ===================== NORMALISASI STRUKTUR ===================== */
const defaultIconBg = "bg-muted/40";
const defaultIconColor = "text-muted-foreground";
const defaultBorder = "border-border";

function ntype(
    n: ApiNode
): "group" | "module" | "menu" | "submenu" | "unknown" {
    const t = String(n.type ?? "").toLowerCase();
    if (t === "group" || t === "module" || t === "menu" || t === "submenu")
        return t as any;
    return "unknown";
}

function makeLeaf(
    n: ApiNode,
    permIdx?: Map<number, boolean>
): SidebarLeaf | null {
    const idNum = Number(n.id);
    if (!Number.isFinite(idNum)) return null;
    if (!canView(idNum, permIdx)) return null;
    return {
        id: idNum,
        label: n.title,
        labelKey: n.title,
        href: n.route_path || "/#",
        icon: resolveIcon(n.icon),
    };
}

/**
 * Pemetaan KETAT:
 * Group → Module → (Menu leaf | Menu ber-anak → Submenu leafs)
 * Node yang tidak sesuai level tidak “naik kelas”.
 */
function makeSidebarFromTree(
    roots: ApiNode[],
    perms?: Perm[]
): SidebarModule[] {
    const permIdx = perms ? buildPermIndex(perms) : undefined;
    const byOrder = (a: ApiNode, b: ApiNode) =>
        (a.order_number ?? 0) - (b.order_number ?? 0);

    const groups = (roots || [])
        .filter((r) => ntype(r) === "group")
        .sort(byOrder);
    const modules: SidebarModule[] = [];

    for (const g of groups) {
        const groupId = String(g.id);
        const groupName = g.title;
        const groupColor = g.color || undefined;

        const modNodes = [...(g.children || [])]
            .filter((c) => ntype(c) === "module")
            .sort(byOrder);

        for (const mod of modNodes) {
            const m: SidebarModule = {
                id: String(mod.id),
                label: mod.title,
                icon: resolveIcon(mod.icon),
                iconBg: defaultIconBg,
                iconColor: defaultIconColor,
                borderColor: defaultBorder,
                activeBorder: "border-primary/40",
                items: [],
                nestedItems: [],
            };

            const menuNodes = [...(mod.children || [])]
                .filter((c) => ntype(c) === "menu")
                .sort(byOrder);

            for (const menu of menuNodes) {
                const kids = [...(menu.children || [])].sort(byOrder);
                if (!kids.length) {
                    // menu leaf
                    const leaf = makeLeaf(menu, permIdx);
                    if (leaf) m.items!.push(leaf);
                } else {
                    // menu ber-anak → bucket nested; anak harus submenu (atau menu diperlakukan sbg submenu)
                    const bucket: SidebarNested = {
                        id: String(menu.id),
                        label: menu.title,
                        icon: resolveIcon(menu.icon),
                        items: [],
                    };
                    for (const sub of kids) {
                        const t = ntype(sub);
                        if (t !== "submenu" && t !== "menu") continue;
                        const leaf = makeLeaf(sub, permIdx);
                        if (leaf) bucket.items.push(leaf);
                    }
                    if (bucket.items.length) m.nestedItems!.push(bucket);
                }
            }

            const count =
                (m.items?.length ?? 0) +
                (m.nestedItems?.reduce(
                    (a, ni) => a + (ni.items?.length ?? 0),
                    0
                ) ?? 0);

            if (count > 0) {
                m.count = count;
                (m as any).groupId = groupId;
                (m as any).groupName = groupName;
                (m as any).groupColor = groupColor;
                modules.push(m);
            }
        }
    }

    // urutkan antar module per group (opsional)
    modules.sort((a, b) =>
        a.groupId! < b.groupId!
            ? -1
            : a.groupId! > b.groupId!
            ? 1
            : (a.count ?? 0) - (b.count ?? 0)
    );
    return modules;
}

/* ===== Header kecil untuk Group (UI tetap) ===== */
function GroupHeader({ name, color }: { name: string; color?: string }) {
    return (
        <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: color || "#94a3b8" }}
                />
                <span className="uppercase tracking-wider">{name}</span>
            </div>
        </div>
    );
}

/* ====== Export untuk drawer mobile (diisi runtime) ====== */
export let appSidebarMenuItems: SidebarModule[] = [];

/* ===================== SIDEBAR (UI ORIGINAL) ===================== */
function SharedSidebar() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const { isMobile, state } = useSidebar();

    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [expandedNestedItems, setExpandedNestedItems] = useState<string[]>(
        []
    );
    const [menuItems, setMenuItems] = useState<SidebarModule[]>([]);

    // Load dari API → petakan → simpan
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const levelId = getActiveLevelId(); // ← ambil dari sesi/LS

                // 1) Minta tree. Jika BE support, kirim level_id biar server-side prune.
                const tree = await fetchMenusTree({
                    /* product_code: "RENTVIX", */ level_id: levelId,
                });

                // 2) Siapkan perms untuk client-side prune (jaga-jaga bila BE belum prune)
                let perms: Perm[] = [];
                try {
                    const local = JSON.parse(
                        localStorage.getItem("rvx_perms") || "[]"
                    );
                    if (Array.isArray(local)) {
                        // Normalisasi minimal ke {menu_id, view}
                        perms = local.map((p: any) => ({
                            menu_id: p.menu_id ?? null,
                            view: !!p.view,
                        }));
                    }
                } catch {}
                if ((!perms || perms.length === 0) && levelId != null) {
                    perms = await fetchPermsForLevel(levelId);
                }

                const mapped = makeSidebarFromTree(tree, perms);
                if (alive) {
                    appSidebarMenuItems = mapped; // untuk MobileMenuDrawer
                    setMenuItems(mapped);
                }
            } catch (e) {
                console.error("[Sidebar] load menus error:", e);
                if (alive) {
                    appSidebarMenuItems = [];
                    setMenuItems([]);
                }
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Kelompokkan modul by group (UI logic asli)
    const groups = useMemo(() => {
        const map: Record<
            string,
            { id: string; name: string; color?: string; modules: any[] }
        > = {};
        for (const m of menuItems as any[]) {
            const key = m.groupId ?? m.groupName ?? "0";
            if (!map[key]) {
                map[key] = {
                    id: String(key),
                    name: m.groupName || "Kelompok",
                    color: m.groupColor,
                    modules: [],
                };
            }
            map[key].modules.push(m);
        }
        Object.values(map).forEach((g) =>
            g.modules.sort((a, b) => (a.count ?? 0) - (b.count ?? 0))
        );
        return Object.values(map);
    }, [menuItems]);

    // Auto-select berdasarkan path
    useEffect(() => {
        const found = (() => {
            for (const g of groups) {
                for (const mod of g.modules) {
                    if (
                        mod.items?.some((it: any) =>
                            pathname.startsWith(it.href)
                        )
                    )
                        return { gid: g.id, mid: mod.id };
                    if (
                        mod.nestedItems?.some((ni: any) =>
                            ni.items?.some((sit: any) =>
                                pathname.startsWith(sit.href)
                            )
                        )
                    )
                        return { gid: g.id, mid: mod.id };
                }
            }
            return null;
        })();
        if (found) {
            setSelectedGroup(found.gid);
            setSelectedModule(found.mid);
        }
    }, [pathname, groups]);

    const handleNavigation = (href: string) => {
        router.push(href);
        if (isMobile)
            (
                document.querySelector(
                    '[data-sidebar="trigger"]'
                ) as HTMLButtonElement | null
            )?.click();
    };
    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);
    const toggleNestedItem = (id: string) =>
        setExpandedNestedItems((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    /* ===== Level 3: Submenu ===== */
    if (selectedModule) {
        const group = groups.find((g) => g.id === selectedGroup);
        const module = group?.modules.find((m: any) => m.id === selectedModule);
        if (!module) return null;

        const hasNested =
            Array.isArray(module.nestedItems) && module.nestedItems.length > 0;

        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <SidebarHeader className="border-b border-border/50 p-4 bg-gradient-to-r from-muted/30 to-muted/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedModule(null)}
                            className="p-2 hover:bg-muted/60 rounded-lg"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div
                            className={`p-2.5 rounded-xl ${module.iconBg} shadow-sm`}
                        >
                            <module.icon
                                className={`h-5 w-5 ${module.iconColor}`}
                            />
                        </div>
                        {(!isMobile || state === "expanded") && (
                            <div>
                                <h3 className="font-semibold text-sm">
                                    {module.label ?? module.labelKey ?? "Modul"}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {/* deskripsi opsional */}
                                </p>
                            </div>
                        )}
                    </div>
                </SidebarHeader>

                <SidebarContent className="p-4 flex-1 overflow-y-auto sidebar-scrollbar">
                    {!hasNested ? (
                        <div className="space-y-2">
                            {module.items?.map((item: any) => (
                                <Button
                                    key={item.href}
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 h-12 rounded-xl ${
                                        isActive(item.href)
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "hover:bg-muted/60"
                                    }`}
                                    onClick={() => handleNavigation(item.href)}
                                >
                                    <item.icon
                                        className={`h-4 w-4 ${
                                            isActive(item.href)
                                                ? "text-primary"
                                                : ""
                                        }`}
                                    />
                                    {(!isMobile || state === "expanded") && (
                                        <>
                                            <span className="text-sm font-medium">
                                                {item.label ?? item.labelKey}
                                            </span>
                                            {isActive(item.href) && (
                                                <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                                            )}
                                        </>
                                    )}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {module.nestedItems.map((nestedItem: any) => (
                                <Collapsible
                                    key={nestedItem.id}
                                    open={expandedNestedItems.includes(
                                        nestedItem.id
                                    )}
                                    onOpenChange={() =>
                                        toggleNestedItem(nestedItem.id)
                                    }
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-3 h-12 rounded-xl"
                                        >
                                            <nestedItem.icon className="h-4 w-4" />
                                            {(!isMobile ||
                                                state === "expanded") && (
                                                <>
                                                    <span className="text-sm font-medium flex-1 text-left">
                                                        {nestedItem.label}
                                                    </span>
                                                    <ChevronDown
                                                        className={`h-4 w-4 transition-transform ${
                                                            expandedNestedItems.includes(
                                                                nestedItem.id
                                                            )
                                                                ? "rotate-180"
                                                                : ""
                                                        }`}
                                                    />
                                                </>
                                            )}
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="space-y-1 mt-1">
                                        {nestedItem.items.map(
                                            (subItem: any) => (
                                                <Button
                                                    key={subItem.href}
                                                    variant="ghost"
                                                    className={`w-full justify-start gap-3 h-10 rounded-lg ml-6 ${
                                                        isActive(subItem.href)
                                                            ? "bg-primary/10 text-primary border border-primary/20"
                                                            : "text-muted-foreground hover:bg-muted/40"
                                                    }`}
                                                    onClick={() =>
                                                        handleNavigation(
                                                            subItem.href
                                                        )
                                                    }
                                                >
                                                    <subItem.icon
                                                        className={`h-3.5 w-3.5 ${
                                                            isActive(
                                                                subItem.href
                                                            )
                                                                ? "text-primary"
                                                                : ""
                                                        }`}
                                                    />
                                                    {(!isMobile ||
                                                        state ===
                                                            "expanded") && (
                                                        <>
                                                            <span className="text-xs font-medium">
                                                                {subItem.label ??
                                                                    subItem.labelKey}
                                                            </span>
                                                            {isActive(
                                                                subItem.href
                                                            ) && (
                                                                <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
                                                            )}
                                                        </>
                                                    )}
                                                </Button>
                                            )
                                        )}
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>
                    )}
                </SidebarContent>
            </div>
        );
    }

    /* ===== Level 2: Daftar Modul per Group ===== */
    if (selectedGroup) {
        const group = groups.find((g) => g.id === selectedGroup);
        if (!group) return null;

        const isActive = (href: string) =>
            href === "/" ? pathname === "/" : pathname.startsWith(href);
        const hasActiveInModule = (module: any) =>
            module.items?.some((it: any) => isActive(it.href)) ||
            module.nestedItems?.some((ni: any) =>
                ni.items?.some((sit: any) => isActive(sit.href))
            );

        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <SidebarHeader className="border-b border-border/50 p-4 bg-gradient-to-r from-muted/30 to-muted/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedGroup(null);
                                setSelectedModule(null);
                            }}
                            className="p-2 hover:bg-muted/60 rounded-lg"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="p-2.5 rounded-xl bg-muted/40 shadow-sm">
                            <Building className="h-5 w-5 text-muted-foreground" />
                        </div>
                        {(!isMobile || state === "expanded") && (
                            <div>
                                <h3 className="font-semibold text-sm">
                                    {group.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Pilih modul
                                </p>
                            </div>
                        )}
                    </div>
                </SidebarHeader>

                <SidebarContent className="p-4 flex-1 overflow-y-auto sidebar-scrollbar">
                    <div className="space-y-3">
                        {group.modules.map((module: any) => {
                            const active = hasActiveInModule(module);
                            const totalLeafs =
                                (module.items?.length ?? 0) +
                                (module.nestedItems?.reduce(
                                    (a: number, ni: any) =>
                                        a + (ni.items?.length ?? 0),
                                    0
                                ) ?? 0);

                            return (
                                <Card
                                    key={module.id}
                                    className={`cursor-pointer transition-all group rounded-xl shadow-sm bg-card border-border ${
                                        active
                                            ? `${module.activeBorder} bg-gradient-to-br from-muted/30 to-muted/10`
                                            : `${module.borderColor} hover:bg-gradient-to-br hover:from-muted/20 hover:to-muted/5`
                                    }`}
                                    onClick={() => setSelectedModule(module.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`p-2.5 rounded-xl ${module.iconBg} shadow-sm`}
                                            >
                                                <module.icon
                                                    className={`h-5 w-5 ${module.iconColor}`}
                                                />
                                            </div>
                                            {(!isMobile ||
                                                state === "expanded") && (
                                                <>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-sm truncate">
                                                                {module.label ??
                                                                    module.labelKey}
                                                            </h3>
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs px-2 py-0.5 bg-muted/60 border-0 font-medium"
                                                            >
                                                                {totalLeafs}
                                                            </Badge>
                                                            {active && (
                                                                <div className="w-2 h-2 bg-primary rounded-full" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {/* deskripsi opsional */}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/80 mt-1">
                                                            {totalLeafs} menu
                                                        </p>
                                                    </div>
                                                    <ChevronRight
                                                        className={`h-4 w-4 ${
                                                            active
                                                                ? "text-primary"
                                                                : "text-muted-foreground"
                                                        }`}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </SidebarContent>
            </div>
        );
    }

    /* ===== Level 1: Daftar Group ===== */
    return (
        <div className="flex flex-col h-full bg-background text-foreground">
            <SidebarHeader className="border-b border-border/50 p-4 bg-gradient-to-r from-muted/30 to-muted/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary shadow-lg ring-2 ring-primary/20">
                        <img
                            src="/rentvix-logo.png"
                            alt="RentVix"
                            className="h-7 w-7 object-contain"
                        />
                    </div>
                    {(!isMobile || state === "expanded") && (
                        <div>
                            <h2 className="text-base font-bold tracking-tight">
                                RentVix
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Pro Dashboard
                            </p>
                        </div>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent className="flex-1 overflow-y-auto sidebar-scrollbar">
                <div className="p-4">
                    {/* Dashboard Card */}
                    <Card
                        className={`mb-6 cursor-pointer transition-all rounded-xl shadow-sm bg-card border-border ${
                            usePathname() === "/"
                                ? "border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10"
                                : "hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10"
                        }`}
                        onClick={() => router.push("/")}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 shadow-sm">
                                    <Home className="h-5 w-5 text-primary" />
                                </div>
                                {(!isMobile || state === "expanded") && (
                                    <>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm">
                                                Dashboard
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Ringkasan dan statistik
                                            </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Group Cards */}
                    <div className="space-y-3">
                        {groups.map((g) => {
                            const totalFeatures = g.modules.reduce(
                                (acc: number, m: any) =>
                                    acc +
                                    ((m.items?.length ?? 0) +
                                        (m.nestedItems?.reduce(
                                            (a: number, ni: any) =>
                                                a + (ni.items?.length ?? 0),
                                            0
                                        ) ?? 0)),
                                0
                            );
                            return (
                                <Card
                                    key={g.id}
                                    className="cursor-pointer transition-all group rounded-xl shadow-sm bg-card border-border hover:border-primary/30 hover:bg-gradient-to-br hover:from-muted/20 hover:to-muted/5"
                                    onClick={() => setSelectedGroup(g.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="p-2.5 rounded-xl shadow-sm"
                                                style={{
                                                    backgroundColor:
                                                        (g.color || "#e5e7eb") +
                                                        "33",
                                                }}
                                            >
                                                <Building
                                                    className="h-5 w-5"
                                                    style={{
                                                        color:
                                                            g.color ||
                                                            "#64748b",
                                                    }}
                                                />
                                            </div>
                                            {(!isMobile ||
                                                state === "expanded") && (
                                                <>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-sm truncate">
                                                                {g.name}
                                                            </h3>
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs px-2 py-0.5 bg-muted/60 border-0 font-medium"
                                                            >
                                                                {
                                                                    g.modules
                                                                        .length
                                                                }
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            Kelompok modul
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/80 mt-1">
                                                            {totalFeatures} menu
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </SidebarContent>
        </div>
    );
}

/* ===================== WRAPPERS ===================== */
export function AppSidebar() {
    return (
        <Sidebar
            variant="inset"
            className="border-r border-border/50 bg-background"
        >
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-hidden sidebar-scrollbar">
                    <SharedSidebar />
                </div>
            </div>
        </Sidebar>
    );
}

/** 🔥 Wrapper responsif — otomatis sidebar di desktop & bottom menu di mobile */
export function AppNavigationResponsive({
    children,
}: {
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="min-h-dvh w-full flex">
            {/* Desktop: Sidebar */}
            <div className="hidden lg:block">
                <AppSidebar />
            </div>

            {/* Konten */}
            <div className="flex-1 min-w-0 pb-24 lg:pb-0">{children}</div>

            {/* Mobile: Bottom Tab + Drawer */}
            <MobileTabBar onOpenMenu={() => setOpen(true)} />
            <MobileMenuDrawer
                items={appSidebarMenuItems as any[]}
                open={open}
                setOpen={setOpen}
            />
        </div>
    );
}
