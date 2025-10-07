// src/lib/acl.ts
export type Perm = {
  user_level_id?: number | string | null;
  menu_id?: number | null;
  menu_key?: string | null;
  view?: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  approve?: boolean;
};

export function buildPermIndex(perms: Perm[]) {
  const byId = new Map<number, boolean>();
  const byKey = new Map<string, boolean>();

  for (const p of perms || []) {
    if (p.menu_id != null) byId.set(Number(p.menu_id), !!p.view);
    if (p.menu_key) byKey.set(String(p.menu_key), !!p.view);
  }
  return { byId, byKey };
}

export function canView(menuId: number | null | undefined, idx?: ReturnType<typeof buildPermIndex>) {
  if (!idx) return true;
  if (menuId == null) return true;
  const v = idx.byId.get(Number(menuId));
  return v === undefined ? true : v;
}
