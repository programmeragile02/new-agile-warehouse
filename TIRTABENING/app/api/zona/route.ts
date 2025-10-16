// // app/api/zona/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { db } from "@/lib/db";// import { z } from "zod"
// import type { Prisma } from "@prisma/client"

// // ===== Helpers =====
// function genZonaCode() {
//   const ts = Date.now().toString().slice(-5)
//   const rnd = Math.floor(Math.random() * 100).toString().padStart(2, "0")
//   return `Z${ts}${rnd}`
// }
// function toVariants(s: string) {
//   const t = s.trim()
//   const title = t
//     .toLowerCase()
//     .split(/\s+/)
//     .filter(Boolean)
//     .map(w => (w[0]?.toUpperCase() ?? "") + w.slice(1))
//     .join(" ")
//   return Array.from(new Set([t, t.toLowerCase(), t.toUpperCase(), title])).filter(Boolean) as string[]
// }

// // ===================================================================
// // POST /api/zona
// // body: { nama: string; kode?: string; deskripsi?: string|null; petugasId?: string|null }
// // ===================================================================
// const postSchema = z.object({
//   nama: z.string().min(1, "Nama wajib diisi"),
//   kode: z.string().trim().optional(),
//   deskripsi: z.string().trim().nullable().optional(),
//   petugasId: z.string().trim().nullable().optional(), // null = tanpa petugas
// })

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json()
//     const parsed = postSchema.safeParse(body)
//     if (!parsed.success) {
//       const msg = parsed.error.issues.map(i => i.message).join(", ")
//       return NextResponse.json({ ok: false, message: msg }, { status: 400 })
//     }

//     const namaRaw = parsed.data.nama ?? ""
//     const deskripsiRaw = parsed.data.deskripsi ?? null
//     const kodeRaw = parsed.data.kode ?? ""
//     // Normalisasi kode: trim + UPPERCASE; auto-gen jika kosong
//     const kode = (kodeRaw.trim().length ? kodeRaw : genZonaCode()).trim().toUpperCase()

//     // Normalisasi petugasId: "" | undefined | null -> null
//     let petugasId: string | null =
//       parsed.data.petugasId === "" || parsed.data.petugasId == null
//         ? null
//         : String(parsed.data.petugasId)

//     // Validasi FK petugasId (jika diisi)
//     if (petugasId) {
//       const petugas = await prisma.user.findUnique({
//         where: { id: petugasId },
//         select: { id: true, role: true, isActive: true },
//       })
//       if (!petugas) {
//         return NextResponse.json({ ok: false, message: "Petugas tidak ditemukan" }, { status: 404 })
//       }
//       // (Opsional tapi disarankan) pastikan role PETUGAS & aktif
//       if (petugas.role !== "PETUGAS" || !petugas.isActive) {
//         return NextResponse.json(
//           { ok: false, message: "User terpilih bukan PETUGAS aktif" },
//           { status: 400 },
//         )
//       }
//     }

//     const created = await prisma.zona.create({
//       data: {
//         nama: namaRaw.trim(),
//         kode,
//         deskripsi: deskripsiRaw ? deskripsiRaw.trim() : null,
//         petugasId, // satu zona = satu petugas (boleh null)
//       },
//       select: {
//         id: true,
//         kode: true,
//         nama: true,
//         deskripsi: true,
//         petugasId: true,
//         petugas: { select: { id: true, name: true, username: true } },
//       },
//     })

//     return NextResponse.json(
//       { ok: true, item: created, message: "Zona berhasil dibuat" },
//       { status: 201 },
//     )
//   } catch (e: any) {
//     if (e?.code === "P2002") {
//       // Unique constraint (kemungkinan: kode)
//       return NextResponse.json({ ok: false, message: "Kode zona sudah dipakai" }, { status: 409 })
//     }
//     if (e?.code === "P2003") {
//       // FK invalid
//       return NextResponse.json({ ok: false, message: "Petugas tidak valid" }, { status: 400 })
//     }
//     return NextResponse.json(
//       { ok: false, message: e?.message ?? "Server error" },
//       { status: 500 },
//     )
//   }
// }

// // ===================================================================
// // GET /api/zona?page=1&pageSize=10&q=...&petugasId=... — list + pagination
// // ===================================================================
// export async function GET(req: NextRequest) {
//   try {
//     const sp = req.nextUrl.searchParams
//     const pageRaw = parseInt(sp.get("page") ?? "1", 10)
//     const sizeRaw = parseInt(sp.get("pageSize") ?? "10", 10)
//     const q = (sp.get("q") ?? "").trim()
//     const filterPetugasId = sp.get("petugasId") ?? undefined

//     const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
//     const pageSize = Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.min(sizeRaw, 100) : 10

//     const whereBase: Prisma.ZonaWhereInput = {
//       ...(filterPetugasId ? { petugasId: filterPetugasId } : {}),
//     }
//     let where: Prisma.ZonaWhereInput = whereBase

//     if (q) {
//       const variants = toVariants(q)
//       const containsAny = (field: "nama" | "kode" | "deskripsi") =>
//         variants.map(v => ({ [field]: { contains: v } })) as Prisma.ZonaWhereInput[]
//       where = {
//         AND: [
//           whereBase,
//           { OR: [...containsAny("nama"), ...containsAny("kode"), ...containsAny("deskripsi")] },
//         ],
//       }
//     }

