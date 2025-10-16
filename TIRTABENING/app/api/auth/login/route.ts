// export const runtime = "nodejs";

// import { NextResponse } from "next/server";
// import { resolveTenant } from "@/lib/tenant-registry"; // ← pakai yang TANPA password company
// import { prismaFor } from "@/lib/prisma-tenant";
// import { encodeCookie } from "@/lib/auth-session";
// import { verifyPasswordAny } from "@/lib/auth-utils";
// import jwt from "jsonwebtoken";

// const PRODUCT_CODE = process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING";
// const WAREHOUSE_API =
//     process.env.WAREHOUSE_API ||
//     process.env.WAREHOUSE_BASE ||
//     "http://localhost:9000";
// const WAREHOUSE_KEY = process.env.WAREHOUSE_API_KEY || "dev-panel-key-abc";

// const PKG_TO_OFFERING: Record<string, string> = {
//     BASIC: "basic",
//     PREMIUM: "premium",
//     ENTERPRISE: "enterprise",
// };

// function normalizeOffering(code?: string | null) {
//     const key = String(code || "").toUpperCase();
//     return PKG_TO_OFFERING[key] || "basic";
// }

// async function fetchAddons(instanceId?: string): Promise<string[]> {
//     if (!instanceId) return [];
//     const url = `${String(WAREHOUSE_API).replace(
//         /\/+$/,
//         ""
//     )}/subscriptions/${encodeURIComponent(instanceId)}/features`;
//     const res = await fetch(url, {
//         headers: { "X-API-KEY": WAREHOUSE_KEY, Accept: "application/json" },
//         cache: "no-store",
//     }).catch(() => null as any);
//     if (!res || !res.ok) return [];
//     const json = await res.json().catch(() => ({}));
//     return (json?.features || [])
//         .filter(
//             (f: any) =>
//                 (f?.enabled ?? true) &&
//                 String(f?.source || "").toLowerCase() === "addon"
//         )
//         .map((f: any) =>
//             String(f?.code || f?.feature_code || "")
//                 .trim()
//                 .toLowerCase()
//         )
//         .filter(Boolean);
// }

// /**
//  * ONE-STEP LOGIN (password only, semua role di tabel User tenant)
//  * body: { companyId: string, username: string, password: string }
//  */
// export async function POST(req: Request) {
//     try {
//         const body = await req.json().catch(() => ({}));
//         const companyId = String(body?.companyId || "").trim();
//         const username = String(body?.username || "").trim();
//         const password = String(body?.password || "").trim();

//         if (!companyId)
//             return NextResponse.json(
//                 { ok: false, message: "Account ID wajib diisi" },
//                 { status: 422 }
//             );
//         if (!username)
//             return NextResponse.json(
//                 { ok: false, message: "Username wajib diisi" },
//                 { status: 422 }
//             );
//         if (!password)
//             return NextResponse.json(
//                 { ok: false, message: "Password wajib diisi" },
//                 { status: 422 }
//             );

//         // 1) Tentukan tenant via Warehouse (belum akses data sensitif)
//         const info = await resolveTenant(companyId, PRODUCT_CODE);
//         if (!info) {
//             return NextResponse.json(
//                 {
//                     ok: false,
//                     message: "Account ID tidak ditemukan / tidak aktif",
//                 },
//                 { status: 404 }
//             );
//         }

//         // 2) Konek ke DB tenant
//         const prisma = prismaFor(info.dbUrl);

//         // 3) Cari user & verifikasi password (semua role di tabel User)
//         const user = await prisma.user.findUnique({ where: { username } });
//         if (!user || !user.isActive || user.deletedAt) {
//             // samakan pesan agar tidak bocor info
//             return NextResponse.json(
//                 { ok: false, message: "Username atau password salah" },
//                 { status: 401 }
//             );
//         }

