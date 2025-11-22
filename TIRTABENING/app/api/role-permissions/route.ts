import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const prisma = await db();
        const url = new URL(req.url);
        const roleId = url.searchParams.get("roleId") || undefined;

        const links = await prisma.rolePermission.findMany({
            where: { ...(roleId ? { roleId } : {}) },
        });

        return NextResponse.json({ ok: true, data: links });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const prisma = await db();
        const body = await req.json();
        const { roleId, permissionId, canView, canAdd, canEdit, canDelete } =
            body;

        const link = await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId, permissionId } },
            create: {
                roleId,
                permissionId,
                canView: !!canView,
                canAdd: !!canAdd,
                canEdit: !!canEdit,
                canDelete: !!canDelete,
            },
            update: {
                ...(canView !== undefined ? { canView } : {}),
                ...(canAdd !== undefined ? { canAdd } : {}),
                ...(canEdit !== undefined ? { canEdit } : {}),
                ...(canDelete !== undefined ? { canDelete } : {}),
            },
        });

        return NextResponse.json({ ok: true, data: link });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}
