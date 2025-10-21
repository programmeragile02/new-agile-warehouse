import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// app/api/jadwal/options/zona/route.ts
export const runtime = "nodejs";

export async function GET() {
  const prisma = await db();
  try {
    const zonas = await prisma.zona.findMany({
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    });

    // ✅ langsung sesuai: { id, nama }
    return NextResponse.json({ ok: true, data: zonas });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