//     const total = await prisma.zona.count({ where })
//     const totalPages = Math.max(1, Math.ceil(total / pageSize))
//     const safePage = Math.min(page, totalPages)

//     // ... di dalam GET
//     const rows = await prisma.zona.findMany({
//       where,
//       orderBy: [{ createdAt: "asc" }, { id: "asc" }],
//       skip: (safePage - 1) * pageSize,
//       take: pageSize,
//       select: {
//         id: true,
//         kode: true,
//         nama: true,
//         deskripsi: true,
//         petugasId: true,                               // ⬅️ WAJIB
//         petugas: { select: { id: true, name: true, username: true } }, // ⬅️ WAJIB
//         _count: { select: { pelanggan: true } },
//       },
//     })

//     const items = rows.map((r) => ({
//       id: r.id,
//       kode: r.kode,
//       nama: r.nama,
//       deskripsi: r.deskripsi ?? "",
//       petugasId: r.petugasId ?? null,                 // ⬅️ kirim apa adanya
//       petugas: r.petugas
//         ? { id: r.petugas.id, name: r.petugas.name, username: r.petugas.username ?? undefined }
//         : null,                                       // ⬅️ kirim objek (bukan hanya nama)
//       pelangganCount: r._count.pelanggan,             // ⬅️ konsisten dan simple
//     }))

//     console.log("GET /api/zona -> items:", items)     // ⬅️ TRACE: lihat di terminal

//     return NextResponse.json({
//       ok: true,
//       items,
//       pagination: { page: safePage, pageSize, total, totalPages },
//     })
//   } catch (e: any) {
//     return NextResponse.json({ ok: false, message: e?.message ?? "Server error" }, { status: 500 })
//   }
// }

// // ===================================================================
// // PUT /api/zona?id=ZONA_ID — update parsial
// // body: { nama?, kode?, deskripsi?, petugasId?: string|null }
// // ===================================================================
// const putSchema = z.object({
//   id: z.string().optional(),
//   nama: z.string().min(1).optional(),
//   kode: z.string().optional(),
//   deskripsi: z.string().nullable().optional(),
//   petugasId: z.union([z.string(), z.null()]).optional(),
// })

// export async function PUT(req: NextRequest) {
//   // ---- LOG #0: request meta
//   console.log("📨 [PUT /api/zona] URL:", req.url)

//   try {
//     const urlId = req.nextUrl.searchParams.get("id") ?? undefined
//     console.log("🔎 query.id =", urlId)

//     const raw = await req.json().catch(() => ({}))
//     // ---- LOG #1: raw body yang diterima
//     console.log("🧾 raw body =", raw)

//     const parsed = putSchema.safeParse(raw)
//     if (!parsed.success) {
//       const msg = parsed.error.issues.map(i => i.message).join(", ")
//       console.log("❌ zod error =", parsed.error.issues)
//       return NextResponse.json({ ok: false, message: msg }, { status: 400 })
//     }

//     const body = parsed.data
//     const id = body.id ?? urlId
//     if (!id) {
//       console.log("❗ missing ID (body.id/urlId)")
//       return NextResponse.json({ ok: false, message: "ID wajib disertakan" }, { status: 400 })
//     }

//     // ---- LOG #2: body setelah parse
//     console.log("✅ parsed body =", body)

//     // Normalisasi petugasId
//     let petugasId: string | null | undefined = body.petugasId
//     if (petugasId === "") petugasId = null
//     console.log("🛠️ normalized petugasId =", petugasId)

//     // Validasi FK petugas jika DIISI (bukan null)
//     if (petugasId != null) {
//       const petugas = await prisma.user.findUnique({
//         where: { id: petugasId },
//         select: { id: true, role: true, isActive: true },
//       })
//       console.log("👤 cek petugas =", petugas)

//       if (!petugas) {
//         return NextResponse.json({ ok: false, message: "Petugas tidak ditemukan" }, { status: 404 })
//       }
//       if (petugas.role !== "PETUGAS" || !petugas.isActive) {
//         return NextResponse.json(
//           { ok: false, message: "User terpilih bukan PETUGAS aktif" },
//           { status: 400 },
//         )
//       }
//     }

//     // Siapkan payload update
//     const data: Prisma.ZonaUpdateInput = {}
//     if (body.nama !== undefined) data.nama = body.nama.trim()
//     if (body.kode !== undefined) data.kode = body.kode.trim().toUpperCase()
//     if (body.deskripsi !== undefined) data.deskripsi = body.deskripsi?.trim() || null
//     if (petugasId !== undefined) data.petugasId = petugasId // string | null

//     // ---- LOG #3: payload update final
//     console.log("📦 update data =", data)

//     const updated = await prisma.zona.update({
//       where: { id },
//       data,
//       select: {
//         id: true,
//         kode: true,
//         nama: true,
//         deskripsi: true,
//         petugasId: true,
//         petugas: { select: { id: true, name: true, username: true } },
//       },
//     })

//     // ---- LOG #4: hasil update
//     console.log("✅ updated zona =", updated)

//     return NextResponse.json({
//       ok: true,
//       item: {
//         id: updated.id,
//         kode: updated.kode,
//         nama: updated.nama,
//         deskripsi: updated.deskripsi ?? "",
//         petugasId: updated.petugasId ?? null,
//         petugasNama: updated.petugas?.name ?? null,
//       },
//       message: "Zona berhasil diperbarui",
//     })
//   } catch (e: any) {
//     // ---- LOG #5: error prisma/umum
//     console.error("💥 PUT /api/zona error =", e)

