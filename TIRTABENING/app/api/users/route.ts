import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getTenantContextOrThrow } from "@/lib/tenant-context";
import { warehouseUpsertCpiu } from "@/lib/warehouse-users";

export const runtime = "nodejs";

const userSelect = {
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
} satisfies Prisma.UserSelect;

export async function GET(req: NextRequest) {
    const prisma = await db();
    const sp = req.nextUrl.searchParams;

    const roleParam = (sp.get("role") ?? "").trim().toUpperCase();
    const q = (sp.get("q") ?? "").trim();
    const pageRaw = parseInt(sp.get("page") ?? "1", 10);
    const sizeRaw = parseInt(sp.get("pageSize") ?? "50", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const pageSize =
        Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.min(sizeRaw, 100) : 50;

    // multi-tenant: batasi ke companyId tenant yang aktif
    const tenant = await getTenantContextOrThrow(
        process.env.NEXT_PUBLIC_PRODUCT_CODE || "NATABANYU"
    );

    const whereBase: Prisma.UserWhereInput = {
        deletedAt: null,
        isActive: true,
        companyId: tenant.companyId,
    };

    const whereRole: Prisma.UserWhereInput = roleParam
        ? { role: roleParam }
        : {};

    const whereSearch: Prisma.UserWhereInput = q
        ? {
              OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { username: { contains: q, mode: "insensitive" } },
                  { phone: { contains: q } },
              ],
          }
        : {};

    const where: Prisma.UserWhereInput = {
        AND: [whereBase, whereRole, whereSearch],
    };

    const total = await prisma.user.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    const items = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: (safePage - 1) * pageSize,
        take: pageSize,
        select: userSelect,
    });

    return NextResponse.json({
        ok: true,
        items,
        pagination: { page: safePage, pageSize, total, totalPages },
    });
}

export async function POST(req: Request) {
    const prisma = await db();
    const body = await req.json().catch(() => ({} as any));

    const { username, password, name, role, phone, appRoleId } = body as {
        username?: string; // email
        password?: string;
        name?: string;
        role?: string; // label "ADMIN" / "PETUGAS" / ...
        phone?: string | null;
        appRoleId?: string; // FK ke AppRole
    };

    if (!username || !password || !name) {
        return NextResponse.json(
            { ok: false, message: "username, password, name wajib diisi" },
            { status: 400 }
        );
    }

    const tenant = await getTenantContextOrThrow(
        process.env.NEXT_PUBLIC_PRODUCT_CODE || "NATABANYU"
    );

    const exists = await prisma.user.findFirst({
        where: {
            username,
            companyId: tenant.companyId,
            deletedAt: null,
        },
    });

    if (exists) {
        return NextResponse.json(
            { ok: false, message: "Username sudah dipakai" },
            { status: 409 }
        );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Tentukan AppRole + label role
    let finalAppRoleId: string | null = null;
    let finalRoleLabel: string | null = null;

    if (appRoleId) {
        const appRole = await prisma.appRole.findUnique({
            where: { id: appRoleId },
        });
        if (!appRole) {
            return NextResponse.json(
                { ok: false, message: "Role tidak ditemukan" },
                { status: 400 }
            );
        }
        finalAppRoleId = appRole.id;
        finalRoleLabel = appRole.name;
    } else if (role) {
        finalRoleLabel = role.toUpperCase();
    } else {
        const wargaRole = await prisma.appRole.findUnique({
            where: { name: "WARGA" },
        });
        if (wargaRole) {
            finalAppRoleId = wargaRole.id;
            finalRoleLabel = wargaRole.name;
        } else {
            finalRoleLabel = "WARGA";
        }
    }

    let created;
    try {
        created = await prisma.user.create({
            data: {
                username,
                passwordHash,
                name,
                role: finalRoleLabel,
                appRoleId: finalAppRoleId,
                phone: phone ?? null,
                isActive: true,
                companyId: tenant.companyId,
            },
            select: userSelect,
        });
    } catch (err: any) {
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
        ) {
            return NextResponse.json(
                { ok: false, message: "Username sudah dipakai" },
                { status: 409 }
            );
        }
        throw err;
    }

    // Sinkron CPIU (rollback bila gagal)
    try {
        await warehouseUpsertCpiu({
            email: username,
            companyId: tenant.companyId,
            passwordPlain: password,
            passwordHash,
            isActive: true,
        });
    } catch (e) {
        await prisma.user.delete({ where: { id: created.id } });
        return NextResponse.json(
            { ok: false, message: "Sync Warehouse gagal" },
            { status: 502 }
        );
    }

    return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
