// app/api/jadwal/[id]/start/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
const prisma = db();

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    // Hanya update bila belum DONE
    await prisma.jadwalPencatatan.updateMany({
      where: { id: params.id, NOT: { status: "DONE" } },
      data: { status: "IN_PROGRESS" },
    });
    return NextResponse.json({ ok: true, message: "Pencatatan dimulai." });
  } catch (e: any) {
    if (e?.code === "P2025")
      return NextResponse.json(
        { ok: false, message: "Jadwal tidak ditemukan" },
        { status: 404 }
      );
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
