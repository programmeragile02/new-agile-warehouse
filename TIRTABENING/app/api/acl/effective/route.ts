// app/api/acl/effective/route.ts
import { NextResponse } from "next/server";
import { getUserSessionOrNull } from "@/lib/tenant-context";
import { db } from "@/lib/db";

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

export async function GET() {
    try {
        const prisma = await db();
        const session = await getUserSessionOrNull();
        if (!session?.uid) {
            return NextResponse.json(
                { ok: false, error: "Belum login" },
                { status: 401 }
            );
        }

        const roleName = String(session.role || "").toUpperCase();

        // Wajib: role harus ada di AppRole
        const role = await prisma.appRole.findFirst({
            where: { name: roleName },
            select: { id: true },
        });
        if (!role) {
            return NextResponse.json(
                { ok: false, error: "Role tidak dikenal" },
                { status: 403 }
            );
        }

        // Ambil semua link role → permission (bersama menuId)
        const links = await prisma.rolePermission.findMany({
            where: { roleId: role.id },
            select: {
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
                permission: { select: { menuId: true } },
            },
        });

        if (!links.length) return NextResponse.json({ ok: true, data: {} });

        const menuIds = links.map((l) => l.permission.menuId);
        const menus = await prisma.mstMenu.findMany({
            where: { id: { in: menuIds }, isActive: true },
            select: { id: true, routePath: true },
        });

        const byMenuId = new Map(menus.map((m) => [m.id.toString(), m]));
        const data: Record<string, any> = {};

        for (const l of links) {
            const m = byMenuId.get(l.permission.menuId.toString());
            if (!m) continue;
            const p = normPath(m.routePath || "");
            if (!p || p === "/") continue;
            data[p] = {
                canView: !!l.canView,
                canAdd: !!l.canAdd,
                canEdit: !!l.canEdit,
                canDelete: !!l.canDelete,
            };
        }

        return NextResponse.json({ ok: true, data });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}
