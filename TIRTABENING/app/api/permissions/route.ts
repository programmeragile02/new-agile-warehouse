import { db } from "@/lib/db";
import { NextResponse } from "next/server";

function toStr(x: unknown) {
  return typeof x === "bigint" ? x.toString() : (x as any);
}

export async function GET() {
  try {
    const prisma = await db();
    const productCode = process.env.NEXT_PUBLIC_PRODUCT_CODE!;

    // Ambil semua menu aktif untuk productCode ini
    const menus = await prisma.mstMenu.findMany({
      where: { isActive: true, productCode },
      orderBy: [{ level: "asc" }, { orderNumber: "asc" }],
    });

    // Map parent sekali
    const byId = new Map(menus.map((m) => [m.id.toString(), m]));
    const parentTitle = (m: (typeof menus)[number]) => {
      if (!m.parentId) return null;
      const p = byId.get(m.parentId.toString());
      return p?.title ?? null;
    };

    // Upsert AppPermission per menu
    await Promise.all(
      menus.map((m) =>
        prisma.appPermission.upsert({
          where: { menuId: m.id },
          update: {
            menuTitle: m.title,
            category: parentTitle(m) ?? undefined,
            productCode: m.productCode ?? undefined,
            isActive: m.isActive,
          },
          create: {
            menuId: m.id,
            menuTitle: m.title,
            category: parentTitle(m) ?? undefined,
            productCode: m.productCode ?? undefined,
            isActive: m.isActive,
          },
        })
      )
    );

    // Ambil permissions hasil sinkron
    const permissions = await prisma.appPermission.findMany({
      where: { isActive: true, productCode },
      orderBy: [{ category: "asc" }, { menuTitle: "asc" }],
    });

    // BigInt → string
    const data = permissions.map((p) => ({ ...p, menuId: toStr(p.menuId) }));
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}