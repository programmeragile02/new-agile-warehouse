import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
const prisma = db();

export async function GET(req: NextRequest) {
  try {
    const tagihanId = req.nextUrl.searchParams.get("tagihanId") || "";
    if (!tagihanId) {
      return NextResponse.json(
        { ok: false, message: "tagihanId wajib" },
        { status: 400 }
      );
    }

    const list = await prisma.pembayaran.findMany({
      where: { tagihanId, deletedAt: null },
      orderBy: { tanggalBayar: "desc" },
      select: {
        id: true,
        tanggalBayar: true,
        jumlahBayar: true,
        buktiUrl: true,
        metode: true,
        adminBayar: true,
        keterangan: true,
      },
    });

    return NextResponse.json({ ok: true, pembayaran: list[0] ?? null });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
