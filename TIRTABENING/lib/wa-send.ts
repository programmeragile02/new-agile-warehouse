// import { db } from "./db";

// /** Kirim WA TEKS + catat log detail respon */
// export async function sendWaAndLog(tujuanRaw: string, text: string) {
//   const prisma = await db();

//   const to = tujuanRaw.replace(/\D/g, "").replace(/^0/, "62");
//   const base = (process.env.WA_SENDER_URL || "").replace(/\/$/, "");
//   const apiKey = process.env.WA_SENDER_API_KEY || "";

//   const log = await prisma.waLog.create({
//     data: {
//       tujuan: to,
//       tipe: "PEMBAYARAN APPROVED",
//       payload: JSON.stringify({ to, text }),
//       status: "PENDING",
//     },
//   });

//   try {
//     if (!base) throw new Error("WA_SENDER_URL empty");

//     const ac = new AbortController();
//     const t = setTimeout(() => ac.abort(), 10000);

//     const r = await fetch(`${base}/send`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         ...(apiKey ? { "x-api-key": apiKey } : {}),
//       },
//       body: JSON.stringify({ to, text }),
//       signal: ac.signal,
//     });

//     const bodyText = await r.text().catch(() => "");
//     clearTimeout(t);

//     await prisma.waLog.update({
//       where: { id: log.id },
//       data: {
//         status: r.ok ? "SENT" : "FAILED",
//         payload: JSON.stringify({
//           to,
//           res: { ok: r.ok, status: r.status, body: bodyText.slice(0, 2000) },
//         }),
//       },
//     });
//   } catch (e: any) {
//     await prisma.waLog.update({
//       where: { id: log.id },
//       data: {
//         status: "FAILED",
//         payload: JSON.stringify({ to, error: String(e?.message || e) }),
//       },
//     });
//   }
// }

// /** Kirim WA GAMBAR dalam base64 (tanpa simpan file) + log detail */
// export async function sendWaImageAndLog(
//   tujuanRaw: string,
//   payload: { base64: string; filename: string; caption?: string }
// ) {
//   const prisma = await db();

//   const to = tujuanRaw.replace(/\D/g, "").replace(/^0/, "62");
//   const base = (process.env.WA_SENDER_URL || "").replace(/\/$/, "");
//   const apiKey = process.env.WA_SENDER_API_KEY || "";

//   const log = await prisma.waLog.create({
//     data: {
//       tujuan: to,
//       tipe: "PEMBAYARAN_IMG APPROVED",
//       payload: JSON.stringify({
//         to,
//         meta: { filename: payload.filename, caption: payload.caption },
//         mode: "inline-b64",
//       }),
//       status: "PENDING",
//     },
//   });

//   try {
//     if (!base) throw new Error("WA_SENDER_URL empty");

//     const ac = new AbortController();
//     const t = setTimeout(() => ac.abort(), 15000);

//     const r = await fetch(`${base}/send-image`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         ...(apiKey ? { "x-api-key": apiKey } : {}),
//       },
//       body: JSON.stringify({
//         to,
//         base64: payload.base64, // base64 murni TANPA "data:image/jpeg;base64,"
//         filename: payload.filename,
//         caption: payload.caption,
//         mimeType: "image/jpeg",
//       }),
//       signal: ac.signal,
//     });

//     const bodyText = await r.text().catch(() => "");
//     clearTimeout(t);

//     await prisma.waLog.update({
//       where: { id: log.id },
//       data: {
//         status: r.ok ? "SENT" : "FAILED",
//         payload: JSON.stringify({
//           to,
//           req: { bytes: payload.base64.length },
//           res: { ok: r.ok, status: r.status, body: bodyText.slice(0, 2000) },
//         }),
//       },
//     });
//   } catch (e: any) {
//     await prisma.waLog.update({
//       where: { id: log.id },
//       data: {
//         status: "FAILED",
//         payload: JSON.stringify({ to, error: String(e?.message || e) }),
//       },
//     });
//   }
// }

// lib/wa-send.ts
import { db } from "./db";

/**
 * Resolve clientId (wa_client_id) for given companyId.
 * - returns null if companyId not provided
 * - tries mst_company.wa_client_id else fallback tenant_<companyId>
 */
async function resolveClientIdForCompany(
    prisma: any,
    companyId?: string | null
) {
    if (!companyId) return null;
    try {
        const row = await prisma.mstCompany.findUnique({
            where: { company_id: companyId },
            select: { wa_client_id: true },
        });
        if (row?.wa_client_id) return String(row.wa_client_id);
    } catch (err) {
        console.warn("resolveClientIdForCompany error:", String(err));
    }
    return `tenant_${companyId}`;
}

