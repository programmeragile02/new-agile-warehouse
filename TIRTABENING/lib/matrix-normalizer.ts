import type { MatrixMenu } from "./matrix-types";

export function toTree(menus: MatrixMenu[]) {
    const byId = new Map<string, MatrixMenu & { children: any[] }>();
    menus.forEach((m) => byId.set(m.id, { ...m, children: [] }));

    const roots: (MatrixMenu & { children: any[] })[] = [];
    const attach = (m: MatrixMenu & { children: any[] }) => {
        if (m.parent_id && byId.has(m.parent_id)) {
            byId.get(m.parent_id)!.children.push(m);
        } else {
            roots.push(m);
        }
    };
    byId.forEach(attach);

    const sortFn = (a: any, b: any) =>
        (a.order_number ?? 0) - (b.order_number ?? 0) ||
        String(a.title).localeCompare(String(b.title));

    const dfs = (nodes: any[]) => {
        nodes.sort(sortFn);
        nodes.forEach((n) => dfs(n.children));
    };
    dfs(roots);
    return roots;
}
