// lib/auth-public.ts
import type { NextRequest } from "next/server";

/**
 * Validasi akses endpoint publik (read-only) antar layanan.
 * Header yang diterima: X-PRODUCT-KEY atau X-PUBLIC-KEY
 *
 * .env (Nata Banyu):
 *   PRODUCT_PUBLIC_KEY="tb-public-key-123"
 */
export function assertProductKey(req: Request | NextRequest) {
    const headers = (req as any).headers ?? new Headers();

    // Terima dua nama header (case-insensitive on get)
    const key1 =
        typeof headers.get === "function" ? headers.get("x-product-key") : "";
    const key2 =
        typeof headers.get === "function" ? headers.get("x-public-key") : "";
    const key3 =
        typeof headers.get === "function" ? headers.get("x-client-key") : "";

    const provided = key1 || key2 || "";
    const expected = process.env.PRODUCT_PUBLIC_KEY || "";

    if (!expected) {
        return new Response(
            JSON.stringify({
                message: "Server misconfigured: PRODUCT_PUBLIC_KEY is empty",
            }),
            { status: 500, headers: { "content-type": "application/json" } }
        );
    }

    if (provided !== expected) {
        return new Response(
            JSON.stringify({ message: "Forbidden product key" }),
            { status: 403, headers: { "content-type": "application/json" } }
        );
    }
    return null;
}

export function requireProductKey(req: Request | NextRequest): void | never {
    const res = assertProductKey(req);
    if (res) throw res;
}
