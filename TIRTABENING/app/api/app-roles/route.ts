import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const appRoleSelect = {
    id: true,
    name: true,
    description: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};

export async function GET(req: NextRequest) {
    const prisma = await db();
    const sp = req.nextUrl.searchParams;

    // optional query params:
    // ?onlyActive=1  => hanya role aktif
    // ?q=admin       => filter by nama/description
    const onlyActiveParam = sp.get("onlyActive") ?? "1";
    const q = (sp.get("q") ?? "").trim();

    const onlyActive = onlyActiveParam === "1" || onlyActiveParam === "true";

    // kalau mau memastikan tenant context/productCode, bisa uncomment:
    // await getTenantContextOrThrow(process.env.NEXT_PUBLIC_PRODUCT_CODE || "NATABANYU");

    const where: any = {};

    if (onlyActive) {
        where.isActive = true;
    }

    if (q) {
        where.OR = [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
        ];
    }

    const items = await prisma.appRole.findMany({
        where,
        orderBy: { name: "asc" },
        select: appRoleSelect,
    });

    return NextResponse.json({
        ok: true,
        items,
    });
}
