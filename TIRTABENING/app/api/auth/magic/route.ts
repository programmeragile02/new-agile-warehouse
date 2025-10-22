// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import * as jose from "jose"; // jose untuk set JWT

// // atau jsonwebtoken, tapi jose sudah oke & dipakai di getAuthUserId

// const SECRET = process.env.JWT_SECRET!;
// if (!SECRET) console.warn("[magic] JWT_SECRET is empty");

// function getOrigin(req: NextRequest) {
//   const h = req.headers;
//   const origin =
//     process.env.APP_ORIGIN ||
//     process.env.NEXT_PUBLIC_APP_URL ||
//     h.get("origin") ||
//     `${h.get("x-forwarded-proto") || "http"}://${
//       h.get("x-forwarded-host") || h.get("host") || ""
//     }`;
//   return origin?.replace(/\/$/, "");
// }

// export async function GET(req: NextRequest) {
//   const prisma = await db();
//   const url = new URL(req.url);
//   const token = url.searchParams.get("token") || "";
//   const fallback = `${getOrigin(req)}/unauthorized`;

//   try {
//     if (!token) {
//       return NextResponse.redirect(`${fallback}?reason=missing_token`);
//     }

//     // 1) Validasi token di DB: masih berlaku & belum terpakai
//     const rec = await prisma.magicLinkToken.findUnique({
//       where: { token },
//       include: { user: true },
//     });
//     if (!rec) {
//       return NextResponse.redirect(`${fallback}?reason=invalid_token`);
//     }
//     // if (rec.usedAt) {
//     //   return NextResponse.redirect(`${fallback}?reason=used`);
//     // }
//     if (rec.expiresAt <= new Date()) {
//       return NextResponse.redirect(`${fallback}?reason=expired`);
//     }

//     // 2) Ambil user
//     const user = await prisma.user.findUnique({ where: { id: rec.userId } });
//     if (!user || !user.isActive) {
//       return NextResponse.redirect(`${fallback}?reason=inactive_user`);
//     }

//     // 3) Generate JWT httpOnly cookie (SAMA secret dengan login biasa)
//     const jwt = await new jose.SignJWT({
//       id: user.id,
//       role: user.role,
//       username: user.username,
//     })
//       .setProtectedHeader({ alg: "HS256", typ: "JWT" })
//       .setSubject(user.id)
//       .setIssuedAt()
//       .setExpirationTime("7d")
//       .sign(new TextEncoder().encode(SECRET));

//     // 4) Tandai token sudah dipakai (sekali pakai)
//     // await prisma.magicLinkToken.update({
//     //   where: { token },
//     //   data: { usedAt: new Date() },
//     // });

//     // 5) Redirect ke pelunasan
//     const dest = rec.tagihanId
//       ? `${getOrigin(req)}/input-pembayaran/${encodeURIComponent(
//           rec.tagihanId
//         )}`
//       : `${getOrigin(req)}/warga-dashboard`;

//     const res = NextResponse.redirect(dest);
//     res.cookies.set("tb_token", jwt, {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: process.env.NODE_ENV === "production",
//       path: "/",
//       maxAge: 60 * 60 * 24 * 7, // 7 hari
//     });

//     // (opsional) cookie ringan untuk UI — bukan untuk auth
//     res.cookies.set("tb_user_id", user.id, {
//       httpOnly: false,
//       sameSite: "lax",
//       secure: process.env.NODE_ENV === "production",
//       path: "/",
//       maxAge: 60 * 60 * 24 * 7,
//     });

//     return res;
//   } catch (e) {
//     return NextResponse.redirect(`${fallback}?reason=server_error`);
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { encodeCookie } from "@/lib/auth-session";
import { resolveTenant } from "@/lib/tenant-registry";
import { prismaFor } from "@/lib/prisma-tenant";

const WAREHOUSE_API = (
    process.env.WAREHOUSE_API ||
    process.env.WAREHOUSE_BASE ||
    ""
).replace(/\/+$/, "");
const WAREHOUSE_KEY = process.env.WAREHOUSE_API_KEY || "";
const PRODUCT_CODE = process.env.NEXT_PUBLIC_PRODUCT_CODE || "NATABANYU";

function getOrigin(req: NextRequest) {
    const h = req.headers;
    const origin =
        process.env.APP_ORIGIN ||
        process.env.NEXT_PUBLIC_APP_URL ||
        h.get("origin") ||
        `${h.get("x-forwarded-proto") || "http"}://${
            h.get("x-forwarded-host") || h.get("host") || ""
        }`;
    return origin?.replace(/\/$/, "");
}