//         const ok = await verifyPasswordAny(password, user.passwordHash);
//         if (!ok) {
//             // kecilkan timing oracle + brute force
//             await new Promise((r) => setTimeout(r, 250));
//             return NextResponse.json(
//                 { ok: false, message: "Username atau password salah" },
//                 { status: 401 }
//             );
//         }

//         // 4) Offering + addons (gating UI)
//         const offering = normalizeOffering(info.packageCode);
//         const addons = await fetchAddons(info.subscriptionInstanceId);

//         //  first login change password
//         const requirePasswordChange = !!user.mustChangePassword;

//         // 5) Set cookies (tenant context + user session)
//         const res = NextResponse.json({
//             ok: true,
//             user: {
//                 id: user.id,
//                 username: user.username,
//                 role: user.role,
//                 name: user.name,
//             },
//             tenant: {
//                 companyId: info.companyId,
//                 productCode: info.productCode,
//             },
//             offering,
//             requirePasswordChange,
//         });

//         // Tenant context → dipakai lib/db()
//         res.cookies.set(
//             "tb_tenant",
//             encodeCookie({
//                 companyId: info.companyId,
//                 productCode: info.productCode,
//                 dbUrl: info.dbUrl,
//                 packageCode: info.packageCode,
//             }),
//             {
//                 httpOnly: true,
//                 sameSite: "lax",
//                 secure: process.env.NODE_ENV === "production",
//                 path: "/",
//                 maxAge: 60 * 60 * 24 * 30,
//             }
//         );

//         // Session user (HttpOnly)
//         res.cookies.set(
//             "tb_session",
//             encodeCookie({
//                 uid: user.id,
//                 uname: user.username,
//                 role: user.role,
//             }),
//             {
//                 httpOnly: true,
//                 sameSite: "lax",
//                 secure: process.env.NODE_ENV === "production",
//                 path: "/",
//                 maxAge: 60 * 60 * 8,
//             }
//         );

//         // JWT (opsional untuk fetch client-side)
//         const token = jwt.sign(
//             { sub: user.id, username: user.username, role: user.role },
//             process.env.JWT_SECRET || "supersecret",
//             { expiresIn: "1d" }
//         );
//         res.cookies.set("tb_token", token, {
//             httpOnly: true,
//             sameSite: "lax",
//             secure: process.env.NODE_ENV === "production",
//             path: "/",
//             maxAge: 60 * 60 * 24,
//         });

//         // Untuk UI (non-HttpOnly)
//         res.cookies.set("tb_company", info.companyId, {
//             httpOnly: false,
//             sameSite: "lax",
//             secure: process.env.NODE_ENV === "production",
//             path: "/",
//             maxAge: 60 * 60 * 24,
//         });
//         res.cookies.set("tb_offering", offering, {
//             httpOnly: false,
//             sameSite: "lax",
//             secure: process.env.NODE_ENV === "production",
//             path: "/",
//             maxAge: 60 * 60 * 24,
//         });
//         if (addons.length) {
//             res.cookies.set(
//                 `tb_addons__${info.companyId}`,
//                 JSON.stringify(addons),
//                 {
//                     httpOnly: false,
//                     sameSite: "lax",
//                     secure: process.env.NODE_ENV === "production",
//                     path: "/",
//                     maxAge: 60 * 60,
//                 }
//             );
//         }

//         // 6) Update last login
//         // **Tidak** update lastLoginAt dulu kalau mustChangePassword=true
//         if (!requirePasswordChange) {
//             await prisma.user.update({
//                 where: { id: user.id },
//                 data: { lastLoginAt: new Date() },
//             });
//         }

//         return res;
//     } catch (e: any) {
//         return NextResponse.json(
//             { ok: false, message: e?.message ?? "Server error" },
//             { status: 500 }
//         );
//     }
// }

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prismaFor } from "@/lib/prisma-tenant";
import { encodeCookie } from "@/lib/auth-session";
import jwt from "jsonwebtoken";
import { resolveLoginByEmail } from "@/lib/tenant-registry";

