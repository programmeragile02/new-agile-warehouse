// import { db } from "@/lib/db";
// import { NextResponse } from "next/server";

// // app/api/tandon/route.ts
// const PREFIX = "TDN-";
// const PAD = 3; // TDN-001

// async function getNextTandonCode() {
//   const prisma = await db();
//   const last = await prisma.tandon.findFirst({
//     where: { kode: { startsWith: PREFIX } },
//     orderBy: { kode: "desc" },
//     select: { kode: true },
//   });
//   const lastNum = Number(last?.kode.match(/\d+$/)?.[0] || "0");
//   const nextNum = lastNum + 1;
//   return `${PREFIX}${String(nextNum).padStart(PAD, "0")}`;
// }

// /**
//  * GET
//  * - List     : ?page=1&pageSize=20&q=...
//  * - Next code: ?action=next-code
//  */
// export async function GET(req: Request) {
//   const prisma = await db();
//   try {
//     const { searchParams } = new URL(req.url);
//     const action = searchParams.get("action");

//     if (action === "next-code") {
//       const kode = await getNextTandonCode();
//       return NextResponse.json({ ok: true, kode });
//     }

//     const page = Math.max(1, Number(searchParams.get("page") || 1));
//     const pageSize = Math.min(
//       100,
//       Math.max(1, Number(searchParams.get("pageSize") || 20))
//     );
//     const q = (searchParams.get("q") || "").trim();

//     const where = q
//       ? {
//           OR: [
//             { kode: { contains: q, mode: "insensitive" } },
//             { nama: { contains: q, mode: "insensitive" } },
//             { deskripsi: { contains: q, mode: "insensitive" } },
//           ],
//         }
//       : {};

//     const [total, items] = await Promise.all([
//       prisma.tandon.count({ where }),
//       prisma.tandon.findMany({
//         where,
//         orderBy: [{ createdAt: "desc" }],
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: {
//           id: true,
//           kode: true,
//           nama: true,
//           deskripsi: true,
//           initialMeter: true, // ⬅️ NEW
//           createdAt: true,
//           updatedAt: true,
//         },
//       }),
//     ]);

//     return NextResponse.json({ ok: true, items, total, page, pageSize });
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, message: e?.message || "Failed" },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * POST
//  * Body: { kode?: string, nama: string, deskripsi?: string|null, initialMeter?: number }
//  * - Jika kode kosong, akan auto-generate
//  */
// export async function POST(req: Request) {
//   const prisma = await db();
//   try {
//     const b = await req.json().catch(() => ({}));
//     const nama: string | undefined = b?.nama;
//     const deskripsi: string | null = (b?.deskripsi ?? null) || null;
//     const initialMeter: number = Math.max(0, Number(b?.initialMeter) || 0);
//     const rawKode: string | undefined = b?.kode;

//     if (!nama?.trim()) {
//       return NextResponse.json(
//         { ok: false, message: "Nama wajib diisi" },
//         { status: 400 }
//       );
//     }

//     // Jika user memberikan kode spesifik → pakai langsung, biarkan DB enforce unique
//     if (rawKode?.trim()) {
//       try {
//         const created = await prisma.tandon.create({
//           data: {
//             kode: rawKode.trim().toUpperCase(),
//             nama: nama.trim(),
//             deskripsi,
//             initialMeter,
//           },
//         });
//         return NextResponse.json({ ok: true, item: created });
//       } catch (e: any) {
//         const msg = String(e?.message || "");
//         if (msg.includes("Unique constraint"))
//           return NextResponse.json(
//             { ok: false, message: "Kode sudah dipakai" },
//             { status: 409 }
//           );
//         throw e;
//       }
//     }

