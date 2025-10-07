// app/api/tandon/list/route.ts
const prisma = db();
export async function GET() {
  const items = await prisma.tandon.findMany({
    orderBy: { nama: "asc" },
    select: { id: true, kode: true, nama: true },
  });
  return NextResponse.json({ items });
}
