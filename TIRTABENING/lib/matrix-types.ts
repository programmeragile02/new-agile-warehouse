// lib/matrix-types.ts
export type MatrixMenu = {
    id: string;
    parent_id: string | null;
    level: number;
    type: "group" | "module" | "menu";
    title: string;
    icon?: string;
    color?: string;
    route_path?: string;
    order_number?: number;
    is_active?: boolean;
    product_code?: string;
    product_id?: string | null;
    crud_builder_id?: string | null;
};

export type MatrixFeature = {
    id: string;
    feature_code: string;
    name: string;
    description?: string;
    module_name?: string; // "" = global
    item_type: "FEATURE" | "SUBFEATURE";
    parent_id: string | null;
    parent_code?: string;
    is_active: boolean;
    order_number?: number;
    price_addon?: number;
    trial_available?: boolean;
    trial_days?: number | null;
    product_code: string;
};

export type MatrixPayload = {
    menus?: MatrixMenu[];
    features?: MatrixFeature[];
};

// lib/matrix-normalizer.ts
export function toTree(menus: MatrixMenu[]) {
    const byId = new Map<string, MatrixMenu & { children: any[] }>();
    menus.forEach((m) => byId.set(m.id, { ...m, children: [] }));
    const roots: (MatrixMenu & { children: any[] })[] = [];
    byId.forEach((m) => {
        if (m.parent_id && byId.has(m.parent_id)) {
            byId.get(m.parent_id)!.children.push(m);
        } else {
            roots.push(m);
        }
    });
    // urutkan anak berdasarkan order_number lalu title
    const sortFn = (a: any, b: any) =>
        (a.order_number ?? 0) - (b.order_number ?? 0) ||
        a.title.localeCompare(b.title);
    const dfsSort = (nodes: any[]) => {
        nodes.sort(sortFn);
        nodes.forEach((n) => dfsSort(n.children));
    };
    dfsSort(roots);
    return roots;
}