//     // Auto-generate kode dengan retry jika bentrok
//     const MAX_RETRY = 5;
//     let lastErr: any;
//     for (let i = 0; i < MAX_RETRY; i++) {
//       try {
//         const kode = await getNextTandonCode();
//         const created = await prisma.tandon.create({
//           data: {
//             kode,
//             nama: nama.trim(),
//             deskripsi,
//             initialMeter,
//           },
//         });
//         return NextResponse.json({ ok: true, item: created });
//       } catch (e: any) {
//         const msg = String(e?.message || "");
//         if (!msg.includes("Unique constraint")) {
//           lastErr = e;
//           break;
//         }
//         lastErr = e; // retry next loop
//       }
//     }

//     return NextResponse.json(
//       { ok: false, message: lastErr?.message || "Gagal membuat tandon" },
//       { status: 500 }
//     );
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, message: e?.message || "Failed" },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * PUT
//  * Body: { id: string, kode?: string, nama?: string, deskripsi?: string|null, initialMeter?: number }
//  */
// export async function PUT(req: Request) {
//   const prisma = await db();
//   try {
//     const b = await req.json().catch(() => ({}));
//     const id: string | undefined = b?.id;
//     if (!id)
//       return NextResponse.json(
//         { ok: false, message: "id wajib" },
//         { status: 400 }
//       );

//     const data: any = {};
//     if (typeof b?.kode === "string") data.kode = b.kode.trim().toUpperCase();
//     if (typeof b?.nama === "string") data.nama = b.nama.trim();
//     if (b?.deskripsi === null || typeof b?.deskripsi === "string")
//       data.deskripsi = b.deskripsi;
//     if (b?.initialMeter != null)
//       data.initialMeter = Math.max(0, Number(b.initialMeter) || 0); // ⬅️ NEW

//     try {
//       const updated = await prisma.tandon.update({ where: { id }, data });
//       return NextResponse.json({ ok: true, item: updated });
//     } catch (e: any) {
//       const msg = String(e?.message || "");
//       if (msg.includes("Unique constraint"))
//         return NextResponse.json(
//           { ok: false, message: "Kode sudah dipakai" },
//           { status: 409 }
//         );
//       throw e;
//     }
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, message: e?.message || "Failed" },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * DELETE
//  * Body: { id: string }
//  */
// export async function DELETE(req: Request) {
//   const prisma = await db();
//   try {
//     const b = await req.json().catch(() => ({}));
//     const id: string | undefined = b?.id;
//     if (!id)
//       return NextResponse.json(
//         { ok: false, message: "id wajib" },
//         { status: 400 }
//       );

//     await prisma.tandon.delete({ where: { id } });
//     return NextResponse.json({ ok: true });
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, message: e?.message || "Failed" },
//       { status: 500 }
//     );
//   }
// }

// app/api/tandon/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/* ===================== CONFIG ===================== */
const WAREHOUSE_API_BASE =
    process.env.WAREHOUSE_API_BASE || "http://localhost:9000";
const WAREHOUSE_API_KEY = process.env.WAREHOUSE_API_KEY || "";
const PRODUCT_CODE = process.env.PRODUCT_CODE || "TIRTABENING";
const DEFAULT_MAX_TANDON = Number(process.env.DEFAULT_MAX_TANDON ?? 10);

/* ===================== Helpers kode ===================== */
const PREFIX = "TDN-";
const PAD = 3; // TDN-001

async function getNextTandonCode() {
    const prisma = await db();
    const last = await prisma.tandon.findFirst({
        where: { kode: { startsWith: PREFIX } },
        orderBy: { kode: "desc" },
        select: { kode: true },
    });
    const lastNum = Number(last?.kode.match(/\d+$/)?.[0] || "0");
    const nextNum = lastNum + 1;
    return `${PREFIX}${String(nextNum).padStart(PAD, "0")}`;
}

/* ===================== Entitlement resolution (warehouse) ===================== */
type WarehouseEntitlement = {
    code: string;
    value_number?: number | null;
    value_string?: string | null;
    enabled?: boolean;
};

