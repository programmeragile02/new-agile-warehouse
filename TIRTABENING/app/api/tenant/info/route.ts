import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";

export async function GET() {
    try {
        const tenant = await getTenantContext();
        if (!tenant)
            return NextResponse.json(
                { ok: false, message: "Not logged in" },
                { status: 401 }
            );

        const offering = tenant.packageCode
            ? String(tenant.packageCode).toLowerCase()
            : null;
        return NextResponse.json({ ok: true, offering });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message || "Server error" },
            { status: 500 }
        );
    }
}
