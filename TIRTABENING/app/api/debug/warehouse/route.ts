// app/api/_debug/warehouse/route.ts
import { NextResponse } from "next/server";

function apiBase(): string {
    const api = (process.env.WAREHOUSE_API || "").trim();
    if (api) return api.replace(/\/+$/, "");
    const base = (process.env.WAREHOUSE_BASE || "").trim();
    if (!base) throw new Error("WAREHOUSE_BASE/WAREHOUSE_API missing");
    return `${base.replace(/\/+$/, "")}/api`;
}
function apiKey(): string {
    const key = (process.env.WAREHOUSE_API_KEY || "").trim();
    if (!key) throw new Error("WAREHOUSE_API_KEY missing");
    return key;
}
export const runtime = "nodejs";

export async function GET() {
    const base = apiBase();
    const url = `${base}/tenant/sync-user`;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "X-API-KEY": apiKey(),
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                product_code:
                    process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING",
                email: "debug@ping.local",
                company_id: "TIRTABENING_214562", // akan 422 kalau tidak ada, tak apa yg penting konek
                is_active: true,
            }),
            cache: "no-store",
        });
        const text = await res.text();
        return NextResponse.json({
            ok: true,
            tried_url: url,
            status: res.status,
            body: text.slice(0, 500),
        });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, tried_url: url, error: String(e?.message || e) },
            { status: 500 }
        );
    }
}
