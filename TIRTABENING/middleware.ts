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
    "/onboarding"
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
