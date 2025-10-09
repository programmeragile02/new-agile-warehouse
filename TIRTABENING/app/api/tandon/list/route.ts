import { db } from "@/lib/db";

// app/api/tandon/list/route.ts
export async function GET() {
  const prisma = await db();
  const items = await prisma.tandon.findMany({
    orderBy: { nama: "asc" },
    select: { id: true, kode: true, nama: true },
  });
  return NextResponse.json({ items });
}