type WarehouseResp =
    | {
          entitlements?: WarehouseEntitlement[];
          packageCode?: string;
          plan?: string;
      }
    | {
          data?: {
              offering?: { slug?: string | null };
              features?: Array<{ feature_code: string }>;
              entitlements?: WarehouseEntitlement[];
          };
      };

const TierLimitTandon: Record<string, number> = {
    BASIC: 10,
    PREMIUM: 25,
    PROFESSIONAL: 50,
};

const EntCache: Record<string, { max: number; exp: number }> =
    Object.create(null);
const now = () => Date.now();

function getCompanyIdFromReq(
    req: Request | ({ headers?: Headers; url?: string } & any)
): string | null {
    // Accept cookie or header (server runtimes may not have .cookies on Request)
    try {
        // NextRequest in app router has cookies.get() — but this route receives native Request.
        // We'll try URL search params/header fallbacks:
        const u = req.url ? new URL(req.url) : null;
        const cookieHeader =
            (req as any).headers?.get?.("cookie") ?? (u ? null : null);
        if (cookieHeader) {
            const m = cookieHeader.match(/(?:^|;\s*)tb_company=([^;]+)/);
            if (m) return decodeURIComponent(m[1]);
        }
        // header x-company-id
        const h =
            (req as any).headers?.get?.("x-company-id") ||
            (req as any).headers?.get?.("company_id");
        if (h) return h;
    } catch {
        // ignore
    }
    return null;
}
function getPlanFromReq(
    req: Request | ({ headers?: Headers; url?: string } & any)
): string | null {
    try {
        const cookieHeader = (req as any).headers?.get?.("cookie");
        if (cookieHeader) {
            const m =
                cookieHeader.match(/(?:^|;\s*)tb_offering=([^;]+)/) ||
                cookieHeader.match(/(?:^|;\s*)tb_plan=([^;]+)/) ||
                cookieHeader.match(/(?:^|;\s*)tb_package=([^;]+)/);
            if (m) return decodeURIComponent(m[1]).toUpperCase();
        }
        const h =
            (req as any).headers?.get?.("x-plan") ||
            (req as any).headers?.get?.("x-package");
        if (h) return h.toUpperCase();
        if (process.env.COMPANY_PLAN)
            return process.env.COMPANY_PLAN.toUpperCase();
    } catch {
        // ignore
    }
    return null;
}

async function fetchEntitlementsFromWarehouse(
    companyId: string
): Promise<{
    entitlements: WarehouseEntitlement[];
    packageCode?: string;
} | null> {
    try {
        const url = `${WAREHOUSE_API_BASE.replace(
            /\/+$/,
            ""
        )}/api/company/entitlements`;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": WAREHOUSE_API_KEY,
            },
            body: JSON.stringify({
                company_id: companyId,
                product_code: PRODUCT_CODE,
            }),
        });
        if (!res.ok) return null;
        const raw = (await res.json()) as WarehouseResp;

        let entitlements: WarehouseEntitlement[] =
            (raw as any).entitlements ??
            (raw as any).data?.entitlements ??
            ((raw as any).data?.features
                ? (raw as any).data.features.map((f: any) => ({
                      code: f.feature_code,
                  }))
                : []);

        if (!Array.isArray(entitlements)) entitlements = [];

        const packageCode: string | undefined =
            (raw as any).packageCode ??
            (raw as any).plan ??
            (raw as any).data?.offering?.slug;
        return { entitlements, packageCode };
    } catch {
        return null;
    }
}

/** Resolve maksimal tandon berdasarkan (prioritas):
 * 1) entitlement 'maksimal.tandon' (numerik)
 * 2) package/plan slug (basic/premium/professional)
 * 3) hint dari request (cookie/header/env)
 * 4) DEFAULT
 */
