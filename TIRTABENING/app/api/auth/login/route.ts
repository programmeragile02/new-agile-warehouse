// // app/api/auth/login/route.ts
// import { NextResponse } from "next/server";
// import { db } from "@/lib/db";// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export async function POST(req: Request) {
//   try {
//     const { username, password } = await req.json();

//     if (!username || !password) {
//       return NextResponse.json(
//         { ok: false, message: "Invalid body" },
//         { status: 400 }
//       );
//     }
//     console.log("[LOGIN] body =", { username, password });

//     const user = await prisma.user.findUnique({ where: { username } });
//     if (!user || !user.isActive) {
//       console.log("[LOGIN] user tidak ditemukan atau nonaktif");
//       return NextResponse.json(
//         { ok: false, message: "User tidak ditemukan / nonaktif" },
//         { status: 401 }
//       );
//     }
//     console.log("[LOGIN] prisma.user.findUnique →", user);
//     const ok = await bcrypt.compare(password, user.passwordHash);
//     if (!ok) {
//       console.log("[LOGIN] password cocok?", ok);
//       return NextResponse.json(
//         { ok: false, message: "Password salah" },
//         { status: 401 }
//       );
//     }

//     // buat token
//     const token = jwt.sign(
//       { sub: user.id, username: user.username, role: user.role },
//       process.env.JWT_SECRET || "supersecret",
//       { expiresIn: "1d" }
//     );

//     // response + set cookie httpOnly
//     const res = NextResponse.json({
//       ok: true,
//       user: {
//         id: user.id,
//         username: user.username,
//         role: user.role,
//         name: user.name,
//       },
//     });

//     res.cookies.set("tb_token", token, {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: process.env.NODE_ENV === "production",
//       path: "/",
//       maxAge: 60 * 60 * 24, // 1 hari
//     });

//     return res;
//   } catch (e: unknown) {
//     return NextResponse.json(
//       { ok: false, message: e.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from "next/server";
import { getTenantContextOrThrow } from "@/lib/tenant-context";
import { prismaFor } from "@/lib/prisma-tenant";
import { encodeCookie } from "@/lib/auth-session";
import { verifyPasswordAny } from "@/lib/auth-utils"; // pakai util kamu\

// Opsi paket yang valid (samakan dengan yang ada di Warehouse/Panel)
const OFFERING_WHITELIST = new Set(["basic", "premium", "enterprise"]);

function normalizeOffering(v?: unknown): string | undefined {
    if (typeof v !== "string") return undefined;
    const s = v.trim().toLowerCase();
    return OFFERING_WHITELIST.has(s) ? s : undefined;
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { username, password } = body as {
            username?: string;
            password?: string;
            offering?: string;
        };

        if (!username || !password) {
            return NextResponse.json(
                { ok: false, message: "Invalid body" },
                { status: 400 }
            );
        }

        // Ambil prisma dari tenant cookie
        const productCode = process.env.NEXT_PUBLIC_PRODUCT_CODE!;
        const { dbUrl } = getTenantContextOrThrow(productCode);
        const prisma = prismaFor(dbUrl);

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.isActive) {
            return NextResponse.json(
                { ok: false, message: "User tidak ditemukan / nonaktif" },
                { status: 401 }
            );
        }

        const ok = await verifyPasswordAny(password, user.passwordHash);
        if (!ok)
            return NextResponse.json(
                { ok: false, message: "Password salah" },
                { status: 401 }
            );

        // Tentukan offering aktif:
        // 1) dari body, 2) dari kolom user (jika ada), 3) dari env DEFAULT_OFFERING, 4) fallback "basic"
        const offeringFromBody = normalizeOffering((body as any)?.offering);
        // @ts-expect-error: kolom opsional, abaikan error TS jika tidak ada di schema
        const offeringFromUser = normalizeOffering(user?.offeringSlug);
        const offeringFromEnv = normalizeOffering(process.env.DEFAULT_OFFERING);

        const offering =
            offeringFromBody || offeringFromUser || offeringFromEnv || "basic"; // fallback terakhir

        // Buat JWT
        const token = jwt.sign(
            { sub: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || "supersecret",
            { expiresIn: "1d" }
        );

        // Buat cookie sesi HMAC (ganti JWT lama)
        const sessionCookie = encodeCookie({
            uid: user.id,
            uname: user.username,
            role: user.role,
        });

        const res = NextResponse.json({
            ok: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
            },
            offering
        });

        // Cookie auth (HttpOnly)
        res.cookies.set("tb_token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24, // 1 hari
        });

        // Cookie OFFERING (non-HttpOnly → dibaca AppHeader dari client)
        res.cookies.set("tb_offering", offering, {
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24, // 1 hari
        });

        res.cookies.set("tb_session", sessionCookie, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 8, // 8 jam
        });

        return res;
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
