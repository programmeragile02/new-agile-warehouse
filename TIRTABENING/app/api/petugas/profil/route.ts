// app/api/petugas/profil/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthUserId } from "@/lib/auth";
import { getTenantContextOrThrow } from "@/lib/tenant-context";
import { warehouseUpsertCpiu } from "@/lib/warehouse-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// true di dev agar kirim "reason" (jangan aktifkan di prod)
const DEV_DEBUG = process.env.NODE_ENV !== "production";

const userSelect = {
    id: true,
    username: true,
    name: true,
    phone: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    zonasDipegang: { select: { id: true, kode: true, nama: true } },
} as const;

/* =========================
   GET: data profil petugas
========================= */
export async function GET(req: NextRequest) {
    const prisma = await db();
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json(
                { ok: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId, deletedAt: null },
            select: userSelect,
        });

        if (!user) {
            return NextResponse.json(
                { ok: false, message: "User tidak ditemukan" },
                { status: 404 }
            );
        }

        const data = {
            id: user.id,
            username: user.username,
            name: user.name,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            zonas: (user.zonasDipegang ?? []).map((z) => ({
                id: z.id,
                kode: z.kode,
                nama: z.nama,
            })),
        };

        return NextResponse.json({ ok: true, data });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message || "Server error" },
            { status: 500 }
        );
    }
}

/* =====================================
   PUT: update nama / telepon profil
===================================== */
export async function PUT(req: NextRequest) {
    const prisma = await db();
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json(
                { ok: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json().catch(() => ({} as any));
        const name = String(body?.name ?? "").trim();
        const phoneRaw = body?.phone;
        const phone = typeof phoneRaw === "string" ? phoneRaw.trim() : null;

        if (!name) {
            return NextResponse.json(
                { ok: false, message: "Nama wajib diisi" },
                { status: 400 }
            );
        }

        await prisma.user.update({
            where: { id: userId },
            data: { name, phone: phone || null },
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message || "Server error" },
            { status: 500 }
        );
    }
}

/* ==========================================
   PATCH: ganti sandi profil petugas (sinkron)
========================================== */
export async function PATCH(req: NextRequest) {
    const prisma = await db();
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json(
                { ok: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json().catch(() => ({} as any));
        const oldPassword = String(body?.oldPassword ?? "").trim();
        const newPassword = String(body?.newPassword ?? "").trim();
        const force = !!body?.force && process.env.NODE_ENV !== "production"; // ← DEV only

        if (!force) {
            if (!oldPassword || !newPassword) {
                return NextResponse.json(
                    { ok: false, message: "Sandi lama & baru wajib diisi" },
                    { status: 400 }
                );
            }
            if (newPassword.length < 6) {
                return NextResponse.json(
                    { ok: false, message: "Sandi baru minimal 6 karakter" },
                    { status: 400 }
                );
            }
        } else {
            // saat force, tetap batasi panjang minimum
            if (newPassword.length < 6) {
                return NextResponse.json(
                    { ok: false, message: "Sandi baru minimal 6 karakter" },
                    { status: 400 }
                );
            }
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, passwordHash: true },
        });
        if (!user) {
            return NextResponse.json(
                { ok: false, message: "User tidak ditemukan" },
                { status: 404 }
            );
        }

        const currentHash = user.passwordHash || "";
        const hashPrefix = currentHash.slice(0, 10);

        if (!force) {
            if (currentHash.startsWith("scrypt:")) {
                return NextResponse.json(
                    {
                        ok: false,
                        message:
                            "Akun ini masih memakai format sandi lama (scrypt). Minta admin migrasi/ubah sandi via panel admin.",
                        ...(DEV_DEBUG ? { reason: "hash-is-scrypt" } : {}),
                    },
                    { status: 409 }
                );
            }

            if (!currentHash || !currentHash.startsWith("$2")) {
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Sandi lama salah",
                        ...(DEV_DEBUG
                            ? { reason: "hash-not-bcrypt-or-empty", hashPrefix }
                            : {}),
                    },
                    { status: 400 }
                );
            }

            const okOld = await bcrypt.compare(oldPassword, currentHash);
            if (!okOld) {
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Sandi lama salah",
                        ...(DEV_DEBUG
                            ? { reason: "bcrypt-compare-false", hashPrefix }
                            : {}),
                    },
                    { status: 400 }
                );
            }
        }

        // generate hash baru & update lokal
        const newHash = await bcrypt.hash(newPassword, 10);
        const prevHash = currentHash;

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash },
        });

        const tenant = await getTenantContextOrThrow(
            process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING"
        );

        try {
            await warehouseUpsertCpiu({
                email: user.username,
                companyId: tenant.companyId,
                passwordPlain: newPassword,
                passwordHash: newHash,
            });
        } catch (err: any) {
            // rollback lokal bila sinkron gagal
            await prisma.user.update({
                where: { id: userId },
                data: { passwordHash: prevHash },
            });
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Gagal sinkron sandi ke server pusat. Coba ulangi.",
                    ...(DEV_DEBUG ? { reason: "warehouse-sync-failed" } : {}),
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            ok: true,
            ...(DEV_DEBUG ? { forced: force } : {}),
        });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message || "Server error" },
            { status: 500 }
        );
    }
}