async function resolveMaxTandon(
    companyId: string | null,
    planHint?: string | null
): Promise<number> {
    if (companyId) {
        const hit = EntCache[companyId];
        if (hit && hit.exp > now()) return hit.max;
    }

    let pkgFromWh: string | undefined;

    if (companyId) {
        const resp = await fetchEntitlementsFromWarehouse(companyId);
        if (resp) {
            const ent = resp.entitlements.find(
                (e) => e.code === "maksimal.tandon" && (e.enabled ?? true)
            );
            const val =
                ent?.value_number ??
                (ent?.value_string != null
                    ? Number(ent.value_string)
                    : undefined);
            if (Number.isFinite(val)) {
                const max = Number(val);
                EntCache[companyId] = { max, exp: now() + 5 * 60_000 };
                return max;
            }

            pkgFromWh = resp.packageCode?.toUpperCase();
            if (pkgFromWh && TierLimitTandon[pkgFromWh]) {
                const max = TierLimitTandon[pkgFromWh];
                EntCache[companyId] = { max, exp: now() + 5 * 60_000 };
                return max;
            }
        }
    }

    const hint = (planHint || pkgFromWh || "").toUpperCase();
    if (hint && TierLimitTandon[hint]) {
        const max = TierLimitTandon[hint];
        if (companyId) EntCache[companyId] = { max, exp: now() + 60_000 };
        return max;
    }

    const max = DEFAULT_MAX_TANDON;
    if (companyId) EntCache[companyId] = { max, exp: now() + 60_000 };
    return max;
}

/* ===================== API handlers ===================== */

/**
 * GET
 * - List     : ?page=1&pageSize=20&q=...
 * - Next code: ?action=next-code
 * - Quota    : ?quota=1  (returns used/max/remaining)
 */
export async function GET(req: Request) {
    const prisma = await db();
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const q = (searchParams.get("q") || "").trim();

        if (
            action === "next-code" ||
            searchParams.get("action") === "next-code"
        ) {
            const kode = await getNextTandonCode();
            return NextResponse.json({ ok: true, kode });
        }

        if (searchParams.get("quota") === "1") {
            const companyId = getCompanyIdFromReq(req);
            const planHint = getPlanFromReq(req);
            const max = await resolveMaxTandon(companyId, planHint);
            const used = await prisma.tandon.count();
            return NextResponse.json({
                ok: true,
                quota: { used, max, remaining: Math.max(0, max - used) },
            });
        }

        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const pageSize = Math.min(
            100,
            Math.max(1, Number(searchParams.get("pageSize") || 20))
        );

        const where = q
            ? {
                  OR: [
                      { kode: { contains: q, mode: "insensitive" } },
                      { nama: { contains: q, mode: "insensitive" } },
                      { deskripsi: { contains: q, mode: "insensitive" } },
                  ],
              }
            : {};

        const [total, items] = await Promise.all([
            prisma.tandon.count({ where }),
            prisma.tandon.findMany({
                where,
                orderBy: [{ createdAt: "desc" }],
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    kode: true,
                    nama: true,
                    deskripsi: true,
                    initialMeter: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);

        return NextResponse.json({ ok: true, items, total, page, pageSize });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message || "Failed" },
            { status: 500 }
        );
    }
}

/**
 * POST
 * Body: { kode?: string, nama: string, deskripsi?: string|null, initialMeter?: number }
 * - Jika kode kosong, akan auto-generate
 * - Block jika kuota tandon sudah full
 */