//     if (e?.code === "P2025") {
//       return NextResponse.json({ ok: false, message: "Zona tidak ditemukan" }, { status: 404 })
//     }
//     if (e?.code === "P2002") {
//       return NextResponse.json({ ok: false, message: "Kode zona sudah dipakai" }, { status: 409 })
//     }
//     if (e?.code === "P2003") {
//       return NextResponse.json({ ok: false, message: "Petugas tidak valid" }, { status: 400 })
//     }
//     return NextResponse.json({ ok: false, message: e?.message ?? "Server error" }, { status: 500 })
//   }
// }

// // ===================================================================
// // DELETE /api/zona?id=ZONA_ID — tolak bila masih ada pelanggan
// // ===================================================================
// export async function DELETE(req: NextRequest) {
//   try {
//     const urlId = req.nextUrl.searchParams.get("id") ?? undefined
//     const body = await req.json().catch(() => ({} as unknown))
//     const id = (body as { id?: string })?.id ?? urlId
//     if (!id) return NextResponse.json({ ok: false, message: "ID wajib disertakan" }, { status: 400 })

//     const used = await prisma.pelanggan.count({ where: { zonaId: id } })
//     if (used > 0) {
//       return NextResponse.json(
//         { ok: false, message: "Zona masih memiliki pelanggan. Pindahkan/lepaskan pelanggan terlebih dahulu." },
//         { status: 409 }
//       )
//     }

//     await prisma.zona.delete({ where: { id } })
//     return NextResponse.json({ ok: true, message: "Zona berhasil dihapus" })
//   } catch (e: any) {
//     if (e?.code === "P2025") {
//       return NextResponse.json({ ok: false, message: "Zona tidak ditemukan" }, { status: 404 })
//     }
//     return NextResponse.json({ ok: false, message: e?.message ?? "Server error" }, { status: 500 })
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

/* ===================== ENV & DEFAULTS ===================== */
const WAREHOUSE_API_BASE =
    process.env.WAREHOUSE_API_BASE || "http://localhost:9000";
const WAREHOUSE_API_KEY = process.env.WAREHOUSE_API_KEY || "";
const PRODUCT_CODE = process.env.PRODUCT_CODE || "TIRTABENING";
const DEFAULT_MAX_BLOCKS = Number(process.env.DEFAULT_MAX_BLOCKS ?? 10);

/* ===================== Company & Plan helpers ===================== */
function getCompanyIdFromReq(req: NextRequest): string | null {
    for (const key of ["tb_company", "company_id", "companyId"]) {
        const v = req.cookies.get(key)?.value;
        if (v && v.trim()) return v;
    }
    for (const key of ["x-company-id", "x-companyid"]) {
        const v = req.headers.get(key);
        if (v && v.trim()) return v;
    }
    return null;
}
function getPlanFromReq(req: NextRequest): string | null {
    for (const key of ["tb_offering", "tb_plan", "tb_package"]) {
        const v = req.cookies.get(key)?.value;
        if (v && v.trim()) return v.toUpperCase();
    }
    for (const key of ["x-plan", "x-package"]) {
        const v = req.headers.get(key);
        if (v && v.trim()) return v.toUpperCase();
    }
    if (process.env.COMPANY_PLAN) return process.env.COMPANY_PLAN.toUpperCase();
    return null;
}

/* ===================== Warehouse entitlement helpers ===================== */
type MaybeNum = number | null | undefined;
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

const BlockTierLimit: Record<string, number> = {
    BASIC: 10,
    PREMIUM: 50,
    PROFESSIONAL: 200,
};

// in-memory cache 5 menit per company
const EntCache: Record<string, { max: number; exp: number }> =
    Object.create(null);
const now = () => Date.now();

async function fetchEntitlementsFromWarehouse(companyId: string): Promise<{
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

/** Priority:
 * 1) Entitlement "maksimal.blok" (numeric)
 * 2) package/plan (offering slug) → tier map
 * 3) plan hint dari cookie/header/env
 * 4) DEFAULT_MAX_BLOCKS
 */
async function resolveMaxBlocks(
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
                (e) => e.code === "maksimal.blok" && (e.enabled ?? true)
            );
            const val: MaybeNum =
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
            if (pkgFromWh && BlockTierLimit[pkgFromWh]) {
                const max = BlockTierLimit[pkgFromWh];
                EntCache[companyId] = { max, exp: now() + 5 * 60_000 };
                return max;
            }
        }
    }

    const hint = (planHint || pkgFromWh || "").toUpperCase();
    if (hint && BlockTierLimit[hint]) {
        const max = BlockTierLimit[hint];
        if (companyId) EntCache[companyId] = { max, exp: now() + 60_000 };
        return max;
    }

    const max = DEFAULT_MAX_BLOCKS;
    if (companyId) EntCache[companyId] = { max, exp: now() + 60_000 };
    return max;
}

async function countBlocks(): Promise<number> {
    return prisma.zona.count();
}

/* ===================== Helpers lama ===================== */
function genZonaCode() {
    const ts = Date.now().toString().slice(-5);
    const rnd = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0");
    return `Z${ts}${rnd}`;
}
function toVariants(s: string) {
    const t = s.trim();
    const title = t
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => (w[0]?.toUpperCase() ?? "") + w.slice(1))
        .join(" ");
    return Array.from(
        new Set([t, t.toLowerCase(), t.toUpperCase(), title])
    ).filter(Boolean) as string[];
}

