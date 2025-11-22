import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const prisma = await db();
    const roles = await prisma.appRole.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ ok: true, data: roles });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const prisma = await db();
    const body = await req.json();
    const role = await prisma.appRole.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json({ ok: true, data: role });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}