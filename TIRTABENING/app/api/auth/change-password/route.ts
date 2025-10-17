// import { NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { verifyPasswordAny, hashPassword } from "@/lib/auth-utils";
// import { decodeCookie } from "@/lib/auth-session";

// export async function POST(req: Request) {
//     const prisma = await db();
//     try {
//         const { currentPassword, newPassword } = await req
//             .json()
//             .catch(() => ({}));
//         if (!newPassword) {
//             return NextResponse.json(
//                 { ok: false, message: "Password baru wajib diisi" },
//                 { status: 400 }
//             );
//         }
//         // validasi sederhana (samain sama UI)
//         if (newPassword.length < 8) {
//             return NextResponse.json(
//                 { ok: false, message: "Password minimal 8 karakter" },
//                 { status: 422 }
//             );
//         }

//         // Ambil user dari cookie sesi HMAC
//         const cookie = req.headers.get("cookie") ?? "";
//         const session = cookie.match(/tb_session=([^;]+)/)?.[1];
//         if (!session)
//             return NextResponse.json(
//                 { ok: false, message: "Not authenticated" },
//                 { status: 401 }
//             );

//         const s = decodeCookie<{ uid: string }>(session);
//         if (!s?.uid)
//             return NextResponse.json(
//                 { ok: false, message: "Invalid session" },
//                 { status: 401 }
//             );

//         const user = await prisma.user.findUnique({ where: { id: s.uid } });
//         if (!user || !user.isActive) {
//             return NextResponse.json(
//                 { ok: false, message: "User tidak ditemukan / nonaktif" },
//                 { status: 401 }
//             );
//         }

//         // RULE:
//         // - Jika mustChangePassword = true  -> TIDAK perlu currentPassword (first-login)
//         // - Jika mustChangePassword = false -> WAJIB currentPassword (ubah normal)
//         if (!user.mustChangePassword) {
//             if (!currentPassword) {
//                 return NextResponse.json(
//                     { ok: false, message: "Password saat ini wajib diisi" },
//                     { status: 400 }
//                 );
//             }
//             const ok = await verifyPasswordAny(
//                 currentPassword,
//                 user.passwordHash
//             );
//             if (!ok)
//                 return NextResponse.json(
//                     { ok: false, message: "Password saat ini salah" },
//                     { status: 401 }
//                 );
//         }

//         await prisma.user.update({
//             where: { id: user.id },
//             data: {
//                 passwordHash: await hashPassword(newPassword),
//                 mustChangePassword: false, // selesai first-login
//                 lastPasswordChangeAt: new Date(),
//                 lastLoginAt: new Date(), // tandai login selesai
//             },
//         });

//         return NextResponse.json({
//             ok: true,
//             message: "Password berhasil diubah",
//         });
//     } catch (e: any) {
//         return NextResponse.json(
//             { ok: false, message: e?.message ?? "Server error" },
//             { status: 500 }
//         );
//     }
// }

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPasswordAny, hashPassword } from "@/lib/auth-utils";
import { decodeCookie } from "@/lib/auth-session";
import { getTenantContext } from "@/lib/tenant-context"; // ← ambil companyId/productCode dari cookie tb_tenant
import { syncUserPasswordToWarehouse } from "@/lib/tenant-registry";

export async function POST(req: Request) {
    const prisma = await db();
    try {
        const { currentPassword, newPassword } = await req
            .json()
            .catch(() => ({}));
        if (!newPassword) {
            return NextResponse.json(
                { ok: false, message: "Password baru wajib diisi" },
                { status: 400 }
            );
        }
        if (newPassword.length < 8) {
            return NextResponse.json(
                { ok: false, message: "Password minimal 8 karakter" },
                { status: 422 }
            );
        }

        // Ambil session user
        const cookie = req.headers.get("cookie") ?? "";
        const session = cookie.match(/tb_session=([^;]+)/)?.[1];
        if (!session)
            return NextResponse.json(
                { ok: false, message: "Not authenticated" },
                { status: 401 }
            );

        const s = decodeCookie<{ uid: string }>(session);
        if (!s?.uid)
            return NextResponse.json(
                { ok: false, message: "Invalid session" },
                { status: 401 }
            );

        const user = await prisma.user.findUnique({ where: { id: s.uid } });
        if (!user || !user.isActive) {
            return NextResponse.json(
                { ok: false, message: "User tidak ditemukan / nonaktif" },
                { status: 401 }
            );
        }

        // RULE: first-login tidak butuh currentPassword
        if (!user.mustChangePassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { ok: false, message: "Password saat ini wajib diisi" },
                    { status: 400 }
                );
            }
            const ok = await verifyPasswordAny(
                currentPassword,
                user.passwordHash
            );
            if (!ok)
                return NextResponse.json(
                    { ok: false, message: "Password saat ini salah" },
                    { status: 401 }
                );
        }

        // 1) Update di tenant
        const newHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newHash,
                mustChangePassword: false,
                lastPasswordChangeAt: new Date(),
                lastLoginAt: new Date(),
            },
        });

        // 2) Sync ke Warehouse (best-effort; tidak memblok sukses lokal)
        try {
            const tenantCtx = await getTenantContext(
                process.env.NEXT_PUBLIC_PRODUCT_CODE || "NATABANYU"
            );
            if (!tenantCtx)
                return NextResponse.json(
                    { ok: false, message: "Tenant context hilang" },
                    { status: 401 }
                );

            await syncUserPasswordToWarehouse({
                productCode: tenantCtx?.productCode,
                companyId: tenantCtx?.companyId,
                email: user.username, // username kita isi email
                newPassword,
            });
        } catch (e) {
            // swallow error tapi bisa kamu log ke observability
            console.error(
                "[change-password] sync warehouse failed:",
                (e as any)?.message
            );
        }

        return NextResponse.json({
            ok: true,
            message: "Password berhasil diubah",
        });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