/* ===================== POST /api/zona ===================== */
const postSchema = z.object({
    nama: z.string().min(1, "Nama wajib diisi"),
    kode: z.string().trim().optional(),
    deskripsi: z.string().trim().nullable().optional(),
    petugasId: z.string().trim().nullable().optional(),
    initialMeter: z.number().int().min(0).optional(),
    tandonId: z.string().trim().nullable().optional(),
});

export async function POST(req: NextRequest) {
    const prisma = await db();
    try {
        const body = await req.json();
        const parsed = postSchema.safeParse(body);
        if (!parsed.success) {
            const msg = parsed.error.issues.map((i) => i.message).join(", ");
            return NextResponse.json(
                { ok: false, message: msg },
                { status: 400 }
            );
        }

        const companyId = getCompanyIdFromReq(req);
        const planHint = getPlanFromReq(req);

        // ====== QUOTA: cek dalam transaksi (anti-race) ======
        const result = await prisma.$transaction(async (tx) => {
            const max = await resolveMaxBlocks(companyId, planHint);
            const used = await tx.zona.count(); // hanya blok aktif (zona tidak ada soft delete di skema ini)
            if (used >= max) {
                return { blocked: true as const, used, max };
            }

            const namaRaw = parsed.data.nama ?? "";
            const deskripsiRaw = parsed.data.deskripsi ?? null;
            const kodeRaw = parsed.data.kode ?? "";
            const kode = (kodeRaw.trim().length ? kodeRaw : genZonaCode())
                .trim()
                .toUpperCase();

            let petugasId: string | null =
                parsed.data.petugasId === "" || parsed.data.petugasId == null
                    ? null
                    : String(parsed.data.petugasId);

            const initialMeter = Number.isFinite(
                parsed.data.initialMeter as number
            )
                ? Math.max(0, Number(parsed.data.initialMeter))
                : 0;

            let tandonId: string | null =
                parsed.data.tandonId === "" || parsed.data.tandonId == null
                    ? null
                    : String(parsed.data.tandonId);

            if (petugasId) {
                const petugas = await tx.user.findUnique({
                    where: { id: petugasId },
                    select: { id: true, role: true, isActive: true },
                });
                if (!petugas)
                    return {
                        blocked: "ERR" as const,
                        err: NextResponse.json(
                            { ok: false, message: "Petugas tidak ditemukan" },
                            { status: 404 }
                        ),
                    };
                if (petugas.role !== "PETUGAS" || !petugas.isActive) {
                    return {
                        blocked: "ERR" as const,
                        err: NextResponse.json(
                            {
                                ok: false,
                                message: "User terpilih bukan PETUGAS aktif",
                            },
                            { status: 400 }
                        ),
                    };
                }
            }

            if (tandonId) {
                const tandon = await tx.tandon.findUnique({
                    where: { id: tandonId },
                    select: { id: true },
                });
                if (!tandon)
                    return {
                        blocked: "ERR" as const,
                        err: NextResponse.json(
                            { ok: false, message: "Tandon tidak ditemukan" },
                            { status: 404 }
                        ),
                    };
            }

            const created = await tx.zona.create({
                data: {
                    nama: namaRaw.trim(),
                    kode,
                    deskripsi: deskripsiRaw ? deskripsiRaw.trim() : null,
                    petugasId,
                    initialMeter,
                    tandonId,
                },
                select: {
                    id: true,
                    kode: true,
                    nama: true,
                    deskripsi: true,
                    petugasId: true,
                    petugas: {
                        select: { id: true, name: true, username: true },
                    },
                    initialMeter: true,
                    tandonId: true,
                },
            });

            return { blocked: false as const, created, used: used + 1, max };
        });

        if (result.blocked === true) {
            return NextResponse.json(
                {
                    ok: false,
                    code: "QUOTA_EXCEEDED",
                    message: `Kuota blok habis. Paket ini maksimum ${result.max} blok. Silakan hapus blok yang tidak dipakai atau upgrade paket.`,
                    meta: {
                        used: result.used,
                        max: result.max,
                        remaining: Math.max(0, result.max - result.used),
                    },
                },
                { status: 403 }
            );
        }
        if (result.blocked === "ERR") return result.err as NextResponse;

        return NextResponse.json(
            {
                ok: true,
                item: result.created,
                quota: {
                    used: result.used,
                    max: result.max,
                    remaining: Math.max(0, result.max - result.used),
                },
                message: "Zona berhasil dibuat",
            },
            { status: 201 }
        );
    } catch (e: any) {
        if (e?.code === "P2002")
            return NextResponse.json(
                { ok: false, message: "Kode zona sudah dipakai" },
                { status: 409 }
            );
        if (e?.code === "P2003")
            return NextResponse.json(
                { ok: false, message: "Relasi tidak valid" },
                { status: 400 }
            );
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}

/* ===================== GET /api/zona ===================== */
export async function GET(req: NextRequest) {
    const prisma = await db();
    try {
        const sp = req.nextUrl.searchParams;

        // Quick quota lookup untuk UI
        if (sp.get("quota") === "1") {
            const companyId = getCompanyIdFromReq(req);
            const planHint = getPlanFromReq(req);
            const max = await resolveMaxBlocks(companyId, planHint);
            const used = await countBlocks();
            return NextResponse.json({
                ok: true,
                quota: { used, max, remaining: Math.max(0, max - used) },
            });
        }

        const pageRaw = parseInt(sp.get("page") ?? "1", 10);
        const sizeRaw = parseInt(sp.get("pageSize") ?? "10", 10);
        const q = (sp.get("q") ?? "").trim();
        const filterPetugasId = sp.get("petugasId") ?? undefined;

        const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
        const pageSize =
            Number.isFinite(sizeRaw) && sizeRaw > 0
                ? Math.min(sizeRaw, 100)
                : 10;

        const whereBase: Prisma.ZonaWhereInput = {
            ...(filterPetugasId ? { petugasId: filterPetugasId } : {}),
        };
        let where: Prisma.ZonaWhereInput = whereBase;

        if (q) {
            const variants = toVariants(q);
            const containsAny = (field: "nama" | "kode" | "deskripsi") =>
                variants.map((v) => ({
                    [field]: { contains: v },
                })) as Prisma.ZonaWhereInput[];
            where = {
                AND: [
                    whereBase,
                    {
                        OR: [
                            ...containsAny("nama"),
                            ...containsAny("kode"),
                            ...containsAny("deskripsi"),
                        ],
                    },
                ],
            };
        }

        const total = await prisma.zona.count({ where });
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(page, totalPages);

        const rows = await prisma.zona.findMany({
            where,
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            skip: (safePage - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                kode: true,
                nama: true,
                deskripsi: true,
                petugasId: true,
                petugas: { select: { id: true, name: true, username: true } },
                _count: { select: { pelanggan: true } },
                initialMeter: true,
                tandonId: true,
            },
        });

        const items = rows.map((r) => ({
            id: r.id,
            kode: r.kode,
            nama: r.nama,
            deskripsi: r.deskripsi ?? "",
            petugasId: r.petugasId ?? null,
            petugas: r.petugas
                ? {
                      id: r.petugas.id,
                      name: r.petugas.name,
                      username: r.petugas.username ?? undefined,
                  }
                : null,
            pelangganCount: r._count.pelanggan,
            initialMeter: r.initialMeter ?? 0,
            tandonId: r.tandonId ?? null,
        }));

        return NextResponse.json({
            ok: true,
            items,
            pagination: { page: safePage, pageSize, total, totalPages },
        });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}

/* ===================== PUT (tanpa perubahan kuota) ===================== */
const putSchema = z.object({
    id: z.string().optional(),
    nama: z.string().min(1).optional(),
    kode: z.string().optional(),
    deskripsi: z.string().nullable().optional(),
    petugasId: z.union([z.string(), z.null()]).optional(),
    initialMeter: z.number().int().min(0).optional(),
    tandonId: z.union([z.string(), z.null()]).optional(),
});

export async function PUT(req: NextRequest) {
    console.log("📨 [PUT /api/zona] URL:", req.url);
    const prisma = await db();
    try {
        const urlId = req.nextUrl.searchParams.get("id") ?? undefined;
        console.log("🔎 query.id =", urlId);

        const raw = await req.json().catch(() => ({}));
        console.log("🧾 raw body =", raw);

        const parsed = putSchema.safeParse(raw);
        if (!parsed.success) {
            const msg = parsed.error.issues.map((i) => i.message).join(", ");
            console.log("❌ zod error =", parsed.error.issues);
            return NextResponse.json(
                { ok: false, message: msg },
                { status: 400 }
            );
        }

        const body = parsed.data;
        const id = body.id ?? urlId;
        if (!id) {
            console.log("❗ missing ID (body.id/urlId)");
            return NextResponse.json(
                { ok: false, message: "ID wajib disertakan" },
                { status: 400 }
            );
        }

        let petugasId: string | null | undefined = body.petugasId;
        if (petugasId === "") petugasId = null;
        console.log("🛠️ normalized petugasId =", petugasId);

        if (petugasId != null) {
            const petugas = await prisma.user.findUnique({
                where: { id: petugasId },
                select: { id: true, role: true, isActive: true },
            });
            console.log("👤 cek petugas =", petugas);
            if (!petugas)
                return NextResponse.json(
                    { ok: false, message: "Petugas tidak ditemukan" },
                    { status: 404 }
                );
            if (petugas.role !== "PETUGAS" || !petugas.isActive) {
                return NextResponse.json(
                    { ok: false, message: "User terpilih bukan PETUGAS aktif" },
                    { status: 400 }
                );
            }
        }

        let tandonId: string | null | undefined = body.tandonId;
        if (tandonId === "") tandonId = null;
        if (tandonId != null) {
            const tandon = await prisma.tandon.findUnique({
                where: { id: tandonId },
                select: { id: true },
            });
            if (!tandon)
                return NextResponse.json(
                    { ok: false, message: "Tandon tidak ditemukan" },
                    { status: 404 }
                );
        }

        const data: Prisma.ZonaUpdateInput = {};
        if (body.nama !== undefined) data.nama = body.nama.trim();
        if (body.kode !== undefined) data.kode = body.kode.trim().toUpperCase();
        if (body.deskripsi !== undefined)
            data.deskripsi = body.deskripsi?.trim() || null;
        if (petugasId !== undefined) data.petugasId = petugasId;
        if (body.initialMeter !== undefined)
            data.initialMeter = Math.max(0, Number(body.initialMeter));
        if (tandonId !== undefined) data.tandonId = tandonId;

        console.log("📦 update data =", data);

        const updated = await prisma.zona.update({
            where: { id },
            data,
            select: {
                id: true,
                kode: true,
                nama: true,
                deskripsi: true,
                petugasId: true,
                petugas: { select: { id: true, name: true, username: true } },
                initialMeter: true,
                tandonId: true,
            },
        });

        console.log("✅ updated zona =", updated);

        return NextResponse.json({
            ok: true,
            item: {
                id: updated.id,
                kode: updated.kode,
                nama: updated.nama,
                deskripsi: updated.deskripsi ?? "",
                petugasId: updated.petugasId ?? null,
                petugasNama: updated.petugas?.name ?? null,
                initialMeter: updated.initialMeter ?? 0,
                tandonId: updated.tandonId ?? null,
            },
            message: "Zona berhasil diperbarui",
        });
    } catch (e: any) {
        console.error("💥 PUT /api/zona error =", e);
        if (e?.code === "P2025")
            return NextResponse.json(
                { ok: false, message: "Zona tidak ditemukan" },
                { status: 404 }
            );
        if (e?.code === "P2002")
            return NextResponse.json(
                { ok: false, message: "Kode zona sudah dipakai" },
                { status: 409 }
            );
        if (e?.code === "P2003")
            return NextResponse.json(
                { ok: false, message: "Relasi tidak valid" },
                { status: 400 }
            );
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}

/* ===================== DELETE (tanpa perubahan) ===================== */
export async function DELETE(req: NextRequest) {
    const prisma = await db();
    try {
        const urlId = req.nextUrl.searchParams.get("id") ?? undefined;
        const body = await req.json().catch(() => ({} as unknown));
        const id = (body as { id?: string })?.id ?? urlId;
        if (!id)
            return NextResponse.json(
                { ok: false, message: "ID wajib disertakan" },
                { status: 400 }
            );

        const used = await prisma.pelanggan.count({ where: { zonaId: id } });
        if (used > 0) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Zona masih memiliki pelanggan. Pindahkan/lepaskan pelanggan terlebih dahulu.",
                },
                { status: 409 }
            );
        }

        await prisma.zona.delete({ where: { id } });
        return NextResponse.json({
            ok: true,
            message: "Zona berhasil dihapus",
        });
    } catch (e: any) {
        if (e?.code === "P2025")
            return NextResponse.json(
                { ok: false, message: "Zona tidak ditemukan" },
                { status: 404 }
            );
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}

// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { z } from "zod";
// import type { Prisma } from "@prisma/client";

// // ===== Helpers =====
// function genZonaCode() {
//   const ts = Date.now().toString().slice(-5);
//   const rnd = Math.floor(Math.random() * 100)
//     .toString()
//     .padStart(2, "0");
//   return `Z${ts}${rnd}`;
// }
// function toVariants(s: string) {
//   const t = s.trim();
//   const title = t
//     .toLowerCase()
//     .split(/\s+/)
//     .filter(Boolean)
//     .map((w) => (w[0]?.toUpperCase() ?? "") + w.slice(1))
//     .join(" ");
//   return Array.from(
//     new Set([t, t.toLowerCase(), t.toUpperCase(), title])
//   ).filter(Boolean) as string[];
// }

// // ===================================================================
// // POST /api/zona
// // body: { nama: string; kode?: string; deskripsi?: string|null; petugasId?: string|null; initialMeter?: number; tandonId?: string|null }
// // ===================================================================
// const postSchema = z.object({
//   nama: z.string().min(1, "Nama wajib diisi"),
//   kode: z.string().trim().optional(),
//   deskripsi: z.string().trim().nullable().optional(),
//   petugasId: z.string().trim().nullable().optional(), // null = tanpa petugas
//   // NEW:
//   initialMeter: z.number().int().min(0).optional(),
//   tandonId: z.string().trim().nullable().optional(),
// });

// export async function POST(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const body = await req.json();
//     const parsed = postSchema.safeParse(body);
//     if (!parsed.success) {
//       const msg = parsed.error.issues.map((i) => i.message).join(", ");
//       return NextResponse.json({ ok: false, message: msg }, { status: 400 });
//     }

//     const namaRaw = parsed.data.nama ?? "";
//     const deskripsiRaw = parsed.data.deskripsi ?? null;
//     const kodeRaw = parsed.data.kode ?? "";
//     const kode = (kodeRaw.trim().length ? kodeRaw : genZonaCode())
//       .trim()
//       .toUpperCase();

//     let petugasId: string | null =
//       parsed.data.petugasId === "" || parsed.data.petugasId == null
//         ? null
//         : String(parsed.data.petugasId);

//     // NEW:
//     const initialMeter = Number.isFinite(parsed.data.initialMeter as number)
//       ? Math.max(0, Number(parsed.data.initialMeter))
//       : 0;

//     let tandonId: string | null =
//       parsed.data.tandonId === "" || parsed.data.tandonId == null
//         ? null
//         : String(parsed.data.tandonId);

//     // Validasi petugas (jika ada)
//     if (petugasId) {
//       const petugas = await prisma.user.findUnique({
//         where: { id: petugasId },
//         select: { id: true, role: true, isActive: true },
//       });
//       if (!petugas)
//         return NextResponse.json(
//           { ok: false, message: "Petugas tidak ditemukan" },
//           { status: 404 }
//         );
//       if (petugas.role !== "PETUGAS" || !petugas.isActive) {
//         return NextResponse.json(
//           { ok: false, message: "User terpilih bukan PETUGAS aktif" },
//           { status: 400 }
//         );
//       }
//     }

//     // NEW: Validasi tandon (jika ada)
//     if (tandonId) {
//       const tandon = await prisma.tandon.findUnique({
//         where: { id: tandonId },
//         select: { id: true },
//       });
//       if (!tandon)
//         return NextResponse.json(
//           { ok: false, message: "Tandon tidak ditemukan" },
//           { status: 404 }
//         );
//     }

//     const created = await prisma.zona.create({
//       data: {
//         nama: namaRaw.trim(),
//         kode,
//         deskripsi: deskripsiRaw ? deskripsiRaw.trim() : null,
//         petugasId,
//         // NEW:
//         initialMeter,
//         tandonId,
//       },
//       select: {
//         id: true,
//         kode: true,
//         nama: true,
//         deskripsi: true,
//         petugasId: true,
//         petugas: { select: { id: true, name: true, username: true } },
//         // NEW (opsional untuk verifikasi):
//         initialMeter: true,
//         tandonId: true,
//       },
//     });

//     return NextResponse.json(
//       { ok: true, item: created, message: "Zona berhasil dibuat" },
//       { status: 201 }
//     );
//   } catch (e: any) {
//     if (e?.code === "P2002") {
//       return NextResponse.json(
//         { ok: false, message: "Kode zona sudah dipakai" },
//         { status: 409 }
//       );
//     }
//     if (e?.code === "P2003") {
//       return NextResponse.json(
//         { ok: false, message: "Relasi tidak valid" },
//         { status: 400 }
//       );
//     }
//     return NextResponse.json(
//       { ok: false, message: e?.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }

// // ===================================================================
// // GET /api/zona?page=1&pageSize=10&q=...&petugasId=... — (tidak wajib ubah)
// // ===================================================================
// export async function GET(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const sp = req.nextUrl.searchParams;
//     const pageRaw = parseInt(sp.get("page") ?? "1", 10);
//     const sizeRaw = parseInt(sp.get("pageSize") ?? "10", 10);
//     const q = (sp.get("q") ?? "").trim();
//     const filterPetugasId = sp.get("petugasId") ?? undefined;

//     const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
//     const pageSize =
//       Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.min(sizeRaw, 100) : 10;

//     const whereBase: Prisma.ZonaWhereInput = {
//       ...(filterPetugasId ? { petugasId: filterPetugasId } : {}),
//     };
//     let where: Prisma.ZonaWhereInput = whereBase;

//     if (q) {
//       const variants = toVariants(q);
//       const containsAny = (field: "nama" | "kode" | "deskripsi") =>
//         variants.map((v) => ({
//           [field]: { contains: v },
//         })) as Prisma.ZonaWhereInput[];
//       where = {
//         AND: [
//           whereBase,
//           {
//             OR: [
//               ...containsAny("nama"),
//               ...containsAny("kode"),
//               ...containsAny("deskripsi"),
//             ],
//           },
//         ],
//       };
//     }

//     const total = await prisma.zona.count({ where });
//     const totalPages = Math.max(1, Math.ceil(total / pageSize));
//     const safePage = Math.min(page, totalPages);

//     const rows = await prisma.zona.findMany({
//       where,
//       orderBy: [{ createdAt: "asc" }, { id: "asc" }],
//       skip: (safePage - 1) * pageSize,
//       take: pageSize,
//       select: {
//         id: true,
//         kode: true,
//         nama: true,
//         deskripsi: true,
//         petugasId: true,
//         petugas: { select: { id: true, name: true, username: true } },
//         _count: { select: { pelanggan: true } },
//         // NEW (opsional, bila nanti mau dipakai di UI list):
//         initialMeter: true,
//         tandonId: true,
//       },
//     });

//     const items = rows.map((r) => ({
//       id: r.id,
//       kode: r.kode,
//       nama: r.nama,
//       deskripsi: r.deskripsi ?? "",
//       petugasId: r.petugasId ?? null,
//       petugas: r.petugas
//         ? {
//             id: r.petugas.id,
//             name: r.petugas.name,
//             username: r.petugas.username ?? undefined,
//           }
//         : null,
//       pelangganCount: r._count.pelanggan,
//       // NEW:
//       initialMeter: r.initialMeter ?? 0,
//       tandonId: r.tandonId ?? null,
//     }));

//     return NextResponse.json({
//       ok: true,
//       items,
//       pagination: { page: safePage, pageSize, total, totalPages },
//     });
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, message: e?.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }

