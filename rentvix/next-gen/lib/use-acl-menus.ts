// src/lib/hooks/use-acl-menus.ts
"use client";

import { useEffect, useState } from "react";
import { fetchMenusTree, fetchPermsForLevel } from "@/lib/api";
import { buildPermIndex, canView, type Perm } from "@/lib/acl";
import * as Icons from "lucide-react";

type ApiNode = {
    id: number | string;
    title: string;
    type?: "group" | "module" | "menu" | "submenu";
    level?: number | null;
    route_path?: string | null;
    icon?: string | null;
    color?: string | null;
    order_number?: number | null;
    children?: ApiNode[];
};

function pascal(s: string) {
    return s
        .replace(/[-_ ]+/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");
}
function resolveIcon(name?: string | null) {
    if (!name) return Icons.Folder;
    const key =
        (name as keyof typeof Icons) || (pascal(name) as keyof typeof Icons);
    // @ts-ignore
    return Icons[key] || Icons.Folder;
}

const defaultIconBg = "bg-muted/40";
const defaultIconColor = "text-muted-foreground";
const defaultBorder = "border-border";

export function useAclMenus(opts: {
    productCode?: string;
    levelId?: number | string;
}) {
    const { productCode, levelId } = opts;
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);

                const [tree, perms] = await Promise.all([
                    fetchMenusTree({
                        product_code: productCode,
                        level_id: levelId, // <-- kirim ke server untuk prune
                    }),
                    levelId != null
                        ? fetchPermsForLevel(levelId)
                        : Promise.resolve([]),
                ]);

                // FE fallback prune (jaga-jaga kalau server tidak prune submenu/variasi)
                const idx = buildPermIndex(perms as Perm[]);
                const mapped = mapTreeToSidebarItems(tree as ApiNode[], idx);

                if (alive) setItems(mapped);
            } catch (e) {
                if (alive) setItems([]);
                console.error("[useAclMenus] error", e);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [productCode, levelId]);

    return { loading, items };
}

function normalizeType(n: ApiNode): "group" | "module" | "menu" {
    const t = String(n.type ?? "").toLowerCase();
    if (t === "group" || t === "module" || t === "menu") return t as any;
    const lvl = typeof n.level === "number" ? n.level : 1;
    return lvl <= 1 ? "group" : lvl === 2 ? "module" : "menu";
}

function mapTreeToSidebarItems(
    roots: ApiNode[],
    idx: ReturnType<typeof buildPermIndex>
) {
    type Module = any;
    type Group = {
        id: string;
        name: string;
        color?: string;
        modules: Module[];
    };
    const groups: Group[] = [];

    const pushNodeIntoGroup = (group: Group, node: ApiNode) => {
        const t = normalizeType(node);
        // module/submodule kontainer
        const Icon = resolveIcon(node.icon);
        const mod: any = {
            id: String(node.id),
            label: node.title,
            icon: Icon,
            iconBg: defaultIconBg,
            iconColor: defaultIconColor,
            borderColor: defaultBorder,
            activeBorder: "border-primary/40",
            items: [] as any[],
            nestedItems: [] as any[],
        };

        const menus: ApiNode[] = [];
        const subs: ApiNode[] = [];
        for (const ch of node.children || []) {
            const ct = normalizeType(ch);
            if (ct === "menu") menus.push(ch);
            else subs.push(ch);
        }

        for (const m of menus) {
            const idNum = Number(m.id);
            if (!canView(idNum, idx)) continue; // FE prune ensure
            mod.items.push({
                id: idNum,
                label: m.title,
                labelKey: m.title,
                href: m.route_path || "/#",
                icon: resolveIcon(m.icon),
            });
        }

        for (const sm of subs) {
            const nested = {
                id: String(sm.id),
                label: sm.title,
                icon: resolveIcon(sm.icon),
                items: [] as any[],
            };
            for (const ch of sm.children || []) {
                if (normalizeType(ch) !== "menu") continue;
                const idNum = Number(ch.id);
                if (!canView(idNum, idx)) continue; // FE prune ensure
                nested.items.push({
                    id: idNum,
                    label: ch.title,
                    labelKey: ch.title,
                    href: ch.route_path || "/#",
                    icon: resolveIcon(ch.icon),
                });
            }
            if (nested.items.length) mod.nestedItems.push(nested);
        }

        if (
            (mod.items.length ?? 0) > 0 ||
            mod.nestedItems.some((ni: any) => (ni.items?.length ?? 0) > 0)
        ) {
            group.modules.push(mod);
        }
    };

    for (const root of roots || []) {
        const t = normalizeType(root);
        if (t !== "group") {
            const g: Group = {
                id: "ungrouped",
                name: "Ungrouped",
                color: "#94a3b8",
                modules: [],
            };
            groups.push(g);
            pushNodeIntoGroup(g, root);
        } else {
            const g: Group = {
                id: String(root.id),
                name: root.title,
                color: root.color || undefined,
                modules: [],
            };
            groups.push(g);
            for (const ch of root.children || []) pushNodeIntoGroup(g, ch);
        }
    }

    // hitung count & urut
    groups.forEach((g) => {
        g.modules = g.modules
            .map((m) => ({
                ...m,
                count:
                    (m.items?.length ?? 0) +
                    (m.nestedItems?.reduce(
                        (a: number, ni: any) => a + (ni.items?.length ?? 0),
                        0
                    ) ?? 0),
            }))
            .sort((a: any, b: any) => (a.count ?? 0) - (b.count ?? 0));
    });

    return groups.flatMap((g) =>
        g.modules.map((m) => ({
            ...m,
            groupId: g.id,
            groupName: g.name,
            groupColor: g.color,
        }))
    );
}
