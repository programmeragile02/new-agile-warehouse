import { NextRequest } from "next/server";
import { assertProductKey } from "@/lib/auth-public";
import { productMeta, mapFeatureRow, mapMenuRow } from "@/lib/map";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { code: string } }
) {
    const err = assertProductKey(req);
    if (err) return err;

    const code = String(params.code).toUpperCase();

    // Asumsi table: app_menus
    const rows = await prisma.mstMenu.findMany({
        where: { productCode: code, isActive: true },
        orderBy: [{ orderNumber: "asc" }],
    });

    const data = (rows || []).map(mapMenuRow);
    return Response.json({ data });
}