// // ===================================================================
// // PUT /api/zona?id=ZONA_ID — update parsial (+ initialMeter, tandonId)
// // ===================================================================
// const putSchema = z.object({
//   id: z.string().optional(),
//   nama: z.string().min(1).optional(),
//   kode: z.string().optional(),
//   deskripsi: z.string().nullable().optional(),
//   petugasId: z.union([z.string(), z.null()]).optional(),
//   // NEW:
//   initialMeter: z.number().int().min(0).optional(),
//   tandonId: z.union([z.string(), z.null()]).optional(),
// });

// export async function PUT(req: NextRequest) {
//   const prisma = await db();
//   console.log("📨 [PUT /api/zona] URL:", req.url);
//   try {
//     const urlId = req.nextUrl.searchParams.get("id") ?? undefined;
//     console.log("🔎 query.id =", urlId);

//     const raw = await req.json().catch(() => ({}));
//     console.log("🧾 raw body =", raw);

//     const parsed = putSchema.safeParse(raw);
//     if (!parsed.success) {
//       const msg = parsed.error.issues.map((i) => i.message).join(", ");
//       console.log("❌ zod error =", parsed.error.issues);
//       return NextResponse.json({ ok: false, message: msg }, { status: 400 });
//     }

//     const body = parsed.data;
//     const id = body.id ?? urlId;
//     if (!id) {
//       console.log("❗ missing ID (body.id/urlId)");
//       return NextResponse.json(
//         { ok: false, message: "ID wajib disertakan" },
//         { status: 400 }
//       );
//     }

