import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";
import { db } from "@/lib/db";

const WA_SERVER_BASE = (
    process.env.WA_SENDER_URL || "http://localhost:4001"
).replace(/\/+$/, "");
const WA_SERVER_API_KEY = process.env.WA_SENDER_API_KEY || "";
const INTERNAL_CLIENT_ID =
    process.env.WA_INTERNAL_CLIENT_ID || "internal_natabanyu";

export async function POST() {
    const prisma = await db();

    const tenant = await getTenantContext();
    if (!tenant)
        return NextResponse.json(
            { ok: false, message: "Not logged in" },
            { status: 401 }
        );

    const companyId = tenant.companyId;

    const offering = tenant.packageCode
        ? String(tenant.packageCode).toLowerCase()
        : null;

    if (offering === "basic")
        return NextResponse.json(
            { ok: false, message: "Paket Basic tidak mendukung WhatsApp" },
            { status: 403 }
        );

    const clientId = offering === "premium" ? INTERNAL_CLIENT_ID : `tenant_${companyId}`;

    // call wa-sender to create client
    const url = `${WA_SERVER_BASE}/clients/${encodeURIComponent(clientId)}`;
    const r = await fetch(url, {
        method: "POST",
        headers: { "x-api-key": WA_SERVER_API_KEY },
    }).catch(() => null);
    if (!r)
        return NextResponse.json(
            { ok: false, message: "WA server unreachable" },
            { status: 503 }
        );
    const j = await r.json().catch(() => ({}));
    if (!r.ok)
        return NextResponse.json(
            { ok: false, message: j?.message || "create client failed" },
            { status: r.status }
        );

    // store mapping in DB
    try {
        await prisma.mstCompany.update({
            where: { company_id: companyId },
            data: { wa_client_id: clientId, wa_server_url: WA_SERVER_BASE },
        });
    } catch (err) {
        // log but don't fail (frontend will still poll QR)
        console.error("Failed to update mst_company.wa_client_id:", err);
    }

    return NextResponse.json({ ok: true, clientId });
}
