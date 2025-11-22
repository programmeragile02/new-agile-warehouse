import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const prisma = await db();
        const body = await req.json();
        const role = await prisma.appRole.update({
            where: { id: params.id },
            data: {
                name: body.name,
                description: body.description,
                isActive: body.isActive,
            },
        });
        return NextResponse.json({ ok: true, data: role });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const prisma = await db();
        await prisma.appRole.delete({ where: { id: params.id } });
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}