async function fetchAddons(instanceId?: string): Promise<string[]> {
    if (!instanceId || !WAREHOUSE_API || !WAREHOUSE_KEY) return [];
    try {
        const url = `${WAREHOUSE_API}/subscriptions/${encodeURIComponent(
            instanceId
        )}/features`;
        const r = await fetch(url, {
            headers: { "X-API-KEY": WAREHOUSE_KEY, Accept: "application/json" },
            cache: "no-store",
        }).catch(() => null as any);
        if (!r || !r.ok) return [];
        const j = await r.json().catch(() => null);
        const features = j?.features || [];
        return features
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
    } catch {
        return [];
    }
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const token = (url.searchParams.get("token") || "").trim();
        const companyIdFromQuery = (
            url.searchParams.get("companyId") || ""
        ).trim();
        const companyIdFromHeader =
            req.headers.get("x-company-id") ||
            req.headers.get("x-companyid") ||
            "";
        const companyId = (
            companyIdFromHeader ||
            companyIdFromQuery ||
            ""
        ).trim();

        const fallback = `${getOrigin(req)}/unauthorized`;
        if (!token)
            return NextResponse.redirect(`${fallback}?reason=missing_token`);

        // IMPORTANT: require companyId because magic tokens are stored in tenant DB.
        if (!companyId) {
            // jika kamu ingin support mencari company dari token tanpa companyId,
            // itu butuh indeks central yang memetakan token->company (bukan kasus sekarang).
            return NextResponse.redirect(`${fallback}?reason=missing_tenant`);
        }

        // 1) Resolve tenant metadata (dbUrl) from Warehouse
        let tenantInfo = null;
        try {
            tenantInfo = await resolveTenant(companyId, PRODUCT_CODE);
        } catch (e) {
            tenantInfo = null;
        }
        if (!tenantInfo || !tenantInfo.dbUrl) {
            return NextResponse.redirect(
                `${fallback}?reason=tenant_unresolved`
            );
        }

        // 2) Create prisma client for tenant DB
        const prisma = prismaFor(tenantInfo.dbUrl);

        // 3) Read token record to validate exists & expiry
        const rec = await prisma.magicLinkToken.findUnique({
            where: { token },
        });
        if (!rec)
            return NextResponse.redirect(`${fallback}?reason=invalid_token`);
        if (rec.expiresAt <= new Date())
            return NextResponse.redirect(`${fallback}?reason=expired`);

        // 4) Record first-used time for audit, but DO NOT block reuse.
        try {
            const now = new Date();
            await prisma.magicLinkToken.updateMany({
                where: { token, usedAt: null },
                data: { usedAt: now },
            });
            // ignore result — we allow reuse
        } catch (e) {
            console.warn("[magic] failed to write usedAt audit:", String(e));
        }

        // 5) Re-fetch token with user relation
        const recFull = await prisma.magicLinkToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!recFull)
            return NextResponse.redirect(`${fallback}?reason=invalid_token2`);
        const user = recFull.user;
        if (!user || !user.isActive)
            return NextResponse.redirect(`${fallback}?reason=inactive_user`);

        // ensure token's user belongs to the tenant we resolved
        if (
            tenantInfo.companyId &&
            user.companyId &&
            tenantInfo.companyId !== user.companyId
        ) {
            console.warn("[magic] tenant mismatch token->user", {
                token,
                tenant: tenantInfo.companyId,
                userCompany: user.companyId,
            });
            return NextResponse.redirect(`${fallback}?reason=tenant_mismatch`);
        }

        // 6) Fetch tenant info again (we already have tenantInfo) -> get addons if any
        let addons: string[] = [];
        if (tenantInfo.subscriptionInstanceId) {
            addons = await fetchAddons(tenantInfo.subscriptionInstanceId).catch(
                () => []
            );
        }

        // 7) Build JWT (parity with login route)
        const jwtSecret = process.env.JWT_SECRET || "supersecret";
        const jwtToken = jwt.sign(
            {
                sub: user.id,
                username: user.username,
                role: user.role,
                companyId: tenantInfo.companyId || companyId,
            },
            jwtSecret,
            { expiresIn: "1d" }
        );

        // 8) Destination (tagihan -> input-pembayaran, otherwise warga-dashboard)
        const origin = getOrigin(req);
        const dest = recFull.tagihanId
            ? `${origin}/input-pembayaran/${encodeURIComponent(
                  recFull.tagihanId
              )}`
            : `${origin}/warga-dashboard`;
        const res = NextResponse.redirect(dest);

        // 9) Set cookies (mirror login route)
        res.cookies.set("tb_token", jwtToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        res.cookies.set(
            "tb_session",
            encodeCookie({
                uid: user.id,
                uname: user.username,
                role: user.role,
                companyId: tenantInfo.companyId || companyId,
            }),
            {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 8,
            }
        );

        res.cookies.set("tb_user_id", user.id, {
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        if (tenantInfo.companyId) {
            res.cookies.set("tb_company", tenantInfo.companyId, {
                httpOnly: false,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24,
            });
        }

        if (tenantInfo.dbUrl) {
            res.cookies.set(
                "tb_tenant",
                encodeCookie({
                    companyId: tenantInfo.companyId,
                    productCode: tenantInfo.productCode,
                    dbUrl: tenantInfo.dbUrl,
                    packageCode: tenantInfo.packageCode,
                }),
                {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24 * 30,
                }
            );
        }

        if (tenantInfo.packageCode) {
            const PKG_TO_OFFERING: Record<string, string> = {
                BASIC: "basic",
                PREMIUM: "premium",
                ENTERPRISE: "enterprise",
            };
            const offering =
                PKG_TO_OFFERING[
                    String(tenantInfo.packageCode || "").toUpperCase()
                ] || "basic";
            res.cookies.set("tb_offering", offering, {
                httpOnly: false,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24,
            });
        }

        const companyCookieKey = tenantInfo.companyId || companyId;
        if (addons.length && companyCookieKey) {
            res.cookies.set(
                `tb_addons__${companyCookieKey}`,
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

        // 10) Update lastLoginAt (best-effort)
        await prisma.user
            .update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            })
            .catch(() => {});

        return res;
    } catch (e) {
        console.error("[magic] err", e);
        const origin = getOrigin(req);
        const fallback = `${origin}/unauthorized`;
        return NextResponse.redirect(`${fallback}?reason=server_error`);
    }
}
