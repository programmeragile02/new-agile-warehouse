// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import crypto from "crypto";

// const THIRTY_DAYS = 60 * 60 * 24 * 30;

// // ====== KONFIG PROTEKSI HALAMAN ======
// const PROTECTED = [
//   "/dashboard",
//   "/pelanggan",
//   "/catat-meter",
//   "/jadwal-pencatatan",
//   "/pelunasan",
//   "/tagihan-pembayaran",
//   "/reset-meter",
//   "/biaya",
//   "/pengaturan",
//   "/warga-dashboard",
//   "/input-pembayaran",
// ];

// const PUBLIC_PREFIX = [
//   "/_next",            // asset Next
//   "/api",              // biarkan API lewat (API sendiri cek auth)
//   "/auth/magic",       // magic-link should pass
//   "/unauthorized",
//   "/login",
//   "/company-login",    // <-- tambahkan: halaman pilih company
//   "/",                 // landing bebas (kalau mau proteksi, hapus dari sini)
// ];

// // ====== UTIL ======
// function redirectTo(path: string, req: NextRequest) {
//   const url = req.nextUrl.clone();
//   url.pathname = path;
//   url.search = "";
//   return NextResponse.redirect(url);
// }

// // Decode cookie HMAC (tb_session / tb_tenant) — sama formatnya dengan lib/auth-session.ts
// function decodeHmacCookie<T = any>(cookie?: string | null): T | null {
//   if (!cookie) return null;
//   const [data, sig] = cookie.split(".");
//   if (!data || !sig) return null;
//   const secret = (process.env.AUTH_SECRET ?? "dev-secret") as string;
//   const calc = crypto.createHmac("sha256", secret).update(data).digest("base64url");
//   if (calc !== sig) return null;
//   try {
//     return JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as T;
//   } catch {
//     return null;
//   }
// }

// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;

//   // Bebaskan prefix publik
//   if (PUBLIC_PREFIX.some((p) => pathname === p || pathname.startsWith(p))) {
//     return NextResponse.next();
//   }

//   // Cek cookie company (tb_tenant)
//   const tenantCookie = req.cookies.get("tb_tenant")?.value || "";
//   const hasTenant = !!tenantCookie;

//   // Jika route dilindungi tapi belum pilih company → ke /company-login
//   if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasTenant) {
//     return redirectTo("/company-login", req);
//   }

//   // Jika sudah ada tenant, cek sesi user: tb_session (baru) atau tb_token (lama)
//   const sessionCookie = req.cookies.get("tb_session")?.value || "";
//   const jwtCookie = req.cookies.get("tb_token")?.value || "";
//   const hasUserSession = !!sessionCookie || !!jwtCookie;

//   // Sudah pilih company, tapi belum login user → arahkan ke /login (kecuali halaman auth)
//   const isAuthPage =
//     pathname.startsWith("/login") || pathname.startsWith("/company-login");
//   if (hasTenant && !hasUserSession && !isAuthPage && PROTECTED.some((p) => pathname.startsWith(p))) {
//     return redirectTo("/login", req);
//   }

//   // ====== Role gating untuk WARGA (opsional, seperti middleware lama) ======
//   // Dapatkan role dari tb_session (HMAC) lebih dulu; jika tidak ada, coba tb_token (JWT).
//   let role: string | null = null;

//   // 1) tb_session (HMAC) → payload { uid, uname, role }
//   if (sessionCookie) {
//     const s = decodeHmacCookie<{ role?: string }>(sessionCookie);
//     if (s?.role) role = String(s.role).toUpperCase();
//   }

//   // 2) fallback tb_token (JWT lama)
//   if (!role && jwtCookie) {
//     try {
//       const secret = new TextEncoder().encode(process.env.JWT_SECRET || "supersecret");
//       const { payload } = await jwtVerify(jwtCookie, secret);
//       role = String(payload.role || "").toUpperCase();
//     } catch {
//       role = null;
//     }
//   }

//   // Batasi akses area WARGA
//   const wargaAllowed = [
//     "/warga-dashboard",
//     "/tagihan-pembayaran",
//     // "/pelunasan", // bila ingin izinkan, buka komentar
//   ];