/** Kirim WA TEKS + catat log detail respon (tenant-aware) */
export async function sendWaAndLog(
    tujuanRaw: string,
    text: string,
    companyIdMaybe?: string | null
) {
    const prisma = await db();

    const to = tujuanRaw.replace(/\D/g, "").replace(/^0/, "62");
    const base = (process.env.WA_SENDER_URL || "").replace(/\/$/, "");
    const apiKey = process.env.WA_SENDER_API_KEY || "";

    const log = await prisma.waLog.create({
        data: {
            tujuan: to,
            tipe: "PEMBAYARAN APPROVED",
            payload: JSON.stringify({ to, text }),
            status: "PENDING",
        },
    });

    if (!base) {
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                payload: JSON.stringify({
                    to,
                    text,
                    err: "WA_SENDER_URL not set",
                }),
            },
        });
        return { ok: false, reason: "WA_SENDER_URL not set" };
    }

    // resolve clientId header if companyId given
    let clientId: string | null = null;
    if (companyIdMaybe) {
        try {
            clientId = await resolveClientIdForCompany(prisma, companyIdMaybe);
        } catch {
            clientId = `tenant_${companyIdMaybe}`;
        }
    }

    try {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), 15_000);

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-api-key": apiKey } : {}),
        };
        if (clientId) headers["x-client-id"] = clientId;

        const bodyStr = JSON.stringify({ to, text });
        const r = await fetch(`${base}/send`, {
            method: "POST",
            headers,
            body: bodyStr,
            signal: ac.signal,
        });

        const bodyText = await r.text().catch(() => "");
        clearTimeout(t);

        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: r.ok ? "SENT" : "FAILED",
                payload: JSON.stringify({
                    to,
                    text,
                    clientId: clientId || null,
                    req: { bytes: bodyStr.length },
                    res: {
                        ok: r.ok,
                        status: r.status,
                        bodyText: bodyText.slice(0, 20000),
                    },
                }),
            },
        });

        return { ok: r.ok, status: r.status, body: bodyText };
    } catch (e: any) {
        const emsg = String(e?.message || e);
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                payload: JSON.stringify({
                    to,
                    text,
                    clientId: clientId || null,
                    err: emsg,
                }),
            },
        });
        return { ok: false, reason: emsg };
    }
}

/** Kirim WA GAMBAR (base64) + log detail (tenant-aware) */
export async function sendWaImageAndLog(
    tujuanRaw: string,
    payload: { base64: string; filename: string; caption?: string },
    companyIdMaybe?: string | null
) {
    const prisma = await db();

    const to = tujuanRaw.replace(/\D/g, "").replace(/^0/, "62");
    const base = (process.env.WA_SENDER_URL || "").replace(/\/$/, "");
    const apiKey = process.env.WA_SENDER_API_KEY || "";

    const log = await prisma.waLog.create({
        data: {
            tujuan: to,
            tipe: "PEMBAYARAN_IMG APPROVED",
            payload: JSON.stringify({
                to,
                meta: { filename: payload.filename, caption: payload.caption },
                mode: "inline-b64",
            }),
            status: "PENDING",
        },
    });

    if (!base) {
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                payload: JSON.stringify({
                    to,
                    meta: {
                        filename: payload.filename,
                        caption: payload.caption,
                    },
                    err: "WA_SENDER_URL not set",
                }),
            },
        });
        return { ok: false, reason: "WA_SENDER_URL not set" };
    }

    // resolve clientId header if companyId given
    let clientId: string | null = null;
    const prismaForResolve = await db();
    if (companyIdMaybe) {
        try {
            clientId = await resolveClientIdForCompany(
                prismaForResolve,
                companyIdMaybe
            );
        } catch {
            clientId = `tenant_${companyIdMaybe}`;
        }
    }

    try {
        // sanity check payload size (base64 length)
        const base64len = payload.base64 ? payload.base64.length : 0;
        // approximate bytes = base64len * 3/4
        const approxBytes = Math.floor((base64len * 3) / 4);
        // warn if > 6MB
        if (approxBytes > 6_000_000) {
            console.warn(
                "sendWaImageAndLog: large image payload (~%d bytes). Consider uploading to URL instead.",
                approxBytes
            );
        }

        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), 30_000);

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-api-key": apiKey } : {}),
        };
        if (clientId) headers["x-client-id"] = clientId;

        const bodyObj = {
            to,
            base64: payload.base64,
            filename: payload.filename,
            caption: payload.caption,
            mimeType: "image/jpeg",
        };

        const r = await fetch(`${base}/send-image`, {
            method: "POST",
            headers,
            body: JSON.stringify(bodyObj),
            signal: ac.signal,
        });

        const bodyText = await r.text().catch(() => "");
        clearTimeout(t);

        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: r.ok ? "SENT" : "FAILED",
                payload: JSON.stringify({
                    to,
                    clientId: clientId || null,
                    req: { approxBytes },
                    res: {
                        ok: r.ok,
                        status: r.status,
                        bodyText: bodyText.slice(0, 20000),
                    },
                }),
            },
        });

        return { ok: r.ok, status: r.status, body: bodyText };
    } catch (e: any) {
        const emsg = String(e?.message || e);
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                payload: JSON.stringify({
                    to,
                    clientId: clientId || null,
                    err: emsg,
                }),
            },
        });
        return { ok: false, reason: emsg };
    }
}
