// lib/acl.ts
import "server-only";
import { db } from "@/lib/db";
import { getUserSessionOrNull } from "@/lib/tenant-context";

export type AclAction = "view" | "add" | "edit" | "delete";

function normPath(p: string) {
    try {
        let s = (p || "").trim();
        if (!s.startsWith("/")) s = "/" + s;
        s = s.split("#")[0].split("?")[0];
        if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
        return s;
    } catch {
        return "/";
    }
}

/** Pastikan AppPermission ada untuk route path ini; kalau belum, buat dari mst_menus */
export async function resolvePermissionIdByPath(
    path: string
): Promise<string | null> {
    const prisma = await db();
    const p = normPath(path);

    const menu = await prisma.mstMenu.findFirst({
        where: { isActive: true, routePath: p },
        select: { id: true, title: true, parentId: true, productCode: true },
    });
    if (!menu) return null;

    let parentTitle: string | null = null;
    if (menu.parentId) {
        const parent = await prisma.mstMenu.findUnique({
            where: { id: menu.parentId },
            select: { title: true },
        });
        parentTitle = parent?.title ?? null;
    }

    const perm = await prisma.appPermission.upsert({
        where: { menuId: menu.id },
        update: {
            menuTitle: menu.title,
            productCode: menu.productCode ?? undefined,
            category: parentTitle ?? undefined,
            isActive: true,
        },
        create: {
            menuId: menu.id,
            menuTitle: menu.title,
            productCode: menu.productCode ?? undefined,
            category: parentTitle ?? undefined,
            isActive: true,
        },
        select: { id: true },
    });

    return perm?.id ?? null;
}

/** Cek izin user current untuk path + aksi. Semua role tunduk ke matrix. */
export async function checkAclForCurrentUser(
    path: string,
    action: AclAction
): Promise<boolean> {
    const prisma = await db();
    const session = await getUserSessionOrNull();
    if (!session) return false;

    const roleName = String(session.role || "").toUpperCase();

    // Temukan AppRole yang namanya sama (case-insensitive) dgn role user (ADMIN/PETUGAS/WARGA)
    const appRole = await prisma.appRole.findFirst({
        where: { name: roleName },
        select: { id: true },
    });
    if (!appRole) return false;

    const permissionId = await resolvePermissionIdByPath(path);
    if (!permissionId) return false;

    const link = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: appRole.id, permissionId } },
        select: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    });
    if (!link) return false;

    switch (action) {
        case "view":
            return !!link.canView;
        case "add":
            return !!link.canAdd;
        case "edit":
            return !!link.canEdit;
        case "delete":
            return !!link.canDelete;
        default:
            return false;
    }
}

/** Lempar 403 kalau tidak punya izin */
export async function assertAclOrThrow(path: string, action: AclAction) {
    const ok = await checkAclForCurrentUser(path, action);
    if (!ok) {
        const e = new Error(
            "FORBIDDEN: you don't have permission for this action"
        );
        // @ts-ignore
        e.statusCode = 403;
        throw e;
    }
}