//   if (role === "WARGA") {
//     const ok = wargaAllowed.some((p) => pathname.startsWith(p));
//     if (!ok && PROTECTED.some((p) => pathname.startsWith(p))) {
//       return redirectTo("/warga-dashboard", req);
//     }
//   } else if (role) {
//     // Opsional: blok non-WARGA buka area khusus WARGA
//     const isWargaArea = wargaAllowed.some((p) => pathname.startsWith(p));
//     if (isWargaArea && role !== "ADMIN" && role !== "PETUGAS") {
//       return redirectTo("/unauthorized", req);
//     }
//   }
//   // Catatan: kalau role null (belum login user), aturan di atas sudah mengarahkan ke /login ketika dibutuhkan.

//   // ====== Sliding refresh untuk tb_tenant (remember device) ======
//   const res = NextResponse.next();
//   if (tenantCookie) {
//     res.cookies.set("tb_tenant", tenantCookie, {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: process.env.NODE_ENV === "production",
//       path: "/",
//       maxAge: THIRTY_DAYS,
//     });
//   }
//   return res;
// }

// // Matcher: kecualikan route static & beberapa route auth/api agar tidak looping
// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico).*)",
//   ],
// };

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import crypto from "crypto";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

// Halaman yang wajib login
const PROTECTED = [
    "/dashboard",
    "/pelanggan",
    "/catat-meter",
    "/jadwal-pencatatan",
    "/pelunasan",
    "/tagihan-pembayaran",
    "/reset-meter",
    "/biaya",
    "/pengaturan",
    "/warga-dashboard",
    "/input-pembayaran",
];

// Halaman publik
const PUBLIC_PREFIX = [
    "/_next",
    "/api", // API punya guard sendiri
    "/auth/magic",
    "/unauthorized",
    "/login", // ← biarkan selalu bisa diakses
    "/", // landing bebas
];

function redirectTo(path: string, req: NextRequest) {
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    return NextResponse.redirect(url);
}

function decodeHmacCookie<T = any>(cookie?: string | null): T | null {
    if (!cookie) return null;
    const [data, sig] = cookie.split(".");
    if (!data || !sig) return null;
    const secret = (process.env.AUTH_SECRET ?? "dev-secret") as string;
    const calc = crypto
        .createHmac("sha256", secret)
        .update(data)
        .digest("base64url");
    if (calc !== sig) return null;
    try {
        return JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as T;
    } catch {
        return null;
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (PUBLIC_PREFIX.some((p) => pathname === p || pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Harus punya KEDUA cookie ini untuk lolos halaman protected:
    // - tb_tenant (tenant context)
    // - tb_session atau tb_token (user session)
    const tenantCookie = req.cookies.get("tb_tenant")?.value || "";
    const sessionCookie = req.cookies.get("tb_session")?.value || "";
    const jwtCookie = req.cookies.get("tb_token")?.value || "";

    const hasTenant = !!tenantCookie;
    const hasUser = !!sessionCookie || !!jwtCookie;

    if (PROTECTED.some((p) => pathname.startsWith(p))) {
        if (!hasTenant || !hasUser) {
            return redirectTo("/login", req);
        }
    }

    // Role gating (sama seperti versi kamu, hanya path /company-login dihapus)
    let role: string | null = null;
    if (sessionCookie) {
        const s = decodeHmacCookie<{ role?: string }>(sessionCookie);
        if (s?.role) role = String(s.role).toUpperCase();
    }
    if (!role && jwtCookie) {
        try {
            const secret = new TextEncoder().encode(
                process.env.JWT_SECRET || "supersecret"
            );
            const { payload } = await jwtVerify(jwtCookie, secret);
            role = String(payload.role || "").toUpperCase();
        } catch {
            role = null;
        }
    }

    const wargaAllowed = ["/warga-dashboard", "/tagihan-pembayaran"];
    if (role === "WARGA") {
        const ok = wargaAllowed.some((p) => pathname.startsWith(p));
        if (!ok && PROTECTED.some((p) => pathname.startsWith(p))) {
            return redirectTo("/warga-dashboard", req);
        }
    }

    // Sliding refresh tb_tenant
    const res = NextResponse.next();
    if (tenantCookie) {
        res.cookies.set("tb_tenant", tenantCookie, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: THIRTY_DAYS,
        });
    }
    return res;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
