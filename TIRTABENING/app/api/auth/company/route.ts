// export const runtime = "nodejs";
// import { NextResponse } from "next/server";
// import { resolveTenant } from "@/lib/tenant-registry";
// import { encodeCookie } from "@/lib/auth-session";

// const PRODUCT_CODE = process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING";
// const WAREHOUSE_API =
//     process.env.WAREHOUSE_API ||
//     process.env.WAREHOUSE_BASE ||
//     "http://localhost:9000";
// const WAREHOUSE_KEY = process.env.WAREHOUSE_API_KEY || "dev-panel-key-abc";

// // mapping panel → slug offering
// const PKG_TO_OFFERING: Record<string, string> = {
//     BASIC: "basic",
//     PREMIUM: "premium",
//     ENTERPRISE: "enterprise",
// };

// async function fetchAddons(instanceId: string): Promise<string[]> {
//     const url = `${WAREHOUSE_API.replace(
//         /\/+$/,
//         ""
//     )}/subscriptions/${encodeURIComponent(instanceId)}/features`;
//     const res = await fetch(url, {
//         headers: {
//             "X-API-KEY": WAREHOUSE_KEY,
//             Accept: "application/json",
//         },
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

// export async function POST(req: Request) {
//     try {
//         const { companyId, companyPassword } = await req.json();
//         if (!companyId)
//             return NextResponse.json(
//                 { ok: false, message: "Company ID wajib diisi" },
//                 { status: 422 }
//             );

//         const info = await resolveTenant(
//             String(companyId).toUpperCase(),
//             PRODUCT_CODE
//         );
//         if (!info)
//             return NextResponse.json(
//                 { ok: false, message: "Company tidak ditemukan / tidak aktif" },
//                 { status: 404 }
//             );

//         const offering =
//             PKG_TO_OFFERING[(info.packageCode || "").toUpperCase()] || "basic";
//         const addons = info.subscriptionInstanceId
//             ? await fetchAddons(info.subscriptionInstanceId)
//             : [];

//         const res = NextResponse.json({
//             ok: true,
//             tenant: {
//                 companyId: info.companyId,
//                 productCode: info.productCode,
//             },
//         });

//         // tb_tenant (HttpOnly) → dipakai lib/db()
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

//         // selector client
//         res.cookies.set("tb_company", info.companyId, {
//             httpOnly: false,
//             sameSite: "lax",
//             secure: process.env.NODE_ENV === "production",
//             path: "/",
//             maxAge: 60 * 60 * 24,
//         });

//         // fitur paket (tetap arsitektur kamu)
//         res.cookies.set("tb_offering", offering, {
//             httpOnly: false,
//             sameSite: "lax",
//             secure: process.env.NODE_ENV === "production",
//             path: "/",
//             maxAge: 60 * 60 * 24,
//         });

//         // add-on namespaced per company
//         res.cookies.set(
//             `tb_addons__${info.companyId}`,
//             JSON.stringify(addons),
//             {
//                 httpOnly: false,
//                 sameSite: "lax",
//                 secure: process.env.NODE_ENV === "production",
//                 path: "/",
//                 maxAge: 60 * 60,
//             }
//         );

//         // opsional: simpan instanceId secara HttpOnly untuk guard server
//         if (info.subscriptionInstanceId) {
//             res.cookies.set(
//                 "tb_instance",
//                 encodeCookie({ instanceId: info.subscriptionInstanceId }),
//                 {
//                     httpOnly: true,
//                     sameSite: "lax",
//                     secure: process.env.NODE_ENV === "production",
//                     path: "/",
//                     maxAge: 60 * 60 * 24,
//                 }
//             );
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
import { encodeCookie } from "@/lib/auth-session";
import { resolveTenantAuth } from "@/lib/tenant-registry";

const PRODUCT_CODE = process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING";
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

async function fetchAddons(instanceId: string): Promise<string[]> {
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
        const { companyId, companyPassword } = await req.json();

        if (!companyId)
            return NextResponse.json(
                { ok: false, message: "Company ID wajib diisi" },
                { status: 422 }
            );
        if (!companyPassword)
            return NextResponse.json(
                { ok: false, message: "Password wajib diisi" },
                { status: 422 }
            );

        // AUTH ke Warehouse (WAJIB password)
        const info = await resolveTenantAuth(
            String(companyId).toUpperCase(),
            PRODUCT_CODE,
            companyPassword
        );
        if (!info) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Company ID atau Password salah / tidak aktif",
                },
                { status: 401 }
            );
        }

        const offering =
            PKG_TO_OFFERING[(info.packageCode || "").toUpperCase()] || "basic";
        const addons = info.subscriptionInstanceId
            ? await fetchAddons(info.subscriptionInstanceId)
            : [];

        const res = NextResponse.json({
            ok: true,
            tenant: {
                companyId: info.companyId,
                productCode: info.productCode,
            },
        });

        // Context server (HttpOnly)
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

        // Untuk client
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

        if (Array.isArray(addons)) {
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

        if (info.subscriptionInstanceId) {
            res.cookies.set(
                "tb_instance",
                encodeCookie({ instanceId: info.subscriptionInstanceId }),
                {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24,
                }
            );
        }

        return res;
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
