// import { NextResponse } from "next/server";
// import { encodeCookie } from "@/lib/auth-session";
// import { verifyPasswordAny } from "@/lib/auth-utils"; // pakai util kamu
// import { db } from "@/lib/db";
// import jwt from "jsonwebtoken";

// // Opsi paket yang valid (samakan dengan yang ada di Warehouse/Panel)
// const OFFERING_WHITELIST = new Set(["basic", "premium", "enterprise"]);

// function normalizeOffering(v?: unknown): string | undefined {
//     if (typeof v !== "string") return undefined;
//     const s = v.trim().toLowerCase();
//     return OFFERING_WHITELIST.has(s) ? s : undefined;
// }

// export async function POST(req: Request) {
//     const prisma = await db();
//     try {
//         const body = await req.json().catch(() => ({}));
//         const { username, password } = body as {
//             username?: string;
//             password?: string;
//             offering?: string;
//         };

//         if (!username || !password) {
//             return NextResponse.json(
//                 { ok: false, message: "Invalid body" },
//                 { status: 400 }
//             );
//         }

//         // Ambil prisma dari tenant cookie
//         // const productCode = process.env.NEXT_PUBLIC_PRODUCT_CODE!;
//         // const { dbUrl } = await getTenantContextOrThrow(productCode);
//         // const prisma = prismaFor(dbUrl);

//         const user = await prisma.user.findUnique({ where: { username } });
//         if (!user || !user.isActive) {
//             return NextResponse.json(
//                 { ok: false, message: "User tidak ditemukan / nonaktif" },
//                 { status: 401 }
//             );
//         }

//         const ok = await verifyPasswordAny(password, user.passwordHash);
//         if (!ok)
//             return NextResponse.json(
//                 { ok: false, message: "Password salah" },
//                 { status: 401 }
//             );

//         // Tentukan offering aktif:
//         // 1) dari body, 2) dari kolom user (jika ada), 3) dari env DEFAULT_OFFERING, 4) fallback "basic"
//         const offeringFromBody = normalizeOffering((body as any)?.offering);
//         // @ts-expect-error: kolom opsional, abaikan error TS jika tidak ada di schema
//         const offeringFromUser = normalizeOffering(user?.offeringSlug);
//         const offeringFromEnv = normalizeOffering(process.env.DEFAULT_OFFERING);

//         const offering =
//             offeringFromBody || offeringFromUser || offeringFromEnv || "basic"; // fallback terakhir

//         // Buat JWT
//         const token = jwt.sign(
//             { sub: user.id, username: user.username, role: user.role },
//             process.env.JWT_SECRET || "supersecret",
//             { expiresIn: "1d" }
//         );

//         // Buat cookie sesi HMAC (ganti JWT lama)
//         const sessionCookie = encodeCookie({
//             uid: user.id,
//             uname: user.username,
//             role: user.role,
//         });

//         const res = NextResponse.json({
//             ok: true,
//             user: {
//                 id: user.id,
//                 username: user.username,
//                 role: user.role,
//                 name: user.name,
//             },
//             offering
//         });

//         // Cookie auth (HttpOnly)
//         res.cookies.set("tb_token", token, {
//             httpOnly: true,
//             sameSite: "lax",
//             secure: process.env.NODE_ENV === "production",
//             path: "/",
//             maxAge: 60 * 60 * 24, // 1 hari
//         });

//         // Cookie OFFERING (non-HttpOnly → dibaca AppHeader dari client)
//         res.cookies.set("tb_offering", offering, {
//             httpOnly: false,
//             sameSite: "lax",
//             secure: process.env.NODE_ENV === "production",
//             path: "/",
//             maxAge: 60 * 60 * 24, // 1 hari
//         });

//         res.cookies.set("tb_session", sessionCookie, {
//             httpOnly: true,
//             sameSite: "lax",
//             secure: process.env.NODE_ENV === "production",
//             path: "/",
//             maxAge: 60 * 60 * 8, // 8 jam
//         });

//         return res;
//     } catch (e: any) {
//         return NextResponse.json(
//             { ok: false, message: e?.message ?? "Server error" },
//             { status: 500 }
//         );
//     }
// }

import { NextResponse } from "next/server";
import { encodeCookie } from "@/lib/auth-session";
import { verifyPasswordAny } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const OFFERING_WHITELIST = new Set(["basic", "premium", "enterprise"]);
const normalizeOffering = (v?: unknown) =>
  typeof v === "string" && OFFERING_WHITELIST.has(v.trim().toLowerCase())
    ? v.trim().toLowerCase()
    : undefined;

export async function POST(req: Request) {
  const prisma = await db();
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body as { username?: string; password?: string; offering?: string; };

    if (!username || !password) {
      return NextResponse.json({ ok:false, message:"Invalid body" }, { status:400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      return NextResponse.json({ ok:false, message:"User tidak ditemukan / nonaktif" }, { status:401 });
    }

    const ok = await verifyPasswordAny(password, user.passwordHash);
    if (!ok) return NextResponse.json({ ok:false, message:"Password salah" }, { status:401 });

    const offering =
      normalizeOffering((body as any)?.offering) ||
      // @ts-ignore optional
      normalizeOffering((user as any)?.offeringSlug) ||
      normalizeOffering(process.env.DEFAULT_OFFERING) ||
      "basic";

    // token + session
    const token = jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "1d" }
    );
    const sessionCookie = encodeCookie({ uid: user.id, uname: user.username, role: user.role });

    const requirePasswordChange = !!user.mustChangePassword;

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role, name: user.name },
      offering,
      requirePasswordChange, // ← kunci untuk client
    });

    // cookie
    res.cookies.set("tb_token", token, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60*60*24,
    });
    res.cookies.set("tb_offering", offering, {
      httpOnly: false, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60*60*24,
    });
    res.cookies.set("tb_session", sessionCookie, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60*60*8,
    });

    // **Tidak** update lastLoginAt dulu kalau mustChangePassword=true
    if (!requirePasswordChange) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok:false, message: e?.message ?? "Server error" }, { status:500 });
  }
}