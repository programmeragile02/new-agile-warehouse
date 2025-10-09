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

const PRODUCT_CODE = process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING";
const WAREHOUSE_API =
  process.env.WAREHOUSE_API || process.env.WAREHOUSE_BASE || "http://localhost:9000";
const WAREHOUSE_KEY = process.env.WAREHOUSE_API_KEY || "dev-panel-key-abc";

const PKG_TO_OFFERING: Record<string, string> = {
  BASIC: "basic",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
};

async function fetchAddons(instanceId: string): Promise<string[]> {
  const url = `${WAREHOUSE_API.replace(/\/+$/,"")}/subscriptions/${encodeURIComponent(instanceId)}/features`;
  const res = await fetch(url, {
    headers: { "X-API-KEY": WAREHOUSE_KEY, Accept: "application/json" },
    cache: "no-store",
  }).catch(() => null as any);
  if (!res || !res.ok) return [];
  const json = await res.json().catch(() => ({}));
  return (json?.features || [])
    .filter((f: any) => (f?.enabled ?? true) && String(f?.source||"").toLowerCase()==="addon")
    .map((f: any) => String(f?.code || f?.feature_code || "").trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const { companyId, companyPassword } = await req.json();

    if (!companyId) {
      return NextResponse.json({ ok:false, message:"Company ID wajib diisi" }, { status:422 });
    }
    if (!companyPassword) {
      return NextResponse.json({ ok:false, message:"Password wajib diisi" }, { status:422 });
    }

    // === panggil Warehouse: /tenant/resolve-auth (POST)
    const url = `${WAREHOUSE_API.replace(/\/+$/,"")}/tenant/resolve-auth`;
    const wres = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        Accept: "application/json",
        "X-API-KEY": WAREHOUSE_KEY,
      },
      body: JSON.stringify({
        company_id: String(companyId).toUpperCase(),
        product_code: PRODUCT_CODE,
        company_password: companyPassword,
      }),
      cache: "no-store",
    });

    if (!wres.ok) {
      const err = await wres.json().catch(() => ({}));
      const code = err?.error || "AUTH_FAILED";
      const msg  = code === "INVALID_PASSWORD"
        ? "Password company salah"
        : (code === "INSTANCE_NOT_FOUND" ? "Company tidak ditemukan / tidak aktif" : "Gagal login company");
      return NextResponse.json({ ok:false, message: msg }, { status: wres.status });
    }

    const json = await wres.json();
    const info = json?.data;
    const offering = PKG_TO_OFFERING[(info?.package_code || "").toUpperCase()] || "basic";
    const addons = info?.subscription_instance_id ? await fetchAddons(info.subscription_instance_id) : [];

    const res = NextResponse.json({
      ok: true,
      tenant: { companyId: info.company_id, productCode: info.product_code },
    });

    // HttpOnly context untuk server
    res.cookies.set("tb_tenant", encodeCookie({
      companyId: info.company_id,
      productCode: info.product_code,
      dbUrl: info.db_url,
      packageCode: info.package_code,
    }), {
      httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60*60*24*30,
    });

    // selector untuk client
    res.cookies.set("tb_company", info.company_id, {
      httpOnly: false, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60*60*24,
    });

    res.cookies.set("tb_offering", offering, {
      httpOnly: false, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60*60*24,
    });

    if (Array.isArray(addons)) {
      res.cookies.set(`tb_addons__${info.company_id}`, JSON.stringify(addons), {
        httpOnly: false, sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", maxAge: 60*60,
      });
    }

    if (info?.subscription_instance_id) {
      res.cookies.set("tb_instance", encodeCookie({ instanceId: info.subscription_instance_id }), {
        httpOnly: true, sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", maxAge: 60*60*24,
      });
    }

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok:false, message: e?.message ?? "Server error" }, { status:500 });
  }
}