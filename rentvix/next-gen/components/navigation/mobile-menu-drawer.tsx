"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, ChevronDown, Building } from "lucide-react";

/* ====== Types ====== */
type AnyIcon = React.ComponentType<any>;
type MenuItem = {
  id?: string;
  label?: string;
  labelKey?: string;
  href?: string;
  icon?: AnyIcon;
};
type Nested = {
  id: string;
  label?: string;
  labelKey?: string;
  icon?: AnyIcon;
  items: MenuItem[];
};
type Module = {
  id: string;
  label?: string;
  labelKey?: string;
  icon?: AnyIcon;
  iconBg?: string;
  iconColor?: string;
  description?: string;
  descriptionId?: string;
  count?: number;
  items?: MenuItem[];
  nestedItems?: Nested[];
};
type GroupRow = {
  id?: string;
  groupId?: string;
  groupName?: string;
  groupColor?: string;
};

export function MobileMenuDrawer(props: {
  /** Boleh array module, atau object yang punya field 'items' */
  items?: unknown;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { open, setOpen } = props;

  /** ==== Normalisasi 'items' agar selalu berupa array Module ==== */
  const list: (Module & GroupRow)[] = React.useMemo(() => {
    const raw = props.items as any;

    if (Array.isArray(raw)) return raw.filter(Boolean);

    // dukung bentuk { items: [...] }
    if (raw && Array.isArray(raw.items)) return raw.items.filter(Boolean);

    // dukung bentuk { data: [...] }
    if (raw && Array.isArray(raw.data)) return raw.data.filter(Boolean);

    // dukung fungsi yang mengembalikan array
    if (typeof raw === "function") {
      try {
        const v = raw();
        if (Array.isArray(v)) return v.filter(Boolean);
        if (v && Array.isArray(v.items)) return v.items.filter(Boolean);
        if (v && Array.isArray(v.data)) return v.data.filter(Boolean);
      } catch {}
    }

    return [];
  }, [props.items]);

  const router = useRouter();
  const pathname = usePathname();

  /* ---- Normalisasi group → modules ---- */
  const groups = React.useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; color?: string; modules: Module[] }
    >();

    for (const m of list) {
      const gid = String((m as any).groupId ?? (m as any).groupName ?? "0");
      const name = String((m as any).groupName ?? "Kelompok");
      if (!map.has(gid)) {
        map.set(gid, {
          id: gid,
          name,
          color: (m as any).groupColor,
          modules: [],
        });
      }
      map.get(gid)!.modules.push(m);
    }
    for (const g of map.values()) {
      g.modules.sort((a, b) => (a.count ?? 0) - (b.count ?? 0));
    }
    return Array.from(map.values());
  }, [list]);

  /* ---- Navigasi bertingkat (stack) ---- */
  type Crumb =
    | { type: "group"; id: string }
    | { type: "module"; id: string; groupId: string };

  const [stack, setStack] = React.useState<Crumb[]>([]);
  const current = stack[stack.length - 1];

  const isActive = (href?: string) =>
    href
      ? href === "/"
        ? pathname === "/"
        : pathname.startsWith(href)
      : false;

  const go = (href?: string) => {
    if (!href) return;
    router.push(href);
    setOpen(false);
  };
  const goBack = () => setStack((s) => s.slice(0, -1));

  /* ---- Entity terpilih ---- */
  const currentGroup = React.useMemo(() => {
    if (!current || current.type !== "group") return null;
    return groups.find((g) => g.id === current.id) || null;
  }, [current, groups]);

  const currentModule = React.useMemo(() => {
    if (!current || current.type !== "module") return null;
    const g = groups.find((gg) => gg.id === current.groupId);
    return g?.modules.find((m) => m.id === current.id) || null;
  }, [current, groups]);

  /* ---- State expand nestedItems ---- */
  const [openNestMap, setOpenNestMap] = React.useState<Record<string, boolean>>(
    {}
  );
  const toggleNest = (id: string) =>
    setOpenNestMap((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));

  const norm = (s?: string) =>
    String(s ?? "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();
  const itemKey = (it: Partial<MenuItem>) =>
    norm(it.id || it.href || it.label || it.labelKey);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="lg:hidden max-h[80vh] max-h-[80vh] pb-[env(safe-area-inset-bottom)] bg-background text-foreground">
        {/* Header */}
        <DrawerHeader className="border-b px-4 py-3">
          <div className="flex items-center gap-3">
            {stack.length > 0 && (
              <button
                onClick={goBack}
                className="shrink-0 rounded-lg p-2 hover:bg-muted/60 text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary shadow ring-2 ring-primary/20">
                <Image
                  src="/rentvix-logo.png"
                  alt="RentVix"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div className="leading-tight">
                <DrawerTitle className="text-sm font-semibold text-foreground">
                  {stack.length === 0 && "RentVix"}
                  {currentGroup && currentGroup.name}
                  {currentModule &&
                    (currentModule.label || currentModule.labelKey || "Modul")}
                </DrawerTitle>
                <div className="text-[11px] text-muted-foreground">
                  {stack.length === 0 && "Pro Dashboard"}
                  {currentGroup && "Pilih modul"}
                  {currentModule &&
                    (currentModule.descriptionId ||
                      currentModule.description ||
                      "Fitur modul")}
                </div>
              </div>
            </div>
          </div>
        </DrawerHeader>

        {/* Content */}
        <div className="px-4 pb-4 pt-3 overflow-y-auto space-y-3">
          {/* Level 0: GROUPS */}
          {stack.length === 0 && (
            <div className="space-y-3">
              {/* Shortcut Dashboard */}
              <button
                onClick={() => go("/")}
                className={`w-full rounded-xl border bg-card text-card-foreground p-3 shadow-sm flex items-center gap-3 transition ${
                  isActive("/")
                    ? "border-primary/40 bg-primary/5"
                    : "hover:border-primary/30 hover:bg-muted/40"
                }`}
              >
                <span className="p-2.5 rounded-xl bg-primary/15">
                  <Building className="h-5 w-5 text-primary" />
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Dashboard</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ringkasan dan statistik
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Empty state */}
              {groups.length === 0 && (
                <div className="text-xs text-muted-foreground px-1">
                  Tidak ada menu. Pastikan <code>appSidebarMenuItems</code>{" "}
                  adalah array module atau objek dengan field <code>items</code>
                  /<code>data</code>.
                </div>
              )}

              {/* Kartu Group */}
              {groups.map((g) => {
                const totalFeatures = g.modules.reduce(
                  (acc, m) =>
                    acc +
                    ((m.items?.length ?? 0) + (m.nestedItems?.length ?? 0)),
                  0
                );
                return (
                  <button
                    key={g.id}
                    onClick={() => setStack([{ type: "group", id: g.id }])}
                    className="w-full rounded-xl border bg-card text-card-foreground p-3 shadow-sm flex items-center gap-3 hover:border-primary/30 hover:bg-muted/40 transition"
                  >
                    <span
                      className="p-2.5 rounded-xl shadow-sm"
                      style={{ backgroundColor: (g.color || "#e5e7eb") + "33" }}
                    >
                      <Building
                        className="h-5 w-5"
                        style={{ color: g.color || "#64748b" }}
                      />
                    </span>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {g.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[11px] px-2 py-0.5 bg-muted/60 border-0"
                        >
                          {g.modules.length}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        Kelompok modul
                      </div>
                      <div className="text-xs text-muted-foreground/80 mt-0.5">
                        {totalFeatures} fitur
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Level 1: MODULES IN GROUP */}
          {currentGroup && (
            <div className="space-y-3">
              {currentGroup.modules.map((mod) => {
                const Icon = mod.icon ?? (() => null);
                const active =
                  mod.items?.some((it) => isActive(it.href)) ||
                  mod.nestedItems?.some((ni) =>
                    ni.items?.some((sit) => isActive(sit.href))
                  );
                return (
                  <button
                    key={mod.id}
                    onClick={() =>
                      setStack((s) => [
                        ...s,
                        {
                          type: "module",
                          id: mod.id,
                          groupId: currentGroup.id,
                        },
                      ])
                    }
                    className={`w-full rounded-xl border bg-card text-card-foreground p-3 shadow-sm flex items-center gap-3 transition ${
                      active
                        ? "border-primary/40 bg-gradient-to-br from-muted/30 to-muted/10"
                        : "hover:border-primary/30 hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`p-2.5 rounded-xl ${
                        mod.iconBg ?? "bg-muted/40"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${mod.iconColor ?? ""}`} />
                    </span>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {mod.label ?? mod.labelKey ?? "Modul"}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[11px] px-2 py-0.5 bg-muted/60 border-0"
                        >
                          {mod.count ??
                            mod.items?.length ??
                            mod.nestedItems?.length ??
                            0}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {mod.descriptionId || mod.description || "Pilih fitur"}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Level 2: ITEMS / NESTED IN MODULE */}
          {currentModule && (
            <div className="space-y-3">
              {(() => {
                const nestedKeys = new Set<string>();
                (currentModule.nestedItems ?? []).forEach((ni) =>
                  (ni.items ?? []).forEach((sit) =>
                    nestedKeys.add(itemKey(sit))
                  )
                );
                const topItems = (currentModule.items ?? []).filter(
                  (it) => !nestedKeys.has(itemKey(it))
                );

                return (
                  <>
                    {topItems.length > 0 && (
                      <div className="space-y-1">
                        {topItems.map((it) => {
                          const Icon = it.icon ?? (() => null);
                          return (
                            <Button
                              key={it.href ?? it.id ?? it.label}
                              variant="ghost"
                              className={`w-full justify-start h-11 rounded-lg text-foreground ${
                                isActive(it.href)
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "hover:bg-muted/60"
                              }`}
                              onClick={() => go(it.href)}
                            >
                              <Icon className="h-4 w-4 mr-2" />
                              <span className="text-sm">
                                {it.label ?? it.labelKey}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    {(currentModule.nestedItems ?? []).map((ni) => {
                      const NIcon = ni.icon ?? (() => null);
                      const openNest = openNestMap[ni.id] ?? true;
                      return (
                        <div key={ni.id} className="rounded-xl border p-2">
                          <button
                            className="w-full flex items-center gap-2 text-left text-foreground hover:bg-muted/40 rounded-lg px-2 py-1"
                            onClick={() => toggleNest(ni.id)}
                          >
                            <NIcon className="h-4 w-4" />
                            <span className="text-sm font-medium flex-1">
                              {ni.label ?? ni.labelKey ?? "Sub modul"}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                openNest ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {openNest && (
                            <div className="mt-2 space-y-1">
                              {(ni.items ?? []).map((sit, i) => {
                                const SIcon = sit.icon ?? (() => null);
                                const key = (sit.id ??
                                  sit.href ??
                                  `${i}`) as string;
                                return (
                                  <Button
                                    key={key}
                                    variant="ghost"
                                    className={`w-full justify-start h-10 rounded-lg pl-6 text-foreground ${
                                      isActive(sit.href)
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "hover:bg-muted/60"
                                    }`}
                                    onClick={() => go(sit.href)}
                                  >
                                    <SIcon className="h-4 w-4 mr-2" />
                                    <span className="text-sm">
                                      {sit.label ?? sit.labelKey}
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer close button */}
        <div className="p-3">
          <DrawerClose asChild>
            <Button className="w-full" variant="secondary">
              Tutup
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
