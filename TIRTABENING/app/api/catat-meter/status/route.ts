
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET(req: NextRequest) {
  const prisma = await db();
  const periode = req.nextUrl.searchParams.get("periode") ?? "";
  if (!/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json(
      { ok: false, message: "periode harus YYYY-MM" },
      { status: 400 }
    );
  }
  const cp = await prisma.catatPeriode.findUnique({
    where: { kodePeriode: periode },
  });
  return NextResponse.json({
    ok: true,
    status: cp?.status ?? "DRAFT",
    isLocked: cp?.isLocked ?? false,
    progress: cp
      ? { total: cp.totalPelanggan, selesai: cp.selesai, pending: cp.pending }
      : null,
  });
}