//     // Normalisasi petugasId
//     let petugasId: string | null | undefined = body.petugasId;
//     if (petugasId === "") petugasId = null;
//     console.log("🛠️ normalized petugasId =", petugasId);

//     // Validasi petugas jika diisi (bukan null)
//     if (petugasId != null) {
//       const petugas = await prisma.user.findUnique({
//         where: { id: petugasId },
//         select: { id: true, role: true, isActive: true },
//       });
//       console.log("👤 cek petugas =", petugas);
//       if (!petugas)
//         return NextResponse.json(
//           { ok: false, message: "Petugas tidak ditemukan" },
//           { status: 404 }
//         );
//       if (petugas.role !== "PETUGAS" || !petugas.isActive) {
//         return NextResponse.json(
//           { ok: false, message: "User terpilih bukan PETUGAS aktif" },
//           { status: 400 }
//         );
//       }
//     }

//     // NEW: Normalisasi & validasi tandon
//     let tandonId: string | null | undefined = body.tandonId;
//     if (tandonId === "") tandonId = null;
//     if (tandonId != null) {
//       const tandon = await prisma.tandon.findUnique({
//         where: { id: tandonId },
//         select: { id: true },
//       });
//       if (!tandon)
//         return NextResponse.json(
//           { ok: false, message: "Tandon tidak ditemukan" },
//           { status: 404 }
//         );
//     }