const WAREHOUSE_API =
    process.env.WAREHOUSE_API ||
    process.env.WAREHOUSE_BASE ||
    "http://localhost:9000";
const WAREHOUSE_KEY = process.env.WAREHOUSE_API_KEY || "dev-panel-key-abc";

const PKG_TO_OFFERING: Record<string, string> = {
    BASIC: "basic",
    PREMIUM: "premium",
    ENTERPRISE: "enterprise",
};

function normalizeOffering(code?: string | null) {
    const key = String(code || "").toUpperCase();
    return PKG_TO_OFFERING[key] || "basic";
}

async function fetchAddons(instanceId?: string): Promise<string[]> {
    if (!instanceId) return [];
    const url = `${String(WAREHOUSE_API).replace(
        /\/+$/,
        ""
    )}/subscriptions/${encodeURIComponent(instanceId)}/features`;
    const res = await fetch(url, {
        headers: { "X-API-KEY": WAREHOUSE_KEY, Accept: "application/json" },
        cache: "no-store",
    }).catch(() => null as any);
    if (!res || !res.ok) return [];
    const json = await res.json().catch(() => ({}));
    return (json?.features || [])
        .filter(
            (f: any) =>
                (f?.enabled ?? true) &&
                String(f?.source || "").toLowerCase() === "addon"
        )
        .map((f: any) =>
            String(f?.code || f?.feature_code || "")
                .trim()
                .toLowerCase()
        )
        .filter(Boolean);
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const email = String(body?.email || body?.username || "")
            .toLowerCase()
            .trim();
        const password = String(body?.password || "").trim();

        if (!email)
            return NextResponse.json(
                { ok: false, message: "Email wajib diisi" },
                { status: 422 }
            );
        if (!password)
            return NextResponse.json(
                { ok: false, message: "Password wajib diisi" },
                { status: 422 }
            );

        // 1) Resolve + verify di Warehouse (CPIU)
        const resolved = await resolveLoginByEmail(email, password);
        if (!resolved.ok) {
            return NextResponse.json(
                { ok: false, message: resolved.message },
                { status: resolved.status }
            );
        }
        const info = resolved.data;

        // 2) Ambil profil user dari tenant (username = email)
        const prisma = prismaFor(info.dbUrl);
        const user = await prisma.user.findUnique({
            where: { username: email },
        });
        if (!user || user.deletedAt || !user.isActive) {
            return NextResponse.json(
                { ok: false, message: "Akun tidak aktif" },
                { status: 403 }
            );
        }

        const offering = normalizeOffering(info.packageCode);
        const addons = await fetchAddons(info.subscriptionInstanceId);
        const requirePasswordChange = !!user.mustChangePassword;

        // 3) Set cookies
        const res = NextResponse.json({
            ok: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
            },
            tenant: {
                companyId: info.companyId,
                productCode: info.productCode,
            },
            offering,
            requirePasswordChange,
        });

        res.cookies.set(
            "tb_tenant",
            encodeCookie({
                companyId: info.companyId,
                productCode: info.productCode,
                dbUrl: info.dbUrl,
                packageCode: info.packageCode,
            }),
            {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24 * 30,
            }
        );

        res.cookies.set(
            "tb_session",
            encodeCookie({
                uid: user.id,
                uname: user.username,
                role: user.role,
            }),
            {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 8,
            }
        );

        const token = jwt.sign(
            { sub: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || "supersecret",
            { expiresIn: "1d" }
        );
        res.cookies.set("tb_token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        res.cookies.set("tb_company", info.companyId, {
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });
        res.cookies.set("tb_offering", offering, {
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });
        if (addons.length) {
            res.cookies.set(
                `tb_addons__${info.companyId}`,
                JSON.stringify(addons),
                {
                    httpOnly: false,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60,
                }
            );
        }

        if (!requirePasswordChange) {
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
        }

        return res;
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