export async function POST(req: Request) {
    const prisma = await db();
    try {
        const b = await req.json().catch(() => ({}));
        const nama: string | undefined = b?.nama;
        const deskripsi: string | null = (b?.deskripsi ?? null) || null;
        const initialMeter: number = Math.max(0, Number(b?.initialMeter) || 0);
        const rawKode: string | undefined = b?.kode;

        if (!nama?.trim()) {
            return NextResponse.json(
                { ok: false, message: "Nama wajib diisi" },
                { status: 400 }
            );
        }

        // kuota check (server-side)
        const companyId = getCompanyIdFromReq(req);
        const planHint = getPlanFromReq(req);
        const max = await resolveMaxTandon(companyId, planHint);
        const used = await prisma.tandon.count();
        if (used >= max) {
            return NextResponse.json(
                {
                    ok: false,
                    code: "QUOTA_EXCEEDED",
                    message: `Kuota tandon habis. Paket ini maksimum ${max} tandon. Silakan hapus tandon tidak terpakai atau upgrade paket.`,
                    meta: { used, max, remaining: Math.max(0, max - used) },
                },
                { status: 403 }
            );
        }

        // Jika user memberikan kode spesifik → pakai langsung, biarkan DB enforce unique
        if (rawKode?.trim()) {
            try {
                const created = await prisma.tandon.create({
                    data: {
                        kode: rawKode.trim().toUpperCase(),
                        nama: nama.trim(),
                        deskripsi,
                        initialMeter,
                    },
                });
                return NextResponse.json(
                    { ok: true, item: created },
                    { status: 201 }
                );
            } catch (e: any) {
                const msg = String(e?.message || "");
                if (msg.includes("Unique constraint"))
                    return NextResponse.json(
                        { ok: false, message: "Kode sudah dipakai" },
                        { status: 409 }
                    );
                throw e;
            }
        }

        // Auto-generate kode dengan retry jika bentrok
        const MAX_RETRY = 5;
        let lastErr: any;
        for (let i = 0; i < MAX_RETRY; i++) {
            try {
                const kode = await getNextTandonCode();
                const created = await prisma.tandon.create({
                    data: {
                        kode,
                        nama: nama.trim(),
                        deskripsi,
                        initialMeter,
                    },
                });
                return NextResponse.json(
                    { ok: true, item: created },
                    { status: 201 }
                );
            } catch (e: any) {
                const msg = String(e?.message || "");
                if (!msg.includes("Unique constraint")) {
                    lastErr = e;
                    break;
                }
                lastErr = e; // retry next loop
            }
        }

        return NextResponse.json(
            { ok: false, message: lastErr?.message || "Gagal membuat tandon" },
            { status: 500 }
        );
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message || "Failed" },
            { status: 500 }
        );
    }
}

/**
 * PUT
 * Body: { id: string, kode?: string, nama?: string, deskripsi?: string|null, initialMeter?: number }
 */
export async function PUT(req: Request) {
    const prisma = await db();
    try {
        const b = await req.json().catch(() => ({}));
        const id: string | undefined = b?.id;
        if (!id)
            return NextResponse.json(
                { ok: false, message: "id wajib" },
                { status: 400 }
            );

        const data: any = {};
        if (typeof b?.kode === "string")
            data.kode = b.kode.trim().toUpperCase();
        if (typeof b?.nama === "string") data.nama = b.nama.trim();
        if (b?.deskripsi === null || typeof b?.deskripsi === "string")
            data.deskripsi = b.deskripsi;
        if (b?.initialMeter != null)
            data.initialMeter = Math.max(0, Number(b.initialMeter) || 0);

        try {
            const updated = await prisma.tandon.update({ where: { id }, data });
            return NextResponse.json({ ok: true, item: updated });
        } catch (e: any) {
            const msg = String(e?.message || "");
            if (msg.includes("Unique constraint"))
                return NextResponse.json(
                    { ok: false, message: "Kode sudah dipakai" },
                    { status: 409 }
                );
            throw e;
        }
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message || "Failed" },
            { status: 500 }
        );
    }
}

/**
 * DELETE
 * Body: { id: string }
 */
export async function DELETE(req: Request) {
    const prisma = await db();
    try {
        const b = await req.json().catch(() => ({}));
        const id: string | undefined = b?.id;
        if (!id)
            return NextResponse.json(
                { ok: false, message: "id wajib" },
                { status: 400 }
            );

        await prisma.tandon.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message || "Failed" },
            { status: 500 }
        );
    }
}
