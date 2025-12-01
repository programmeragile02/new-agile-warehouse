// app/api/my/menu-permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decodeCookie } from "@/lib/auth-session";
import * as jose from "jose";

const PRODUCT_CODE =
    process.env.NEXT_PUBLIC_PRODUCT_CODE || process.env.PRODUCT_CODE || null;

// helper kecil, sama konsepnya dengan normalizePath di AppHeader
function normalizePath(p: string | null | undefined): string {
    if (!p) return "/";
    let s = p.trim();
    if (!s.startsWith("/")) s = "/" + s;
    if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
    return s;
}

export async function GET(req: NextRequest) {
    const prisma = await db();

    try {
        // 1) Cari userId dari cookie (sama dengan /api/auth/me)
        const decodedSession = decodeCookie<{ uid: string }>(
            req.cookies.get("tb_session")?.value ?? ""
        );
        let userId: string | null = decodedSession?.uid ?? null;

        // 2) Back-compat: JWT lama tb_token
        if (!userId) {
            const jwt = req.cookies.get("tb_token")?.value;
            if (jwt) {
                const secret = new TextEncoder().encode(
                    process.env.JWT_SECRET || "dev-secret"
                );
                const { payload } = await jose.jwtVerify(jwt, secret);
                userId =
                    (payload.sub as string) ||
                    (payload["id"] as string) ||
                    (payload["userId"] as string) ||
                    null;
            }
        }

        if (!userId) {
            return NextResponse.json({ ok: false }, { status: 401 });
        }

        // 3) Ambil user + appRoleId
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                isActive: true,
                appRoleId: true,
            },
        });

        if (!user || !user.isActive) {
            return NextResponse.json({ ok: false }, { status: 401 });
        }

        if (!user.appRoleId) {
            // user belum punya AppRole → tidak ada permission
            return NextResponse.json({
                ok: true,
                data: { routes: [] as string[] },
            });
        }

        // 4) Ambil semua RolePermission utk role ini yang canView = true
        const rolePerms = await prisma.rolePermission.findMany({
            where: {
                roleId: user.appRoleId,
                canView: true,
            },
            select: {
                permissionId: true,
            },
        });

        if (rolePerms.length === 0) {
            return NextResponse.json({
                ok: true,
                data: { routes: [] as string[] },
            });
        }

        const permissionIds = rolePerms.map((rp) => rp.permissionId);

        // 5) Ambil AppPermission terkait (boleh filter productCode juga)
        const appPerms = await prisma.appPermission.findMany({
            where: {
                id: { in: permissionIds },
                isActive: true,
                ...(PRODUCT_CODE ? { productCode: PRODUCT_CODE } : {}), // kalau mau skip filter product, tinggal hapus blok ini
            },
            select: {
                menuId: true,
            },
        });

        if (appPerms.length === 0) {
            return NextResponse.json({
                ok: true,
                data: { routes: [] as string[] },
            });
        }

        const menuIds = appPerms.map((p) => p.menuId);

        // 6) Ambil MstMenu untuk menuIds → routePath
        const menus = await prisma.mstMenu.findMany({
            where: {
                id: { in: menuIds },
                isActive: true,
            },
            select: {
                routePath: true,
            },
        });

        // 7) Normalisasi dan unik-kan rute
        const routesSet = new Set<string>();
        for (const m of menus) {
            const norm = normalizePath(m.routePath);
            if (norm && norm !== "/") {
                routesSet.add(norm);
            }
        }

        const routes = Array.from(routesSet);

        return NextResponse.json({
            ok: true,
            data: { routes },
        });
    } catch (err) {
        console.error("[my/menu-permissions] error:", err);
        return NextResponse.json(
            {
                ok: false,
                error: "Internal error",
            },
            { status: 500 }
        );
    }
}
