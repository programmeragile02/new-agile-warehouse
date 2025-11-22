// app/api/acl/debug/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserSessionOrNull } from "@/lib/tenant-context";

function normPath(p: string) {
    if (!p) return "/";
    let s = p.trim();
    if (!s.startsWith("/")) s = "/" + s;
    s = s.split("#")[0].split("?")[0];
    if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
    return s;
}

// helper: convert any BigInt to string recursively
function safe(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === "bigint") return obj.toString();
    if (Array.isArray(obj)) return obj.map(safe);
    if (typeof obj === "object") {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) out[k] = safe(v);
        return out;
    }
    return obj;
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const path = normPath(url.searchParams.get("path") || "/");

        const prisma = await db();
        const session = await getUserSessionOrNull();
        const roleName =
            String(session?.role || "").toUpperCase() || "(unknown)";

        const role = await prisma.appRole.findFirst({
            where: { name: { equals: roleName, mode: "insensitive" } },
            select: { id: true, name: true },
        });

        const menu = await prisma.mstMenu.findFirst({
            where: { isActive: true, routePath: path },
            select: { id: true, title: true, routePath: true, parentId: true },
        });

        // note: permission may not exist yet; resolvePermissionIdByPath would upsert
        const permission = menu
            ? await prisma.appPermission.findUnique({
                  where: { menuId: menu.id },
                  select: {
                      id: true,
                      menuId: true,
                      menuTitle: true,
                      productCode: true,
                  },
              })
            : null;

        const link =
            role && permission
                ? await prisma.rolePermission.findUnique({
                      where: {
                          roleId_permissionId: {
                              roleId: role.id,
                              permissionId: permission.id,
                          },
                      },
                      select: {
                          canView: true,
                          canAdd: true,
                          canEdit: true,
                          canDelete: true,
                      },
                  })
                : null;

        const hint = !session?.uid
            ? "Belum login (tb_session/tb_token kosong)"
            : !role
            ? "AppRole tidak ditemukan untuk role session"
            : !menu
            ? "Menu.routePath tidak ditemukan/ non-aktif"
            : !permission
            ? "AppPermission belum ada (kunjungi path ini atau GET /api/permissions agar ter-upsert)"
            : !link
            ? "Belum ada baris role_permissions untuk role & permission ini"
            : "OK";

        return NextResponse.json(
            safe({
                ok: true,
                session: { role: roleName },
                path,
                roleFound: !!role,
                role,
                menuFound: !!menu,
                menu,
                permissionFound: !!permission,
                permission,
                link,
                hint,
            }),
            { status: 200 }
        );
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: String(e?.message || e) },
            { status: 500 }
        );
    }
}