//     const data: Prisma.ZonaUpdateInput = {};
//     if (body.nama !== undefined) data.nama = body.nama.trim();
//     if (body.kode !== undefined) data.kode = body.kode.trim().toUpperCase();
//     if (body.deskripsi !== undefined)
//       data.deskripsi = body.deskripsi?.trim() || null;
//     if (petugasId !== undefined) data.petugasId = petugasId;
//     // NEW:
//     if (body.initialMeter !== undefined)
//       data.initialMeter = Math.max(0, Number(body.initialMeter));
//     if (tandonId !== undefined) data.tandonId = tandonId;

//     console.log("📦 update data =", data);

//     const updated = await prisma.zona.update({
//       where: { id },
//       data,
//       select: {
//         id: true,
//         kode: true,
//         nama: true,
//         deskripsi: true,
//         petugasId: true,
//         petugas: { select: { id: true, name: true, username: true } },
//         // NEW:
//         initialMeter: true,
//         tandonId: true,
//       },
//     });

//     console.log("✅ updated zona =", updated);

//     return NextResponse.json({
//       ok: true,
//       item: {
//         id: updated.id,
//         kode: updated.kode,
//         nama: updated.nama,
//         deskripsi: updated.deskripsi ?? "",
//         petugasId: updated.petugasId ?? null,
//         petugasNama: updated.petugas?.name ?? null,
//         // NEW:
//         initialMeter: updated.initialMeter ?? 0,
//         tandonId: updated.tandonId ?? null,
//       },
//       message: "Zona berhasil diperbarui",
//     });
//   } catch (e: any) {
//     console.error("💥 PUT /api/zona error =", e);
//     if (e?.code === "P2025") {
//       return NextResponse.json(
//         { ok: false, message: "Zona tidak ditemukan" },
//         { status: 404 }
//       );
//     }
//     if (e?.code === "P2002") {
//       return NextResponse.json(
//         { ok: false, message: "Kode zona sudah dipakai" },
//         { status: 409 }
//       );
//     }
//     if (e?.code === "P2003") {
//       return NextResponse.json(
//         { ok: false, message: "Relasi tidak valid" },
//         { status: 400 }
//       );
//     }
//     return NextResponse.json(
//       { ok: false, message: e?.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }

// // ===================================================================
// // DELETE /api/zona — (tanpa perubahan)
// // ===================================================================
// export async function DELETE(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const urlId = req.nextUrl.searchParams.get("id") ?? undefined;
//     const body = await req.json().catch(() => ({} as unknown));
//     const id = (body as { id?: string })?.id ?? urlId;
//     if (!id)
//       return NextResponse.json(
//         { ok: false, message: "ID wajib disertakan" },
//         { status: 400 }
//       );

//     const used = await prisma.pelanggan.count({ where: { zonaId: id } });
//     if (used > 0) {
//       return NextResponse.json(
//         {
//           ok: false,
//           message:
//             "Zona masih memiliki pelanggan. Pindahkan/lepaskan pelanggan terlebih dahulu.",
//         },
//         { status: 409 }
//       );
//     }

//     await prisma.zona.delete({ where: { id } });
//     return NextResponse.json({ ok: true, message: "Zona berhasil dihapus" });
//   } catch (e: any) {
//     if (e?.code === "P2025") {
//       return NextResponse.json(
//         { ok: false, message: "Zona tidak ditemukan" },
//         { status: 404 }
//       );
//     }
//     return NextResponse.json(
//       { ok: false, message: e?.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }
