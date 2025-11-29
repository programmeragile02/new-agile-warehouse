import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getTenantContextOrThrow } from "@/lib/tenant-context";
import {
    warehouseSetCpiuActive,
    warehouseUpsertCpiu,
} from "@/lib/warehouse-users";

export const runtime = "nodejs";

const select = {
    id: true,
    username: true,
    name: true,
    phone: true,
    role: true,
    appRoleId: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    appRole: {
        select: {
            id: true,
            name: true,
        },
    },
};

export async function PUT(req: Request, context: { params: { id: string } }) {
    const prisma = await db();
    const id = context.params.id;
    const body = await req.json().catch(() => ({} as any));

    const { username, password, name, role, phone, appRoleId } = body as {
        username?: string;
        password?: string;
        name?: string;
        role?: string;
        phone?: string | null;
        appRoleId?: string;
    };

    const tenant = await getTenantContextOrThrow(
        process.env.NEXT_PUBLIC_PRODUCT_CODE || "NATABANYU"
    );

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        return NextResponse.json(
            { message: "User tidak ditemukan" },
            { status: 404 }
        );
    }

    if (user.companyId !== tenant.companyId) {
        return NextResponse.json(
            { ok: false, message: "Tidak diizinkan" },
            { status: 403 }
        );
    }

    if (username && username !== user.username) {
        return NextResponse.json(
            {
                message:
                    "Perubahan username/email tidak diizinkan lewat endpoint ini",
            },
            { status: 400 }
        );
    }

    let passwordHash: string | undefined;
    if (typeof password === "string" && password.length > 0) {
        passwordHash = await bcrypt.hash(password, 10);
    }

    let finalRoleLabel: string | undefined;
    let finalAppRoleId: string | null | undefined;

    if (typeof appRoleId === "string") {
        const appRole = await prisma.appRole.findUnique({
            where: { id: appRoleId },
        });
        if (!appRole) {
            return NextResponse.json(
                { ok: false, message: "Role tidak ditemukan" },
                { status: 400 }
            );
        }
        finalRoleLabel = appRole.name;
        finalAppRoleId = appRole.id;
    } else if (typeof role === "string") {
        finalRoleLabel = role.toUpperCase();
    }

    let updated;
    try {
        updated = await prisma.user.update({
            where: { id },
            data: {
                passwordHash,
                name: name ?? undefined,
                phone: phone ?? undefined,
                role: finalRoleLabel ?? undefined,
                appRoleId: finalAppRoleId,
            },
            select,
        });
    } catch (err) {
        console.error("Prisma update error:", err);
        return NextResponse.json(
            { ok: false, message: "Gagal memperbarui user" },
            { status: 500 }
        );
    }

    try {
        if (passwordHash) {
            await warehouseUpsertCpiu({
                email: user.username,
                companyId: user.companyId!,
                passwordPlain: password || undefined,
                passwordHash,
                isActive: updated.isActive,
            });
        }
    } catch (e) {
        console.error("CPIU upsert (PUT) error:", e);
    }

    return NextResponse.json(updated);
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
    const prisma = await db();
    const id = context.params.id;
    const body = await req.json().catch(() => ({} as any));
    const { action, isActive } = body as {
        action?: "toggle";
        isActive?: boolean;
    };

    const tenant = await getTenantContextOrThrow(
        process.env.NEXT_PUBLIC_PRODUCT_CODE || "NATABANYU"
    );

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
        return NextResponse.json(
            { message: "User tidak ditemukan" },
            { status: 404 }
        );

    if (user.companyId !== tenant.companyId) {
        return NextResponse.json(
            { ok: false, message: "Tidak diizinkan" },
            { status: 403 }
        );
    }

    if (
        user.username === "admin" &&
        action === "toggle" &&
        user.isActive &&
        isActive === false
    ) {
        // optional: batasi nonaktifkan admin
    }

    const nextActive =
        typeof isActive === "boolean" ? isActive : !user.isActive;

    const updated = await prisma.user.update({
        where: { id },
        data: { isActive: nextActive },
        select,
    });

    try {
        await warehouseSetCpiuActive({
            email: user.username,
            companyId: tenant.companyId,
            isActive: nextActive,
        });
    } catch (e) {
        console.error("CPIU setActive (PATCH) error:", e);
    }

    return NextResponse.json(updated);
}

export async function DELETE(
    _req: Request,
    context: { params: { id: string } }
) {
    const prisma = await db();
    const id = context.params.id;

    const tenant = await getTenantContextOrThrow(
        process.env.NEXT_PUBLIC_PRODUCT_CODE || "NATABANYU"
    );

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
        return NextResponse.json(
            { message: "User tidak ditemukan" },
            { status: 404 }
        );
    if (user.companyId !== tenant.companyId) {
        return NextResponse.json(
            { ok: false, message: "Tidak diizinkan" },
            { status: 403 }
        );
    }
    if (user.username === "admin") {
        return NextResponse.json(
            { message: 'User "admin" tidak boleh dihapus' },
            { status: 400 }
        );
    }

    let deleted;
    try {
        deleted = await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
            select,
        });
    } catch (err) {
        console.error("Prisma soft-delete error:", err);
        return NextResponse.json(
            { ok: false, message: "Gagal menghapus user" },
            { status: 500 }
        );
    }

    try {
        await warehouseSetCpiuActive({
            email: user.username,
            companyId: tenant.companyId,
            isActive: false,
        });
    } catch (e) {
        console.error("CPIU setActive (DELETE) error:", e);
    }

    return NextResponse.json(deleted);
}
