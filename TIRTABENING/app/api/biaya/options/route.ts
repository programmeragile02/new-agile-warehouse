// app/api/biaya/options/route.ts
import { db } from "@/lib/db";

export async function GET() {
  const prisma = await db();
  const items = await prisma.masterBiaya.findMany({
    where: { status: "Aktif" },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true, kode: true },
  });
  return NextResponse.json({ items });
}
