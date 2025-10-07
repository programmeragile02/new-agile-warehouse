// app/api/debug/tenant/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";

export async function GET() {
  const ctx = getTenantContext(process.env.NEXT_PUBLIC_PRODUCT_CODE);
  return NextResponse.json({ ctx });
}
