//
// app/api/support/threads/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const prisma = await db();
    const item = await prisma.supportThread.findUnique({
        where: { id: params.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!item)
        return NextResponse.json(
            { ok: false, message: "Not found" },
            { status: 404 }
        );
    return NextResponse.json({ ok: true, item });
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const prisma = await db();
    const { status, topic } = await req.json();
    const item = await prisma.supportThread.update({
        where: { id: params.id },
        data: { status, topic },
    });
    return NextResponse.json({ ok: true, item });
}
