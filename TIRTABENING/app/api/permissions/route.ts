import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function toStr(x: unknown) {
    return typeof x === "bigint" ? x.toString() : (x as any);
}

// default offering kalau cookie tidak ada
const DEFAULT_OFFERING =
    process.env.NEXT_PUBLIC_DEFAULT_OFFERING ||
    process.env.DEFAULT_OFFERING ||
    "basic";

const PRODUCT_CODE =
    process.env.NEXT_PUBLIC_PRODUCT_CODE ||
    process.env.PRODUCT_CODE ||
    "NATABANYU";

/**
 * Ambil offering (paket) dari cookie tb_offering.
 * Kalau tidak ada, pakai DEFAULT_OFFERING.
 */
function getOfferingFromReq(req: NextRequest): string {
    try {
        const cookie = req.cookies.get("tb_offering")?.value;
        if (cookie && cookie.trim()) return cookie.trim();
    } catch {}
    return (DEFAULT_OFFERING || "basic").toLowerCase();
}

/**
 * Panggil endpoint matrix yang sama seperti AppHeader:
 * /api/public/catalog/offerings/:productCode/:offering/matrix?include=menus
 *
 * Hasilnya kita jadikan Set<string> berisi route_path yang aktif.
 */
async function fetchAllowedPathsFromMatrix(
    req: NextRequest,
    productCode: string,
    offering: string
): Promise<Set<string> | null> {
    try {
        const base =
            process.env.INTERNAL_BASE_URL ||
            `http://127.0.0.1:${process.env.PORT || 3011}`;

        const url = new URL(
            `/api/public/catalog/offerings/${encodeURIComponent(
                productCode
            )}/${encodeURIComponent(offering)}/matrix`,
            base
        );
        url.searchParams.set("include", "menus");

        const res = await fetch(url.toString(), {
            headers: {
                cookie: req.headers.get("cookie") ?? "",
                accept: "application/json",
            },
            cache: "no-store",
        });

        const json: any = await res.json().catch(() => ({}));

        if (!res.ok || json?.ok === false) {
            return null;
        }

        const menus: Array<{ route_path?: string; is_active?: any }> =
            json?.data?.menus || json?.menus || [];

        const s = new Set<string>();
        for (const m of menus) {
            const raw = (m?.route_path ?? "").toString().trim();
            if (!raw) continue;

            // normalisasi: tambahkan leading slash & buang trailing slash
            let p = raw.startsWith("/") ? raw : `/${raw}`;
            if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

            const inactive =
                m?.is_active === false ||
                m?.is_active === 0 ||
                m?.is_active === "0" ||
                (typeof m?.is_active === "string" &&
                    m?.is_active.toLowerCase() === "false");

            if (!inactive) s.add(p);
        }

        return s;
    } catch (e) {
        console.error("fetchAllowedPathsFromMatrix error:", e);
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        const prisma = await db();
        const productCode = PRODUCT_CODE;

        // 1) baca paket (offering) dari cookie
        const offering = getOfferingFromReq(req);

        // 2) ambil daftar route_path yang aktif dari matrix
        const allowedPaths = await fetchAllowedPathsFromMatrix(
            req,
            productCode,
            offering
        );

        if (!allowedPaths || allowedPaths.size === 0) {
            return NextResponse.json({ ok: true, data: [] });
        }

        // 3) siapkan kondisi filter menu
        //    Asumsi: di mstMenu ada kolom `routePath` yang berisi "/pelanggan", "/jadwal-pencatatan", dst.
        const menuWhere: any = {
            isActive: true,
            productCode,
        };

        if (allowedPaths && allowedPaths.size > 0) {
            menuWhere.routePath = { in: Array.from(allowedPaths) };
        }

        // 4) ambil menu aktif yang sesuai paket
        const menus = await prisma.mstMenu.findMany({
            where: menuWhere,
            orderBy: [{ level: "asc" }, { orderNumber: "asc" }],
        });

        // 5) map untuk parent title (kategori)
        const byId = new Map(menus.map((m: any) => [m.id.toString(), m]));

        const parentTitle = (m: (typeof menus)[number]) => {
            if (!m.parentId) return null;
            const p = byId.get(m.parentId.toString());
            return p?.title ?? null;
        };

        // 6) sinkron ke appPermission (per menu yang lulus filter paket)
        await Promise.all(
            menus.map((m: any) =>
                prisma.appPermission.upsert({
                    where: { menuId: m.id },
                    update: {
                        menuTitle: m.title,
                        category: parentTitle(m) ?? undefined,
                        productCode: m.productCode ?? undefined,
                        isActive: m.isActive,
                        // kalau mau, di sini juga bisa simpan routePath:
                        // routePath: m.routePath,
                    },
                    create: {
                        menuId: m.id,
                        menuTitle: m.title,
                        category: parentTitle(m) ?? undefined,
                        productCode: m.productCode ?? undefined,
                        isActive: m.isActive,
                        // routePath: m.routePath,
                    },
                })
            )
        );

        // 7) ambil permissions hasil sinkron (hanya untuk productCode ini,
        //    dan implicit cuma untuk menu yang tadi kita proses)
        const menuIds = menus.map((m: any) => m.id);

        const permissions = await prisma.appPermission.findMany({
            where: {
                isActive: true,
                productCode,
                menuId: { in: menuIds },
            },
            orderBy: [{ category: "asc" }, { menuTitle: "asc" }],
        });

        const data = permissions.map((p: any) => ({
            ...p,
            menuId: toStr(p.menuId),
        }));

        return NextResponse.json({ ok: true, data });
    } catch (e: any) {
        console.error("GET /api/permissions error:", e);
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}
