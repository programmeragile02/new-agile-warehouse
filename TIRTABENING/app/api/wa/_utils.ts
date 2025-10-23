// export const runtime = "nodejs";

// const BASE = process.env.WA_SENDER_URL || "";
// const KEY  = process.env.WA_SENDER_API_KEY || "";

// export async function callWaSender(path: string, init?: RequestInit) {
//   if (!BASE) {
//     return new Response(JSON.stringify({ ok:false, message:"WA_SENDER_URL not set" }), { status: 500 });
//   }
//   const r = await fetch(`${BASE}${path}`, {
//     ...init,
//     headers: {
//       ...(init?.headers || {}),
//       ...(KEY ? { "x-api-key": KEY } : {}),
//       "content-type": init?.headers && (init.headers as any)["content-type"] ? (init.headers as any)["content-type"] : "application/json",
//     },
//     cache: "no-store",
//   });

//   if (r.status === 204) {
//     return new Response(JSON.stringify({ ok: true, noContent: true }), { status: 200 });
//   }

//   const text = await r.text();
//   // coba parse json, kalau gagal kirim mentah
//   try {
//     const json = JSON.parse(text);
//     return new Response(JSON.stringify(json), { status: r.status });
//   } catch {
//     return new Response(text, { status: r.status });
//   }
// }

export const runtime = "nodejs";

import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";

/**
 * Proxy helper to call WA Sender.
 *
 * Behavior:
 * - If user logged in (tenantCtx) -> try read wa_client_id from DB (mst_company)
 *   If wa_client_id exists, use it. Otherwise fallback to deterministic `tenant_<companyId>`.
 * - For endpoints "qr" and "status" we call `${BASE}/qr/:clientId` and `${BASE}/status/:clientId`.
 * - For other endpoints (send, logout, reinit, send-image, send-document) we include header "x-client-id".
 * - Global endpoints like /logs are called as-is.
 */

const BASE = (process.env.WA_SENDER_URL || "").replace(/\/+$/, "");
const KEY = process.env.WA_SENDER_API_KEY || "";

function isPathNeedsClientInUrl(path: string) {
    const p = path.replace(/^\//, "").split("?")[0].toLowerCase();
    return p === "qr" || p === "status";
}

function isGlobalPath(path: string) {
    const p = path.replace(/^\//, "").split("?")[0].toLowerCase();
    return p === "logs" || p === "";
}

export async function callWaSender(path: string, init?: RequestInit) {
    const prisma = await db();

    if (!BASE) {
        return new Response(
            JSON.stringify({ ok: false, message: "WA_SENDER_URL not set" }),
            { status: 500 }
        );
    }

    // 1) get tenant context (from cookie)
    let tenantCtx = null;
    try {
        tenantCtx = await getTenantContext();
    } catch (e) {
        tenantCtx = null;
    }

    let companyId: string | null = null;
    if (tenantCtx && (tenantCtx as any).companyId)
        companyId = (tenantCtx as any).companyId;

    // 2) try fetch wa_client_id from DB if we have companyId
    let clientId: string | null = null;
    if (companyId) {
        try {
            const row = await prisma.mstCompany.findUnique({
                where: { company_id: companyId },
                select: { wa_client_id: true, wa_server_url: true },
            });
            if (row?.wa_client_id) clientId = String(row.wa_client_id);
            // optional: if company stored wa_server_url and differs from BASE, we could prefer that
            // but for now we keep using BASE from env.
        } catch (e) {
            // ignore DB error and fallback to deterministic clientId
            clientId = null;
        }
    }

    if (!clientId && companyId) clientId = `tenant_${companyId}`;

    // build headers
    const headers: Record<string, string> = {
        ...(init?.headers ? (init.headers as Record<string, string>) : {}),
    };

    // default content-type when body present but header missing
    if (!headers["content-type"] && init?.body)
        headers["content-type"] = "application/json";

    // add WA server API key if present
    if (KEY) headers["x-api-key"] = KEY;

    // compute actual path / url
    let targetPath = path;

    if (clientId && isPathNeedsClientInUrl(path) && !isGlobalPath(path)) {
        targetPath =
            path.replace(/\/+$/, "") + "/" + encodeURIComponent(clientId);
    }

    // special-case: logs -> append ?clientId=... (preserve existing query if ada)
    if (
        clientId &&
        path.replace(/^\//, "").split("?")[0].toLowerCase() === "logs"
    ) {
        // jika path sudah berisi query (mis /logs?limit=100), tambahkan &clientId=...
        if (targetPath.includes("?"))
            targetPath = `${targetPath}&clientId=${encodeURIComponent(
                clientId
            )}`;
        else
            targetPath = `${targetPath}?clientId=${encodeURIComponent(
                clientId
            )}`;
    }

    // add x-client-id header for non-global endpoints that don't expect clientId in URL
    if (clientId && !isGlobalPath(path) && !isPathNeedsClientInUrl(path)) {
        headers["x-client-id"] = clientId;
    }

    const url = `${BASE}${targetPath.startsWith("/") ? "" : "/"}${targetPath}`;

    let res: Response | null = null;
    try {
        res = await fetch(url, {
            ...init,
            headers,
            cache: "no-store",
        });
    } catch (e: any) {
        return new Response(
            JSON.stringify({
                ok: false,
                message: "Failed to contact WA sender",
                error: String(e?.message || e),
            }),
            { status: 503 }
        );
    }

    if (res.status === 204) {
        return new Response(JSON.stringify({ ok: true, noContent: true }), {
            status: 200,
        });
    }

    const text = await res.text().catch(() => "");
    try {
        const json = JSON.parse(text);
        return new Response(JSON.stringify(json), { status: res.status });
    } catch {
        return new Response(text, { status: res.status });
    }
}
