// // app/api/pelanggan/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { z } from "zod";
// import bcrypt from "bcryptjs";
// import { Prisma } from "@prisma/client";
// import jwt from "jsonwebtoken";

// // ========== Helpers singkat ==========
// function genCustomerCode(name: string) {
//   const base = (name || "TB")
//     .trim()
//     .toUpperCase()
//     .replace(/[^A-Z0-9]/g, "");
//   const four = Math.random().toString().slice(2, 6);
//   return `TB${base.slice(0, 2)}${four}`;
// }

// function genUsername(name: string) {
//   const slug = (name || "warga").toLowerCase().replace(/[^a-z0-9]/g, "");
//   const n = Math.random().toString(36).slice(2, 5);
//   return `${slug}${n}`;
// }

// // ========= Validasi body (CREATE) =========
// const latSchema = z
//   .preprocess(
//     (v) => (v === "" || v === undefined ? null : Number(v)),
//     z.number().gte(-90).lte(90)
//   )
//   .nullable();

// const lngSchema = z
//   .preprocess(
//     (v) => (v === "" || v === undefined ? null : Number(v)),
//     z.number().gte(-180).lte(180)
//   )
//   .nullable();

// // 🔹 TAMBAH zonaId (opsional)
// const bodySchema = z.object({
//   nama: z.string().min(1, "Nama wajib diisi"),
//   wa: z.string().trim().optional(),
//   alamat: z.string().min(1, "Alamat wajib diisi"),
//   meterAwal: z.number().int().nonnegative().optional().default(0),
//   zonaId: z.string().trim().nullable().optional(), // 🔹
//   noUrutRumah: z.number().int().positive().optional(),
//   username: z
//     .string()
//     .min(3)
//     .max(30)
//     .regex(/^[a-z0-9_]+$/i)
//     .optional(),
//   password: z.string().min(6).max(100).optional(),
//   lat: latSchema.optional(),
//   lng: lngSchema.optional(),
// });

// // ========= CREATE =========
// export async function POST(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const json = await req.json();
//     const parsed = bodySchema.safeParse(json);
//     if (!parsed.success) {
//       const msg = parsed.error.issues.map((i) => i.message).join(", ");
//       return NextResponse.json({ ok: false, message: msg }, { status: 400 });
//     }

//     const {
//       nama,
//       wa,
//       alamat,
//       meterAwal,
//       username,
//       password,
//       lat: latIn,
//       lng: lngIn,
//     } = parsed.data;
//     const zonaId = parsed.data.zonaId ? parsed.data.zonaId : null;
//     let noUrutRumah = parsed.data.noUrutRumah ?? null;

//     const lat = latIn ?? null; // number | null
//     const lng = lngIn ?? null; // number | null

//     if (zonaId) {
//       const existsZona = await prisma.zona.findUnique({
//         where: { id: zonaId },
//         select: { id: true },
//       });
//       if (!existsZona)
//         return NextResponse.json(
//           { ok: false, message: "Zona tidak ditemukan" },
//           { status: 404 }
//         );
//     }

//     const kode = genCustomerCode(nama);
//     const finalUsername = username ?? genUsername(nama);

//     // ⬇️ kalau user kirim password, pakai itu; kalau tidak, generate temporer
//     const rawPassword =
//       (password && String(password)) ||
//       `tb-${Math.random().toString(36).slice(2, 8)}`;
//     const passwordHash = await bcrypt.hash(rawPassword, 10);

//     const result = await prisma.$transaction(async (tx) => {
//       // 1) create user (hash masuk ke tabel user)
//       const user = await tx.user.create({
//         data: {
//           username: finalUsername,
//           passwordHash,
//           name: nama,
//           phone: wa ?? null,
//           role: "WARGA",
//           isActive: true,
//         },
//         select: { id: true, username: true, name: true },
//       });

//       // 2) auto noUrutRumah jika perlu
//       if (zonaId && noUrutRumah === null) {
//         const max = await tx.pelanggan.aggregate({
//           where: { zonaId, deletedAt: null },
//           _max: { noUrutRumah: true },
//         });
//         noUrutRumah = (max._max.noUrutRumah ?? 0) + 1;
//       }

//       // 3) create pelanggan (SIMPAN plaintext di kolom baru)
//       const pelanggan = await tx.pelanggan.create({
//         data: {
//           kode,
//           nama,
//           wa: wa ?? null,
//           alamat,
//           meterAwal: meterAwal ?? 0,
//           userId: user.id,
//           statusAktif: true,
//           zonaId,
//           noUrutRumah,
//           passwordPlain: rawPassword,
//           lat,
//           lng,
//         },
//         select: {
//           id: true,
//           kode: true,
//           nama: true,
//           zonaId: true,
//           noUrutRumah: true,
//           lat: true,
//           lng: true,
//         },
//       });

//       return { user, pelanggan };
//     });

//     return NextResponse.json(
//       {
//         ok: true,
//         data: {
//           pelanggan: result.pelanggan,
//           user: { username: result.user.username },
//           tempPassword: rawPassword, // tetap dikirim balik kalau perlu ditampilkan
//         },
//         message: "Pelanggan & user berhasil dibuat",
//       },
//       { status: 201 }
//     );
//   } catch (e: any) {
//     if (e?.code === "P2002") {
//       return NextResponse.json(
//         {
//           ok: false,
//           message: "Data bentrok (username/kode atau nomor urut di zona).",
//         },
//         { status: 409 }
//       );
//     }
//     return NextResponse.json(
//       { ok: false, message: e?.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }

// // Helper kecil untuk "Title Case"
// function toTitleCase(s: string) {
//   return s
//     .toLowerCase()
//     .split(/\s+/)
//     .filter(Boolean)
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// export async function GET(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const sp = req.nextUrl.searchParams;
//     const pageRaw = parseInt(sp.get("page") ?? "1", 10);
//     const sizeRaw = parseInt(sp.get("pageSize") ?? "10", 10);

//     const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
//     const pageSize =
//       Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.min(sizeRaw, 100) : 10;

//     const qRaw = (sp.get("q") ?? "").trim();
//     const qDigits = qRaw.replace(/\D/g, "");

//     const whereBase: Prisma.PelangganWhereInput = { deletedAt: null };
//     let where: Prisma.PelangganWhereInput = whereBase;

//     if (qRaw) {
//       const variants = Array.from(
//         new Set([
//           qRaw,
//           qRaw.toLowerCase(),
//           qRaw.toUpperCase(),
//           toTitleCase(qRaw),
//         ])
//       ).filter(Boolean) as string[];

//       const containsAny = (field: "nama" | "kode" | "alamat" | "wa") =>
//         variants.map((v) => ({
//           [field]: { contains: v },
//         })) as Prisma.PelangganWhereInput[];

//       const orBase: Prisma.PelangganWhereInput["OR"] = [
//         ...containsAny("nama"),
//         ...containsAny("kode"),
//         ...containsAny("alamat"),
//         ...containsAny("wa"),
//       ];
//       if (qDigits.length >= 3) {
//         orBase.push({ wa: { contains: qDigits } });
//       }
//       where = { AND: [whereBase, { OR: orBase }] };
//     }

//     console.log("🔎 /api/pelanggan GET", {
//       qRaw,
//       qDigits,
//       page,
//       pageSize,
//       where,
//     });

//     const total = await prisma.pelanggan.count({ where });
//     const totalPages = Math.max(1, Math.ceil(total / pageSize));
//     const safePage = Math.min(page, totalPages);

//     const items = await prisma.pelanggan.findMany({
//       where,
//       orderBy: [
//         // zona terisi dulu (null di belakang)
//         { zonaId: { sort: "asc", nulls: "last" } as any },
//         // dalam zona, urut nama zona biar stabil
//         { zona: { nama: "asc" } },
//         // urut nomor urut, yang null di belakang
//         { noUrutRumah: { sort: "asc", nulls: "last" } as any },
//         // penstabil
//         { createdAt: "asc" },
//         { id: "asc" },
//       ],
//       skip: (safePage - 1) * pageSize,
//       take: pageSize,
//       select: {
//         id: true,
//         kode: true,
//         nama: true,
//         wa: true,
//         alamat: true,
//         meterAwal: true,
//         statusAktif: true,
//         createdAt: true,
//         zonaId: true,
//         noUrutRumah: true,
//         lat: true,
//         lng: true,
//         zona: { select: { id: true, nama: true, deskripsi: true } },
//       },
//     });

//     console.log("🔎 result:", {
//       count: items.length,
//       total,
//       safePage,
//       totalPages,
//     });

//     return NextResponse.json({
//       ok: true,
//       items,
//       pagination: { page: safePage, pageSize, total, totalPages },
//     });
//   } catch (e: any) {
//     console.error("❌ GET /api/pelanggan error:", e);
//     return NextResponse.json(
//       { ok: false, message: e?.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }

// // ========= UPDATE =========
// export async function PUT(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const urlId = req.nextUrl.searchParams.get("id") ?? undefined;

//     let rawBody: unknown = {};
//     try {
//       rawBody = await req.json();
//     } catch {
//       rawBody = {};
//     }

//     const schema = z.object({
//       id: z.string().optional(),
//       nama: z.string().min(1).optional(),
//       wa: z.string().optional(),
//       alamat: z.string().min(1).optional(),
//       meterAwal: z.number().int().nonnegative().optional(),
//       status: z.enum(["aktif", "nonaktif"]).optional(),
//       zonaId: z.string().nullable().optional(),
//       noUrutRumah: z.number().int().positive().nullable().optional(),
//       lat: z.number().min(-90).max(90).nullable().optional(),
//       lng: z.number().min(-180).max(180).nullable().optional(),
//     });

//     const parsed = schema.safeParse(rawBody);
//     if (!parsed.success) {
//       const msg = parsed.error.issues.map((i) => i.message).join(", ");
//       return NextResponse.json({ ok: false, message: msg }, { status: 400 });
//     }

//     const body = parsed.data;
//     const id = body.id ?? urlId;
//     if (!id)
//       return NextResponse.json(
//         { ok: false, message: "ID wajib disertakan" },
//         { status: 400 }
//       );

//     // ✅ Perbaikan penting: preserve null ("" → null; null tetap null; undefined tetap undefined)
//     const zonaIdNorm =
//       body.zonaId !== undefined
//         ? body.zonaId === ""
//           ? null
//           : body.zonaId
//         : undefined;

//     const noUrutNorm =
//       body.noUrutRumah === null
//         ? null
//         : body.noUrutRumah === undefined
//         ? undefined
//         : Number(body.noUrutRumah);

//     // Validasi zona hanya bila zonaIdNorm ada & bukan null
//     if (zonaIdNorm !== undefined && zonaIdNorm !== null) {
//       const existsZona = await prisma.zona.findUnique({
//         where: { id: zonaIdNorm },
//         select: { id: true },
//       });
//       if (!existsZona)
//         return NextResponse.json(
//           { ok: false, message: "Zona tidak ditemukan" },
//           { status: 404 }
//         );
//     }

//     const current = await prisma.pelanggan.findUnique({
//       where: { id },
//       select: { meterAwal: true, zonaId: true, noUrutRumah: true },
//     });
//     if (!current)
//       return NextResponse.json(
//         { ok: false, message: "Pelanggan tidak ditemukan" },
//         { status: 404 }
//       );

//     const data: Prisma.PelangganUpdateInput = {};

//     const normalizeWA = (v?: string) => {
//       if (!v) return undefined;
//       const digits = v.replace(/\D/g, "");
//       if (!digits) return "";
//       if (digits.startsWith("0")) return `62${digits.slice(1)}`;
//       if (digits.startsWith("62")) return digits;
//       return digits;
//     };

//     if (body.nama !== undefined) data.nama = body.nama;
//     if (body.alamat !== undefined) data.alamat = body.alamat;
//     if (body.wa !== undefined) data.wa = normalizeWA(body.wa);
//     if (body.status !== undefined) data.statusAktif = body.status === "aktif";
//     // lat/lng boleh null (untuk mengosongkan)
//     if (body.lat !== undefined) (data as any).lat = body.lat;
//     if (body.lng !== undefined) (data as any).lng = body.lng;

//     const wantChangeMeterAwal =
//       body.meterAwal !== undefined && body.meterAwal !== current.meterAwal;
//     if (wantChangeMeterAwal) {
//       const used = await prisma.catatMeter.findFirst({
//         where: { pelangganId: id, deletedAt: null },
//         select: { id: true },
//       });
//       if (used) {
//         return NextResponse.json(
//           {
//             ok: false,
//             message:
//               "Meter Awal tidak bisa diedit karena pelanggan sudah pernah dicatat di Catat Meter.",
//           },
//           { status: 409 }
//         );
//       }
//       data.meterAwal = body.meterAwal;
//     }

//     type Meta = {
//       zonaChanged: boolean;
//       reordered: boolean;
//       from?: number | null;
//       to?: number | null;
//       clearedZona?: boolean;
//       appended?: boolean;
//     };

//     const { updated, meta } = await prisma.$transaction(async (tx) => {
//       const meta: Meta = { zonaChanged: false, reordered: false };

//       const zonaChanged =
//         zonaIdNorm !== undefined && zonaIdNorm !== current.zonaId;
//       meta.zonaChanged = !!zonaChanged;
//       const targetZonaId =
//         zonaIdNorm === undefined ? current.zonaId : zonaIdNorm;

//       // Selalu set zonaId kalau dikirim (termasuk null)
//       if (zonaIdNorm !== undefined) {
//         data.zonaId = zonaIdNorm;
//       }

//       // A) Reorder dalam zona yang sama
//       if (!zonaChanged && targetZonaId && typeof noUrutNorm === "number") {
//         const countInZona = await tx.pelanggan.count({
//           where: {
//             zonaId: targetZonaId,
//             deletedAt: null,
//             noUrutRumah: { not: null },
//           },
//         });

//         const from = current.noUrutRumah ?? countInZona + 1;
//         const to = Math.max(1, Math.min(noUrutNorm, Math.max(1, countInZona)));
//         meta.from = current.noUrutRumah ?? null;
//         meta.to = to;

//         if (from !== to) {
//           await tx.pelanggan.update({
//             where: { id },
//             data: { noUrutRumah: null },
//           });

//           if (from < to) {
//             await tx.pelanggan.updateMany({
//               where: {
//                 zonaId: targetZonaId,
//                 deletedAt: null,
//                 noUrutRumah: { gte: from + 1, lte: to },
//               },
//               data: { noUrutRumah: { decrement: 1 } },
//             });
//           } else {
//             await tx.pelanggan.updateMany({
//               where: {
//                 zonaId: targetZonaId,
//                 deletedAt: null,
//                 noUrutRumah: { gte: to, lte: from - 1 },
//               },
//               data: { noUrutRumah: { increment: 1 } },
//             });
//           }
//         }

//         (data as any).noUrutRumah = to;
//         meta.reordered = true;
//       }
//       // B) Zona tidak berubah & noUrut sebelumnya null → auto-set
//       else if (
//         !zonaChanged &&
//         current.zonaId &&
//         current.noUrutRumah == null &&
//         noUrutNorm === undefined
//       ) {
//         const last = await tx.pelanggan.findFirst({
//           where: {
//             zonaId: current.zonaId,
//             deletedAt: null,
//             noUrutRumah: { not: null },
//           },
//           orderBy: { noUrutRumah: "desc" },
//           select: { noUrutRumah: true },
//         });
//         (data as any).noUrutRumah = (last?.noUrutRumah ?? 0) + 1;
//         meta.appended = true;
//       }
//       // C) Pindah zona (termasuk ke null)
//       else if (zonaChanged) {
//         if (current.zonaId && current.noUrutRumah != null) {
//           await tx.pelanggan.updateMany({
//             where: {
//               zonaId: current.zonaId,
//               deletedAt: null,
//               noUrutRumah: { gt: current.noUrutRumah },
//             },
//             data: { noUrutRumah: { decrement: 1 } },
//           });
//         }
//         if (targetZonaId === null) {
//           (data as any).noUrutRumah = null;
//           meta.clearedZona = true;
//         } else {
//           const last = await tx.pelanggan.findFirst({
//             where: {
//               zonaId: targetZonaId,
//               deletedAt: null,
//               noUrutRumah: { not: null },
//             },
//             orderBy: { noUrutRumah: "desc" },
//             select: { noUrutRumah: true },
//           });
//           (data as any).noUrutRumah = (last?.noUrutRumah ?? 0) + 1;
//           meta.appended = true;
//         }
//       }
//       // D) User kirim null eksplisit (kosongkan)
//       else if (noUrutNorm === null) {
//         (data as any).noUrutRumah = null;
//       }

//       const updated = await tx.pelanggan.update({
//         where: { id },
//         data,
//         select: {
//           id: true,
//           kode: true,
//           nama: true,
//           wa: true,
//           alamat: true,
//           meterAwal: true,
//           statusAktif: true,
//           zonaId: true,
//           zona: { select: { id: true, nama: true } },
//           noUrutRumah: true,
//           lat: true,
//           lng: true,
//         },
//       });

//       return { updated, meta };
//     });

//     let successMsg = "Pelanggan berhasil diperbarui";
//     if (meta.reordered && !meta.zonaChanged && typeof meta.to === "number") {
//       successMsg = `Nomor urut pelanggan "${updated.nama}" dipindah ke ${updated.noUrutRumah}.`;
//     } else if (meta.zonaChanged && meta.clearedZona) {
//       successMsg = `Zona dikosongkan dan nomor urut dihapus.`;
//     } else if (meta.zonaChanged && meta.appended) {
//       successMsg = `Pelanggan dipindah ke zona baru dan diberi nomor urut ${updated.noUrutRumah}.`;
//     }

//     return NextResponse.json({
//       ok: true,
//       item: {
//         id: updated.id,
//         kodeCustomer: updated.kode,
//         nama: updated.nama,
//         noWA: updated.wa ?? "",
//         alamat: updated.alamat,
//         meterAwal: updated.meterAwal,
//         status: updated.statusAktif
//           ? ("aktif" as const)
//           : ("nonaktif" as const),
//         zonaId: updated.zonaId ?? null,
//         zonaNama: updated.zona?.nama ?? null,
//         noUrutRumah: updated.noUrutRumah ?? null,
//         lat: updated.lat != null ? Number(updated.lat) : null,
//         lng: updated.lng != null ? Number(updated.lng) : null,
//       },
//       message: successMsg,
//     });
//   } catch (e) {
//     console.error("❌ PUT /api/pelanggan:", e);
//     const err = e as { code?: string; message?: string };
//     if (err.code === "P2025") {
//       return NextResponse.json(
//         { ok: false, message: "Pelanggan tidak ditemukan" },
//         { status: 404 }
//       );
//     }
//     return NextResponse.json(
//       { ok: false, message: err.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }
// // --- helper JWT untuk DELETE ---
// type JwtPayload = { sub?: string };
// function getAuthUserId(req: NextRequest): string | null {
//   const token = req.cookies.get("tb_token")?.value;
//   if (!token) return null;
//   try {
//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET || "supersecret"
//     ) as JwtPayload;
//     return decoded.sub ?? null;
//   } catch {
//     return null;
//   }
// }

// // --- DELETE (soft delete) ---
// export async function DELETE(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const urlId = req.nextUrl.searchParams.get("id") ?? undefined;
//     const body = await req.json().catch(() => ({} as unknown));
//     const id = (body as { id?: string })?.id ?? urlId;
//     if (!id) {
//       return NextResponse.json(
//         { ok: false, message: "ID wajib disertakan" },
//         { status: 400 }
//       );
//     }

//     const used = await prisma.catatMeter.findFirst({
//       where: { pelangganId: id, deletedAt: null },
//       select: { id: true },
//     });
//     if (used) {
//       return NextResponse.json(
//         {
//           ok: false,
//           message:
//             "Pelanggan tidak bisa dihapus karena sudah pernah dipakai di Catat Meter. " +
//             "Hapus data Catat Meter terkait terlebih dahulu jika memang diperlukan.",
//         },
//         { status: 409 }
//       );
//     }

//     const userId = getAuthUserId(req);

//     const result = await prisma.pelanggan.updateMany({
//       where: { id, deletedAt: null },
//       data: {
//         deletedAt: new Date(),
//         deletedBy: userId ?? null,
//         statusAktif: false,
//       },
//     });

//     if (result.count === 0) {
//       return NextResponse.json(
//         { ok: false, message: "Pelanggan tidak ditemukan atau sudah dihapus" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       ok: true,
//       message: "Pelanggan berhasil dihapus (soft delete)",
//     });
//   } catch (e) {
//     const err = e as { code?: string; message?: string };
//     if (err.code === "P2025") {
//       return NextResponse.json(
//         { ok: false, message: "Pelanggan tidak ditemukan" },
//         { status: 404 }
//       );
//     }
//     return NextResponse.json(
//       { ok: false, message: err.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }

// app/api/pelanggan/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { z } from "zod";
// import bcrypt from "bcryptjs";
// import { Prisma } from "@prisma/client";
// import jwt from "jsonwebtoken";

// // ========== Helpers singkat ==========
// function genCustomerCode(name: string) {
//   const base = (name || "TB").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
//   const four = Math.random().toString().slice(2, 6);
//   return `TB${base.slice(0, 2)}${four}`;
// }

// function genUsername(name: string) {
//   const slug = (name || "warga").toLowerCase().replace(/[^a-z0-9]/g, "");
//   const n = Math.random().toString(36).slice(2, 5);
//   return `${slug}${n}`;
// }

// // ========= Validasi body (CREATE) =========
// const latSchema = z
//   .preprocess((v) => (v === "" || v === undefined ? null : Number(v)), z.number().gte(-90).lte(90))
//   .nullable();

// const lngSchema = z
//   .preprocess((v) => (v === "" || v === undefined ? null : Number(v)), z.number().gte(-180).lte(180))
//   .nullable();

// // 🔹 TAMBAH zonaId (opsional) & wa2 (opsional)
// const bodySchema = z.object({
//   nama: z.string().min(1, "Nama wajib diisi"),
//   wa: z.string().trim().optional(),
//   wa2: z.string().trim().optional(),            // <-- NEW
//   alamat: z.string().min(1, "Alamat wajib diisi"),
//   meterAwal: z.number().int().nonnegative().optional().default(0),
//   zonaId: z.string().trim().nullable().optional(),
//   noUrutRumah: z.number().int().positive().optional(),
//   username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i).optional(),
//   password: z.string().min(6).max(100).optional(),
//   lat: latSchema.optional(),
//   lng: lngSchema.optional(),
// });

// export async function POST(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const json = await req.json();
//     const parsed = bodySchema.safeParse(json);
//     if (!parsed.success) {
//       const msg = parsed.error.issues.map((i) => i.message).join(", ");
//       return NextResponse.json({ ok: false, message: msg }, { status: 400 });
//     }

//     const {
//       nama,
//       wa,
//       wa2, // <-- NEW
//       alamat,
//       meterAwal,
//       username,
//       password,
//       lat: latIn,
//       lng: lngIn,
//     } = parsed.data;

//     const zonaId = parsed.data.zonaId ? parsed.data.zonaId : null;
//     let noUrutRumah = parsed.data.noUrutRumah ?? null;

//     const lat = latIn ?? null;
//     const lng = lngIn ?? null;

//     if (zonaId) {
//       const existsZona = await prisma.zona.findUnique({ where: { id: zonaId }, select: { id: true } });
//       if (!existsZona) {
//         return NextResponse.json({ ok: false, message: "Zona tidak ditemukan" }, { status: 404 });
//       }
//     }

//     const kode = genCustomerCode(nama);
//     const finalUsername = username ?? genUsername(nama);

//     const normalizeWA = (v?: string) => {
//       if (!v) return undefined;
//       const digits = v.replace(/\D/g, "");
//       if (!digits) return "";
//       if (digits.startsWith("0")) return `62${digits.slice(1)}`;
//       if (digits.startsWith("62")) return digits;
//       return digits;
//     };

//     const waNorm = normalizeWA(wa) ?? null;
//     const wa2Norm = normalizeWA(wa2) ?? null; // <-- NEW

//     const rawPassword = (password && String(password)) || `tb-${Math.random().toString(36).slice(2, 8)}`;
//     const passwordHash = await bcrypt.hash(rawPassword, 10);

//     const result = await prisma.$transaction(async (tx) => {
//       // 1) create user
//       const user = await tx.user.create({
//         data: {
//           username: finalUsername,
//           passwordHash,
//           name: nama,
//           phone: waNorm ?? null,
//           role: "WARGA",
//           isActive: true,
//         },
//         select: { id: true, username: true, name: true },
//       });

//       // 2) auto noUrutRumah jika perlu
//       if (zonaId && noUrutRumah === null) {
//         const max = await tx.pelanggan.aggregate({
//           where: { zonaId, deletedAt: null },
//           _max: { noUrutRumah: true },
//         });
//         noUrutRumah = (max._max.noUrutRumah ?? 0) + 1;
//       }

//       // 3) create pelanggan (simpan plaintext + wa2)
//       const pelanggan = await tx.pelanggan.create({
//         data: {
//           kode,
//           nama,
//           wa: waNorm,
//           wa2: wa2Norm, // <-- NEW
//           alamat,
//           meterAwal: meterAwal ?? 0,
//           userId: user.id,
//           statusAktif: true,
//           zonaId,
//           noUrutRumah,
//           passwordPlain: rawPassword,
//           lat,
//           lng,
//         },
//         select: {
//           id: true,
//           kode: true,
//           nama: true,
//           zonaId: true,
//           noUrutRumah: true,
//           lat: true,
//           lng: true,
//         },
//       });

//       return { user, pelanggan };
//     });

//     return NextResponse.json(
//       {
//         ok: true,
//         data: {
//           pelanggan: result.pelanggan,
//           user: { username: result.user.username },
//           tempPassword: rawPassword,
//         },
//         message: "Pelanggan & user berhasil dibuat",
//       },
//       { status: 201 }
//     );
//   } catch (e: any) {
//     if (e?.code === "P2002") {
//       return NextResponse.json(
//         { ok: false, message: "Data bentrok (username/kode atau nomor urut di zona)." },
//         { status: 409 }
//       );
//     }
//     return NextResponse.json({ ok: false, message: e?.message ?? "Server error" }, { status: 500 });
//   }
// }

// // Helper kecil untuk "Title Case"
// function toTitleCase(s: string) {
//   return s
//     .toLowerCase()
//     .split(/\s+/)
//     .filter(Boolean)
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// export async function GET(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const sp = req.nextUrl.searchParams;
//     const pageRaw = parseInt(sp.get("page") ?? "1", 10);
//     const sizeRaw = parseInt(sp.get("pageSize") ?? "10", 10);

//     const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
//     const pageSize = Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.min(sizeRaw, 100) : 10;

//     const qRaw = (sp.get("q") ?? "").trim();
//     const qDigits = qRaw.replace(/\D/g, "");

//     const whereBase: Prisma.PelangganWhereInput = { deletedAt: null };
//     let where: Prisma.PelangganWhereInput = whereBase;

//     if (qRaw) {
//       const variants = Array.from(new Set([qRaw, qRaw.toLowerCase(), qRaw.toUpperCase(), toTitleCase(qRaw)])).filter(
//         Boolean
//       ) as string[];

//       const containsAny = (field: "nama" | "kode" | "alamat" | "wa" | "wa2") =>
//         variants.map((v) => ({ [field]: { contains: v } })) as Prisma.PelangganWhereInput[];

//       const orBase: Prisma.PelangganWhereInput["OR"] = [
//         ...containsAny("nama"),
//         ...containsAny("kode"),
//         ...containsAny("alamat"),
//         ...containsAny("wa"),
//         ...containsAny("wa2"), // <-- NEW: biar bisa dicari pakai WA kedua
//       ];
//       if (qDigits.length >= 3) {
//         orBase.push({ wa: { contains: qDigits } }, { wa2: { contains: qDigits } }); // <-- NEW
//       }
//       where = { AND: [whereBase, { OR: orBase }] };
//     }

//     const total = await prisma.pelanggan.count({ where });
//     const totalPages = Math.max(1, Math.ceil(total / pageSize));
//     const safePage = Math.min(page, totalPages);

//     const items = await prisma.pelanggan.findMany({
//       where,
//       orderBy: [
//         { zonaId: { sort: "asc", nulls: "last" } as any },
//         { zona: { nama: "asc" } },
//         { noUrutRumah: { sort: "asc", nulls: "last" } as any },
//         { createdAt: "asc" },
//         { id: "asc" },
//       ],
//       skip: (safePage - 1) * pageSize,
//       take: pageSize,
//       select: {
//         id: true,
//         kode: true,
//         nama: true,
//         wa: true,
//         wa2: true, // <-- NEW
//         alamat: true,
//         meterAwal: true,
//         statusAktif: true,
//         createdAt: true,
//         zonaId: true,
//         noUrutRumah: true,
//         lat: true,
//         lng: true,
//         zona: { select: { id: true, nama: true, deskripsi: true } },
//       },
//     });

//     return NextResponse.json({
//       ok: true,
//       items,
//       pagination: { page: safePage, pageSize, total, totalPages },
//     });
//   } catch (e: any) {
//     console.error("❌ GET /api/pelanggan error:", e);
//     return NextResponse.json({ ok: false, message: e?.message ?? "Server error" }, { status: 500 });
//   }
// }

// export async function PUT(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const urlId = req.nextUrl.searchParams.get("id") ?? undefined;

//     let rawBody: unknown = {};
//     try {
//       rawBody = await req.json();
//     } catch {
//       rawBody = {};
//     }

//     const schema = z.object({
//       id: z.string().optional(),
//       nama: z.string().min(1).optional(),
//       wa: z.string().optional(),
//       wa2: z.string().optional(),           // <-- NEW
//       alamat: z.string().min(1).optional(),
//       meterAwal: z.number().int().nonnegative().optional(),
//       status: z.enum(["aktif", "nonaktif"]).optional(),
//       zonaId: z.string().nullable().optional(),
//       noUrutRumah: z.number().int().positive().nullable().optional(),
//       lat: z.number().min(-90).max(90).nullable().optional(),
//       lng: z.number().min(-180).max(180).nullable().optional(),
//     });

//     const parsed = schema.safeParse(rawBody);
//     if (!parsed.success) {
//       const msg = parsed.error.issues.map((i) => i.message).join(", ");
//       return NextResponse.json({ ok: false, message: msg }, { status: 400 });
//     }

//     const body = parsed.data;
//     const id = body.id ?? urlId;
//     if (!id) return NextResponse.json({ ok: false, message: "ID wajib disertakan" }, { status: 400 });

//     const zonaIdNorm = body.zonaId !== undefined ? (body.zonaId === "" ? null : body.zonaId) : undefined;

//     const noUrutNorm =
//       body.noUrutRumah === null ? null : body.noUrutRumah === undefined ? undefined : Number(body.noUrutRumah);

//     if (zonaIdNorm !== undefined && zonaIdNorm !== null) {
//       const existsZona = await prisma.zona.findUnique({ where: { id: zonaIdNorm }, select: { id: true } });
//       if (!existsZona) return NextResponse.json({ ok: false, message: "Zona tidak ditemukan" }, { status: 404 });
//     }

//     const current = await prisma.pelanggan.findUnique({
//       where: { id },
//       select: { meterAwal: true, zonaId: true, noUrutRumah: true },
//     });
//     if (!current) return NextResponse.json({ ok: false, message: "Pelanggan tidak ditemukan" }, { status: 404 });

//     const data: Prisma.PelangganUpdateInput = {};

//     const normalizeWA = (v?: string) => {
//       if (!v) return undefined;
//       const digits = v.replace(/\D/g, "");
//       if (!digits) return "";
//       if (digits.startsWith("0")) return `62${digits.slice(1)}`;
//       if (digits.startsWith("62")) return digits;
//       return digits;
//     };

//     if (body.nama !== undefined) data.nama = body.nama;
//     if (body.alamat !== undefined) data.alamat = body.alamat;
//     if (body.wa !== undefined) (data as any).wa = normalizeWA(body.wa) ?? null;
//     if (body.wa2 !== undefined) (data as any).wa2 = normalizeWA(body.wa2) ?? null; // <-- NEW
//     if (body.status !== undefined) data.statusAktif = body.status === "aktif";
//     if (body.lat !== undefined) (data as any).lat = body.lat;
//     if (body.lng !== undefined) (data as any).lng = body.lng;

//     const wantChangeMeterAwal = body.meterAwal !== undefined && body.meterAwal !== current.meterAwal;
//     if (wantChangeMeterAwal) {
//       const used = await prisma.catatMeter.findFirst({
//         where: { pelangganId: id, deletedAt: null },
//         select: { id: true },
//       });
//       if (used) {
//         return NextResponse.json(
//           { ok: false, message: "Meter Awal tidak bisa diedit karena pelanggan sudah pernah dicatat di Catat Meter." },
//           { status: 409 }
//         );
//       }
//       data.meterAwal = body.meterAwal;
//     }

//     type Meta = {
//       zonaChanged: boolean;
//       reordered: boolean;
//       from?: number | null;
//       to?: number | null;
//       clearedZona?: boolean;
//       appended?: boolean;
//     };

//     const { updated, meta } = await prisma.$transaction(async (tx) => {
//       const meta: Meta = { zonaChanged: false, reordered: false };

//       const zonaChanged = zonaIdNorm !== undefined && zonaIdNorm !== current.zonaId;
//       meta.zonaChanged = !!zonaChanged;
//       const targetZonaId = zonaIdNorm === undefined ? current.zonaId : zonaIdNorm;

//       if (zonaIdNorm !== undefined) {
//         data.zonaId = zonaIdNorm;
//       }

//       if (!zonaChanged && targetZonaId && typeof noUrutNorm === "number") {
//         const countInZona = await tx.pelanggan.count({
//           where: { zonaId: targetZonaId, deletedAt: null, noUrutRumah: { not: null } },
//         });

//         const from = current.noUrutRumah ?? countInZona + 1;
//         const to = Math.max(1, Math.min(noUrutNorm, Math.max(1, countInZona)));
//         meta.from = current.noUrutRumah ?? null;
//         meta.to = to;

//         if (from !== to) {
//           await tx.pelanggan.update({ where: { id }, data: { noUrutRumah: null } });

//           if (from < to) {
//             await tx.pelanggan.updateMany({
//               where: { zonaId: targetZonaId, deletedAt: null, noUrutRumah: { gte: from + 1, lte: to } },
//               data: { noUrutRumah: { decrement: 1 } },
//             });
//           } else {
//             await tx.pelanggan.updateMany({
//               where: { zonaId: targetZonaId, deletedAt: null, noUrutRumah: { gte: to, lte: from - 1 } },
//               data: { noUrutRumah: { increment: 1 } },
//             });
//           }
//         }

//         (data as any).noUrutRumah = to;
//         meta.reordered = true;
//       } else if (!zonaChanged && current.zonaId && current.noUrutRumah == null && noUrutNorm === undefined) {
//         const last = await tx.pelanggan.findFirst({
//           where: { zonaId: current.zonaId, deletedAt: null, noUrutRumah: { not: null } },
//           orderBy: { noUrutRumah: "desc" },
//           select: { noUrutRumah: true },
//         });
//         (data as any).noUrutRumah = (last?.noUrutRumah ?? 0) + 1;
//         meta.appended = true;
//       } else if (zonaChanged) {
//         if (current.zonaId && current.noUrutRumah != null) {
//           await tx.pelanggan.updateMany({
//             where: { zonaId: current.zonaId, deletedAt: null, noUrutRumah: { gt: current.noUrutRumah } },
//             data: { noUrutRumah: { decrement: 1 } },
//           });
//         }
//         if (targetZonaId === null) {
//           (data as any).noUrutRumah = null;
//           meta.clearedZona = true;
//         } else {
//           const last = await tx.pelanggan.findFirst({
//             where: { zonaId: targetZonaId, deletedAt: null, noUrutRumah: { not: null } },
//             orderBy: { noUrutRumah: "desc" },
//             select: { noUrutRumah: true },
//           });
//           (data as any).noUrutRumah = (last?.noUrutRumah ?? 0) + 1;
//           meta.appended = true;
//         }
//       } else if (noUrutNorm === null) {
//         (data as any).noUrutRumah = null;
//       }

//       const updated = await tx.pelanggan.update({
//         where: { id },
//         data,
//         select: {
//           id: true,
//           kode: true,
//           nama: true,
//           wa: true,
//           wa2: true, // <-- NEW
//           alamat: true,
//           meterAwal: true,
//           statusAktif: true,
//           zonaId: true,
//           zona: { select: { id: true, nama: true } },
//           noUrutRumah: true,
//           lat: true,
//           lng: true,
//         },
//       });

//       return { updated, meta };
//     });

//     let successMsg = "Pelanggan berhasil diperbarui";
//     if (meta.reordered && !meta.zonaChanged && typeof meta.to === "number") {
//       successMsg = `Nomor urut pelanggan "${updated.nama}" dipindah ke ${updated.noUrutRumah}.`;
//     } else if (meta.zonaChanged && meta.clearedZona) {
//       successMsg = `Zona dikosongkan dan nomor urut dihapus.`;
//     } else if (meta.zonaChanged && meta.appended) {
//       successMsg = `Pelanggan dipindah ke zona baru dan diberi nomor urut ${updated.noUrutRumah}.`;
//     }

//     return NextResponse.json({
//       ok: true,
//       item: {
//         id: updated.id,
//         kodeCustomer: updated.kode,
//         nama: updated.nama,
//         noWA: updated.wa ?? "",
//         noWA2: updated.wa2 ?? "", // <-- NEW (dikembalikan juga untuk keperluan UI)
//         alamat: updated.alamat,
//         meterAwal: updated.meterAwal,
//         status: updated.statusAktif ? ("aktif" as const) : ("nonaktif" as const),
//         zonaId: updated.zonaId ?? null,
//         zonaNama: updated.zona?.nama ?? null,
//         noUrutRumah: updated.noUrutRumah ?? null,
//         lat: updated.lat != null ? Number(updated.lat) : null,
//         lng: updated.lng != null ? Number(updated.lng) : null,
//       },
//       message: successMsg,
//     });
//   } catch (e) {
//     console.error("❌ PUT /api/pelanggan:", e);
//     const err = e as { code?: string; message?: string };
//     if (err.code === "P2025") {
//       return NextResponse.json({ ok: false, message: "Pelanggan tidak ditemukan" }, { status: 404 });
//     }
//     return NextResponse.json({ ok: false, message: err.message ?? "Server error" }, { status: 500 });
//   }
// }

// // --- helper JWT untuk DELETE ---
// type JwtPayload = { sub?: string };
// function getAuthUserId(req: NextRequest): string | null {
//   const token = req.cookies.get("tb_token")?.value;
//   if (!token) return null;
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret") as JwtPayload;
//     return decoded.sub ?? null;
//   } catch {
//     return null;
//   }
// }

// export async function DELETE(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const urlId = req.nextUrl.searchParams.get("id") ?? undefined;
//     const body = await req.json().catch(() => ({} as unknown));
//     const id = (body as { id?: string })?.id ?? urlId;
//     if (!id) {
//       return NextResponse.json({ ok: false, message: "ID wajib disertakan" }, { status: 400 });
//     }

//     const used = await prisma.catatMeter.findFirst({
//       where: { pelangganId: id, deletedAt: null },
//       select: { id: true },
//     });
//     if (used) {
//       return NextResponse.json(
//         {
//           ok: false,
//           message:
//             "Pelanggan tidak bisa dihapus karena sudah pernah dipakai di Catat Meter. Hapus data Catat Meter terkait terlebih dahulu jika memang diperlukan.",
//         },
//         { status: 409 }
//       );
//     }

//     const userId = getAuthUserId(req);

//     const result = await prisma.pelanggan.updateMany({
//       where: { id, deletedAt: null },
//       data: {
//         deletedAt: new Date(),
//         deletedBy: userId ?? null,
//         statusAktif: false,
//       },
//     });

//     if (result.count === 0) {
//       return NextResponse.json(
//         { ok: false, message: "Pelanggan tidak ditemukan atau sudah dihapus" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ ok: true, message: "Pelanggan berhasil dihapus (soft delete)" });
//   } catch (e) {
//     const err = e as { code?: string; message?: string };
//     if (err.code === "P2025") {
//       return NextResponse.json({ ok: false, message: "Pelanggan tidak ditemukan" }, { status: 404 });
//     }
//     return NextResponse.json({ ok: false, message: err.message ?? "Server error" }, { status: 500 });
//   }
// }

// app/api/pelanggan/route.ts
// app/api/pelanggan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { warehouseUpsertCpiu } from "@/lib/warehouse-users";

/* ===================== ENV & DEFAULTS ===================== */
const WAREHOUSE_API_BASE =
    process.env.WAREHOUSE_API_BASE || "http://localhost:9000";
const WAREHOUSE_API_KEY = process.env.WAREHOUSE_API_KEY || "";
const PRODUCT_CODE = process.env.PRODUCT_CODE || "NATABANYU";
const DEFAULT_MAX_CUSTOMERS = Number(process.env.DEFAULT_MAX_CUSTOMERS ?? 30);

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
    // ⬅️ dukung tb_offering (premium/professional/basic)
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

/* ===================== Helpers singkat ===================== */
function genCustomerCode(name: string) {
    const base = (name || "TB")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
    const four = Math.random().toString().slice(2, 6);
    return `TB${base.slice(0, 2)}${four}`;
}
function genUsername(name: string) {
    const slug = (name || "warga").toLowerCase().replace(/[^a-z0-9]/g, "");
    const n = Math.random().toString(36).slice(2, 5);
    return `${slug}${n}`;
}
const normalizeWA = (v?: string) => {
    if (!v) return undefined;
    const digits = v.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    if (digits.startsWith("62")) return digits;
    return digits;
};

/* ===================== Validasi body (CREATE) ===================== */
const latSchema = z
    .preprocess(
        (v) => (v === "" || v === undefined ? null : Number(v)),
        z.number().gte(-90).lte(90)
    )
    .nullable();
const lngSchema = z
    .preprocess(
        (v) => (v === "" || v === undefined ? null : Number(v)),
        z.number().gte(-180).lte(180)
    )
    .nullable();

const bodySchema = z.object({
    nama: z.string().min(1, "Nama wajib diisi"),
    wa: z.string().trim().optional(),
    wa2: z.string().trim().optional(),
    alamat: z.string().min(1, "Alamat wajib diisi"),
    meterAwal: z.number().int().nonnegative().optional().default(0),
    zonaId: z.string().trim().nullable().optional(),
    noUrutRumah: z.number().int().positive().optional(),
    username: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-z0-9_]+$/i)
        .optional(),
    password: z.string().min(6).max(100).optional(),
    lat: latSchema.optional(),
    lng: lngSchema.optional(),
});

/* ===================== Entitlement resolve & cache ===================== */
type MaybeNum = number | null | undefined;

type WarehouseEntitlement = {
    code: string;
    value_number?: number | null;
    value_string?: string | null;
    enabled?: boolean;
};

/** Bentuk respons yang kami dukung:
 * A) Lama: { entitlements[], packageCode?, plan? }
 * B) Baru: { data: { offering: { slug }, features: [{feature_code}], entitlements?: [] } }
 */
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

const TierLimit: Record<string, number> = {
    BASIC: 30,
    PREMIUM: 100,
    PROFESSIONAL: 500,
};

const EntCache: Record<string, { max: number; exp: number }> =
    Object.create(null);
const now = () => Date.now();

/** Fetch dari Warehouse dan normalisasi ke bentuk uniform */
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

        // normalisasi entitlements:
        let entitlements: WarehouseEntitlement[] =
            (raw as any).entitlements ??
            (raw as any).data?.entitlements ??
            ((raw as any).data?.features
                ? (raw as any).data.features.map((f: any) => ({
                      code: f.feature_code,
                  }))
                : []);

        if (!Array.isArray(entitlements)) entitlements = [];

        // normalisasi package/plan:
        const packageCode: string | undefined =
            (raw as any).packageCode ??
            (raw as any).plan ??
            (raw as any).data?.offering?.slug;

        return { entitlements, packageCode };
    } catch {
        return null;
    }
}

/** Prioritas:
 * 1) Entitlement "maksimal.pelanggan" (numerik)
 * 2) package/plan dari Warehouse (offering.slug)
 * 3) hint dari request (tb_offering/tb_plan/tb_package/head­er/env)
 * 4) DEFAULT (30)
 */
async function resolveMaxCustomers(
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
                (e) => e.code === "maksimal.pelanggan" && (e.enabled ?? true)
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
            if (pkgFromWh && TierLimit[pkgFromWh]) {
                const max = TierLimit[pkgFromWh];
                EntCache[companyId] = { max, exp: now() + 5 * 60_000 };
                return max;
            }
        }
    }

    const hint = (planHint || pkgFromWh || "").toUpperCase();
    if (hint && TierLimit[hint]) {
        const max = TierLimit[hint];
        if (companyId) EntCache[companyId] = { max, exp: now() + 60_000 };
        return max;
    }

    const max = DEFAULT_MAX_CUSTOMERS;
    if (companyId) EntCache[companyId] = { max, exp: now() + 60_000 };
    return max;
}

/** Hitung pelanggan aktif (exclude soft delete) */
async function countActiveCustomers(prisma: any): Promise<number> {
    return prisma.pelanggan.count({ where: { deletedAt: null } });
}

/* ===================== Handlers ===================== */
// export async function POST(req: NextRequest) {
//     const prisma = await db();
//     try {
//         const json = await req.json();
//         const parsed = bodySchema.safeParse(json);
//         if (!parsed.success) {
//             const msg = parsed.error.issues.map((i) => i.message).join(", ");
//             return NextResponse.json(
//                 { ok: false, message: msg },
//                 { status: 400 }
//             );
//         }

//         const {
//             nama,
//             wa,
//             wa2,
//             alamat,
//             meterAwal,
//             username,
//             password,
//             lat: latIn,
//             lng: lngIn,
//         } = parsed.data;

//         const zonaId = parsed.data.zonaId ? parsed.data.zonaId : null;
//         let noUrutRumah = parsed.data.noUrutRumah ?? null;

//         const lat = latIn ?? null;
//         const lng = lngIn ?? null;

//         if (zonaId) {
//             const existsZona = await prisma.zona.findUnique({
//                 where: { id: zonaId },
//                 select: { id: true },
//             });
//             if (!existsZona) {
//                 return NextResponse.json(
//                     { ok: false, message: "Zona tidak ditemukan" },
//                     { status: 404 }
//                 );
//             }
//         }

//         const kode = genCustomerCode(nama);
//         const finalUsername = username ?? genUsername(nama);

//         const normalizeWA = (v?: string) => {
//             if (!v) return undefined;
//             const digits = v.replace(/\D/g, "");
//             if (!digits) return "";
//             if (digits.startsWith("0")) return `62${digits.slice(1)}`;
//             if (digits.startsWith("62")) return digits;
//             return digits;
//         };

//         const waNorm = normalizeWA(wa) ?? null;
//         const wa2Norm = normalizeWA(wa2) ?? null;

//         const rawPassword =
//             (password && String(password)) ||
//             `tb-${Math.random().toString(36).slice(2, 8)}`;
//         const passwordHash = await bcrypt.hash(rawPassword, 10);

//         const companyId = getCompanyIdFromCookie(req);

//         // ====== KUOTA: cek dalam transaksi (anti race) ======
//         const out = await prisma.$transaction(async (tx) => {
//             const max = await resolveMaxCustomers(tx, companyId);
//             const used = await countActiveCustomers(tx);
//             if (used >= max) {
//                 return { blocked: true as const, used, max };
//             }

//             // 1) create user
//             const user = await tx.user.create({
//                 data: {
//                     username: finalUsername,
//                     passwordHash,
//                     name: nama,
//                     phone: waNorm ?? null,
//                     role: "WARGA",
//                     isActive: true,
//                 },
//                 select: { id: true, username: true, name: true },
//             });

//             // 2) auto noUrutRumah jika perlu
//             if (zonaId && noUrutRumah === null) {
//                 const maxNo = await tx.pelanggan.aggregate({
//                     where: { zonaId, deletedAt: null },
//                     _max: { noUrutRumah: true },
//                 });
//                 noUrutRumah = (maxNo._max.noUrutRumah ?? 0) + 1;
//             }

//             // 3) create pelanggan
//             const pelanggan = await tx.pelanggan.create({
//                 data: {
//                     kode,
//                     nama,
//                     wa: waNorm,
//                     wa2: wa2Norm,
//                     alamat,
//                     meterAwal: meterAwal ?? 0,
//                     userId: user.id,
//                     statusAktif: true,
//                     zonaId,
//                     noUrutRumah,
//                     passwordPlain: rawPassword,
//                     lat,
//                     lng,
//                 },
//                 select: {
//                     id: true,
//                     kode: true,
//                     nama: true,
//                     zonaId: true,
//                     noUrutRumah: true,
//                     lat: true,
//                     lng: true,
//                 },
//             });

//             return {
//                 blocked: false as const,
//                 user,
//                 pelanggan,
//                 max,
//                 used: used + 1,
//             };
//         });

//         if (out.blocked) {
//             return NextResponse.json(
//                 {
//                     ok: false,
//                     code: "QUOTA_EXCEEDED",
//                     message: `Kuota pelanggan habis. Paket ini maksimum ${out.max} pelanggan. Silakan hapus pelanggan yang tidak aktif atau upgrade paket.`,
//                     meta: {
//                         used: out.used,
//                         max: out.max,
//                         remaining: Math.max(0, out.max - out.used),
//                     },
//                 },
//                 { status: 403 }
//             );
//         }

//         return NextResponse.json(
//             {
//                 ok: true,
//                 data: {
//                     pelanggan: out.pelanggan,
//                     user: { username: out.user.username },
//                     tempPassword: rawPassword,
//                     quota: {
//                         used: out.used,
//                         max: out.max,
//                         remaining: Math.max(0, out.max - out.used),
//                     },
//                 },
//                 message: "Pelanggan & user berhasil dibuat",
//             },
//             { status: 201 }
//         );
//     } catch (e: any) {
//         if (e?.code === "P2002") {
//             return NextResponse.json(
//                 {
//                     ok: false,
//                     message:
//                         "Data bentrok (username/kode atau nomor urut di zona).",
//                 },
//                 { status: 409 }
//             );
//         }
//         return NextResponse.json(
//             { ok: false, message: e?.message ?? "Server error" },
//             { status: 500 }
//         );
//     }
// }
export async function POST(req: NextRequest) {
    const prisma = await db();
    try {
        const json = await req.json();
        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
            const msg = parsed.error.issues.map((i) => i.message).join(", ");
            return NextResponse.json(
                { ok: false, message: msg },
                { status: 400 }
            );
        }

        const {
            nama,
            wa,
            wa2,
            alamat,
            meterAwal,
            username,
            password,
            lat: latIn,
            lng: lngIn,
        } = parsed.data;
        const zonaId = parsed.data.zonaId ? parsed.data.zonaId : null;
        let noUrutRumah = parsed.data.noUrutRumah ?? null;

        const lat = latIn ?? null;
        const lng = lngIn ?? null;

        if (zonaId) {
            const existsZona = await prisma.zona.findUnique({
                where: { id: zonaId },
                select: { id: true },
            });
            if (!existsZona)
                return NextResponse.json(
                    { ok: false, message: "Zona tidak ditemukan" },
                    { status: 404 }
                );
        }

        const kode = genCustomerCode(nama);
        const finalUsername = username ?? genUsername(nama);

        const waNorm = normalizeWA(wa) ?? null;
        const wa2Norm = normalizeWA(wa2) ?? null;

        const rawPassword =
            (password && String(password)) ||
            `tb-${Math.random().toString(36).slice(2, 8)}`;
        const passwordHash = await bcrypt.hash(rawPassword, 10);

        const companyId = getCompanyIdFromReq(req);
        const planHint = getPlanFromReq(req);

        // ====== KUOTA: cek dalam transaksi (anti-race) ======
        const out = await prisma.$transaction(async (tx) => {
            const max = await resolveMaxCustomers(companyId, planHint);
            const used = await countActiveCustomers(tx);
            if (used >= max) {
                return { blocked: true as const, used, max };
            }

            const user = await tx.user.create({
                data: {
                    username: finalUsername,
                    passwordHash,
                    name: nama,
                    phone: waNorm ?? null,
                    role: "WARGA",
                    isActive: true,
                    companyId: companyId, // <-- penting: kaitkan user dengan company
                },
                select: { id: true, username: true, name: true },
            });

            if (zonaId && noUrutRumah === null) {
                const maxNo = await tx.pelanggan.aggregate({
                    where: { zonaId, deletedAt: null },
                    _max: { noUrutRumah: true },
                });
                noUrutRumah = (maxNo._max.noUrutRumah ?? 0) + 1;
            }

            const pelanggan = await tx.pelanggan.create({
                data: {
                    kode,
                    nama,
                    wa: waNorm,
                    wa2: wa2Norm,
                    alamat,
                    meterAwal: meterAwal ?? 0,
                    userId: user.id,
                    statusAktif: true,
                    zonaId,
                    noUrutRumah,
                    passwordPlain: rawPassword,
                    lat,
                    lng,
                },
                select: {
                    id: true,
                    kode: true,
                    nama: true,
                    zonaId: true,
                    noUrutRumah: true,
                    lat: true,
                    lng: true,
                },
            });

            return {
                blocked: false as const,
                user,
                pelanggan,
                max,
                used: used + 1,
            };
        });

        if (out.blocked) {
            return NextResponse.json(
                {
                    ok: false,
                    code: "QUOTA_EXCEEDED",
                    message: `Kuota pelanggan habis. Paket ini maksimum ${out.max} pelanggan. Silakan hapus pelanggan yang tidak aktif atau upgrade paket.`,
                    meta: {
                        used: out.used,
                        max: out.max,
                        remaining: Math.max(0, out.max - out.used),
                    },
                },
                { status: 403 }
            );
        }

        // Setelah transaksi commit, sink ke Warehouse.
        // Jika sink gagal -> rollback manual: hapus user & pelanggan yang baru dibuat.
        try {
            await warehouseUpsertCpiu({
                email: out.user.username,
                companyId,
                passwordPlain: rawPassword,
                passwordHash,
                isActive: true,
            });
        } catch (err: any) {
            // cleanup: hapus user + pelanggan yang baru dibuat (hard delete)
            try {
                await prisma.user.delete({ where: { id: out.user.id } });
            } catch (e) {
                console.error(
                    "Cleanup: failed delete user after warehouse error:",
                    e
                );
            }
            try {
                await prisma.pelanggan.delete({
                    where: { id: out.pelanggan.id },
                });
            } catch (e) {
                console.error(
                    "Cleanup: failed delete pelanggan after warehouse error:",
                    e
                );
            }

            return NextResponse.json(
                {
                    ok: false,
                    message: "Sync ke Warehouse gagal",
                    detail: String(err?.message ?? err),
                },
                { status: 502 }
            );
        }

        // sukses semua
        return NextResponse.json(
            {
                ok: true,
                data: {
                    pelanggan: out.pelanggan,
                    user: { username: out.user.username, id: out.user.id },
                    tempPassword: rawPassword,
                    quota: {
                        used: out.used,
                        max: out.max,
                        remaining: Math.max(0, out.max - out.used),
                    },
                },
                message:
                    "Pelanggan & user berhasil dibuat dan disinkronkan ke Warehouse",
            },
            { status: 201 }
        );
    } catch (e: any) {
        if (e?.code === "P2002") {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Data bentrok (username/kode atau nomor urut di zona).",
                },
                { status: 409 }
            );
        }
        console.error("POST /api/pelanggan error:", e);
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}

/* ===================== GET ===================== */
function toTitleCase(s: string) {
    return s
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}
export async function GET(req: NextRequest) {
    const prisma = await db();
    try {
        const sp = req.nextUrl.searchParams;

        // Quick quota lookup untuk UI
        if (sp.get("quota") === "1") {
            const companyId = getCompanyIdFromReq(req);
            const planHint = getPlanFromReq(req);
            const max = await resolveMaxCustomers(companyId, planHint);
            const used = await countActiveCustomers(prisma);
            return NextResponse.json({
                ok: true,
                quota: { used, max, remaining: Math.max(0, max - used) },
            });
        }

        const pageRaw = parseInt(sp.get("page") ?? "1", 10);
        const sizeRaw = parseInt(sp.get("pageSize") ?? "10", 10);

        const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
        const pageSize =
            Number.isFinite(sizeRaw) && sizeRaw > 0
                ? Math.min(sizeRaw, 100)
                : 10;

        const qRaw = (sp.get("q") ?? "").trim();
        const qDigits = qRaw.replace(/\D/g, "");

        const whereBase: Prisma.PelangganWhereInput = { deletedAt: null };
        let where: Prisma.PelangganWhereInput = whereBase;

        if (qRaw) {
            const variants = Array.from(
                new Set([
                    qRaw,
                    qRaw.toLowerCase(),
                    qRaw.toUpperCase(),
                    toTitleCase(qRaw),
                ])
            ).filter(Boolean) as string[];
            const containsAny = (
                field: "nama" | "kode" | "alamat" | "wa" | "wa2"
            ) =>
                variants.map((v) => ({
                    [field]: { contains: v },
                })) as Prisma.PelangganWhereInput[];

            const orBase: Prisma.PelangganWhereInput["OR"] = [
                ...containsAny("nama"),
                ...containsAny("kode"),
                ...containsAny("alamat"),
                ...containsAny("wa"),
                ...containsAny("wa2"),
            ];
            if (qDigits.length >= 3) {
                orBase.push(
                    { wa: { contains: qDigits } },
                    { wa2: { contains: qDigits } }
                );
            }
            where = { AND: [whereBase, { OR: orBase }] };
        }

        const total = await prisma.pelanggan.count({ where });
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(page, totalPages);

        const items = await prisma.pelanggan.findMany({
            where,
            orderBy: [
                { zonaId: { sort: "asc", nulls: "last" } as any },
                { zona: { nama: "asc" } },
                { noUrutRumah: { sort: "asc", nulls: "last" } as any },
                { createdAt: "asc" },
                { id: "asc" },
            ],
            skip: (safePage - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                kode: true,
                nama: true,
                wa: true,
                wa2: true,
                alamat: true,
                meterAwal: true,
                statusAktif: true,
                createdAt: true,
                zonaId: true,
                noUrutRumah: true,
                lat: true,
                lng: true,
                zona: { select: { id: true, nama: true, deskripsi: true } },
            },
        });

        return NextResponse.json({
            ok: true,
            items,
            pagination: { page: safePage, pageSize, total, totalPages },
        });
    } catch (e: any) {
        console.error("❌ GET /api/pelanggan error:", e);
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}

/* ===================== PUT (wa2 boleh null + preprocess angka) ===================== */
export async function PUT(req: NextRequest) {
    const prisma = await db();
    try {
        const urlId = req.nextUrl.searchParams.get("id") ?? undefined;

        let rawBody: unknown = {};
        try {
            rawBody = await req.json();
        } catch {
            rawBody = {};
        }

        // preprocess helper untuk number | null | undefined dari "" | number | null | undefined
        const numOrNull = (min: number, max: number) =>
            z
                .preprocess(
                    (v) => (v === "" || v === undefined ? null : v),
                    z.number().min(min).max(max)
                )
                .nullable();

        const intPosOrNullOpt = z
            .preprocess((v) => {
                if (v === "" || v === undefined) return undefined; // biar optional
                if (v === null) return null;
                return Number(v);
            }, z.number().int().positive())
            .nullable()
            .optional();

        const schema = z.object({
            id: z.string().optional(),
            nama: z.string().min(1).optional(),
            wa: z.string().optional(),
            wa2: z.string().nullable().optional(), // ← WA2 boleh null
            alamat: z.string().min(1).optional(),
            meterAwal: z.number().int().nonnegative().optional(),
            status: z.enum(["aktif", "nonaktif"]).optional(),
            zonaId: z.string().nullable().optional(),
            noUrutRumah: intPosOrNullOpt, // ← preprocess ""/null/number
            lat: numOrNull(-90, 90).optional(), // ← preprocess "" → null
            lng: numOrNull(-180, 180).optional(), // ← preprocess "" → null
        });

        const parsed = schema.safeParse(rawBody);
        if (!parsed.success) {
            const msg = parsed.error.issues.map((i) => i.message).join(", ");
            return NextResponse.json(
                { ok: false, message: msg || "Invalid input" },
                { status: 400 }
            );
        }

        const body = parsed.data;
        const id = body.id ?? urlId;
        if (!id)
            return NextResponse.json(
                { ok: false, message: "ID wajib disertakan" },
                { status: 400 }
            );

        // normalisasi zonaId: "" → null (sudah nullable di schema, tapi FE kadang kirim "")
        const zonaIdNorm =
            body.zonaId !== undefined
                ? body.zonaId === ""
                    ? null
                    : body.zonaId
                : undefined;

        const noUrutNorm = body.noUrutRumah; // sudah dipreprocess di atas

        if (zonaIdNorm !== undefined && zonaIdNorm !== null) {
            const existsZona = await prisma.zona.findUnique({
                where: { id: zonaIdNorm },
                select: { id: true },
            });
            if (!existsZona)
                return NextResponse.json(
                    { ok: false, message: "Zona tidak ditemukan" },
                    { status: 404 }
                );
        }

        const current = await prisma.pelanggan.findUnique({
            where: { id },
            select: { meterAwal: true, zonaId: true, noUrutRumah: true },
        });
        if (!current)
            return NextResponse.json(
                { ok: false, message: "Pelanggan tidak ditemukan" },
                { status: 404 }
            );

        const data: Prisma.PelangganUpdateInput = {};

        // Field umum
        if (body.nama !== undefined) data.nama = body.nama;
        if (body.alamat !== undefined) data.alamat = body.alamat;
        if (body.status !== undefined)
            data.statusAktif = body.status === "aktif";
        if (body.lat !== undefined) (data as any).lat = body.lat; // bisa number atau null
        if (body.lng !== undefined) (data as any).lng = body.lng; // bisa number atau null

        // WA utama
        if (body.wa !== undefined)
            (data as any).wa = normalizeWA(body.wa) ?? null;

        // WA2: null → kosongkan; string → normalisasi
        if (body.wa2 === null) {
            (data as any).wa2 = null;
        } else if (body.wa2 !== undefined) {
            (data as any).wa2 = normalizeWA(body.wa2) ?? null;
        }

        // Meter awal (terkunci jika sudah ada catat meter)
        const wantChangeMeterAwal =
            body.meterAwal !== undefined &&
            body.meterAwal !== current.meterAwal;
        if (wantChangeMeterAwal) {
            const used = await prisma.catatMeter.findFirst({
                where: { pelangganId: id, deletedAt: null },
                select: { id: true },
            });
            if (used) {
                return NextResponse.json(
                    {
                        ok: false,
                        message:
                            "Meter Awal tidak bisa diedit karena pelanggan sudah pernah dicatat di Catat Meter.",
                    },
                    { status: 409 }
                );
            }
            data.meterAwal = body.meterAwal;
        }

        type Meta = {
            zonaChanged: boolean;
            reordered: boolean;
            from?: number | null;
            to?: number | null;
            clearedZona?: boolean;
            appended?: boolean;
        };

        const { updated, meta } = await prisma.$transaction(async (tx) => {
            const meta: Meta = { zonaChanged: false, reordered: false };

            const zonaChanged =
                zonaIdNorm !== undefined && zonaIdNorm !== current.zonaId;
            meta.zonaChanged = !!zonaChanged;
            const targetZonaId =
                zonaIdNorm === undefined ? current.zonaId : zonaIdNorm;

            // set zonaId jika dikirim (termasuk null)
            if (zonaIdNorm !== undefined) {
                data.zonaId = zonaIdNorm;
            }

            // A) Reorder dalam zona yang sama
            if (
                !zonaChanged &&
                targetZonaId &&
                typeof noUrutNorm === "number"
            ) {
                const countInZona = await tx.pelanggan.count({
                    where: {
                        zonaId: targetZonaId,
                        deletedAt: null,
                        noUrutRumah: { not: null },
                    },
                });

                const from = current.noUrutRumah ?? countInZona + 1;
                const to = Math.max(
                    1,
                    Math.min(noUrutNorm, Math.max(1, countInZona))
                );
                meta.from = current.noUrutRumah ?? null;
                meta.to = to;

                if (from !== to) {
                    await tx.pelanggan.update({
                        where: { id },
                        data: { noUrutRumah: null },
                    });

                    if (from < to) {
                        await tx.pelanggan.updateMany({
                            where: {
                                zonaId: targetZonaId,
                                deletedAt: null,
                                noUrutRumah: { gte: from + 1, lte: to },
                            },
                            data: { noUrutRumah: { decrement: 1 } },
                        });
                    } else {
                        await tx.pelanggan.updateMany({
                            where: {
                                zonaId: targetZonaId,
                                deletedAt: null,
                                noUrutRumah: { gte: to, lte: from - 1 },
                            },
                            data: { noUrutRumah: { increment: 1 } },
                        });
                    }
                }

                (data as any).noUrutRumah = to;
                meta.reordered = true;
            }
            // B) Zona tidak berubah & sebelumnya null → append otomatis
            else if (
                !zonaChanged &&
                current.zonaId &&
                current.noUrutRumah == null &&
                noUrutNorm === undefined
            ) {
                const last = await tx.pelanggan.findFirst({
                    where: {
                        zonaId: current.zonaId,
                        deletedAt: null,
                        noUrutRumah: { not: null },
                    },
                    orderBy: { noUrutRumah: "desc" },
                    select: { noUrutRumah: true },
                });
                (data as any).noUrutRumah = (last?.noUrutRumah ?? 0) + 1;
                meta.appended = true;
            }
            // C) Pindah zona
            else if (zonaChanged) {
                if (current.zonaId && current.noUrutRumah != null) {
                    await tx.pelanggan.updateMany({
                        where: {
                            zonaId: current.zonaId,
                            deletedAt: null,
                            noUrutRumah: { gt: current.noUrutRumah },
                        },
                        data: { noUrutRumah: { decrement: 1 } },
                    });
                }
                if (targetZonaId === null) {
                    (data as any).noUrutRumah = null;
                    meta.clearedZona = true;
                } else {
                    const last = await tx.pelanggan.findFirst({
                        where: {
                            zonaId: targetZonaId,
                            deletedAt: null,
                            noUrutRumah: { not: null },
                        },
                        orderBy: { noUrutRumah: "desc" },
                        select: { noUrutRumah: true },
                    });
                    (data as any).noUrutRumah = (last?.noUrutRumah ?? 0) + 1;
                    meta.appended = true;
                }
            }
            // D) User kirim null eksplisit untuk noUrutRumah
            else if (noUrutNorm === null) {
                (data as any).noUrutRumah = null;
            }

            const updated = await tx.pelanggan.update({
                where: { id },
                data,
                select: {
                    id: true,
                    kode: true,
                    nama: true,
                    wa: true,
                    wa2: true,
                    alamat: true,
                    meterAwal: true,
                    statusAktif: true,
                    zonaId: true,
                    zona: { select: { id: true, nama: true } },
                    noUrutRumah: true,
                    lat: true,
                    lng: true,
                },
            });

            return { updated, meta };
        });

        let successMsg = "Pelanggan berhasil diperbarui";
        if (
            meta.reordered &&
            !meta.zonaChanged &&
            typeof meta.to === "number"
        ) {
            successMsg = `Nomor urut pelanggan "${updated.nama}" dipindah ke ${updated.noUrutRumah}.`;
        } else if (meta.zonaChanged && meta.clearedZona) {
            successMsg = `Zona dikosongkan dan nomor urut dihapus.`;
        } else if (meta.zonaChanged && meta.appended) {
            successMsg = `Pelanggan dipindah ke zona baru dan diberi nomor urut ${updated.noUrutRumah}.`;
        }

        return NextResponse.json({
            ok: true,
            item: {
                id: updated.id,
                kodeCustomer: updated.kode,
                nama: updated.nama,
                noWA: updated.wa ?? "",
                noWA2: updated.wa2 ?? "",
                alamat: updated.alamat,
                meterAwal: updated.meterAwal,
                status: updated.statusAktif
                    ? ("aktif" as const)
                    : ("nonaktif" as const),
                zonaId: updated.zonaId ?? null,
                zonaNama: updated.zona?.nama ?? null,
                noUrutRumah: updated.noUrutRumah ?? null,
                lat: updated.lat != null ? Number(updated.lat) : null,
                lng: updated.lng != null ? Number(updated.lng) : null,
            },
            message: successMsg,
        });
    } catch (e) {
        console.error("❌ PUT /api/pelanggan:", e);
        const err = e as { code?: string; message?: string };
        if (err.code === "P2025") {
            return NextResponse.json(
                { ok: false, message: "Pelanggan tidak ditemukan" },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { ok: false, message: err.message ?? "Server error" },
            { status: 500 }
        );
    }
}

/* ===================== DELETE (tetap) ===================== */
type JwtPayload = { sub?: string };
function getAuthUserId(req: NextRequest): string | null {
    const token = req.cookies.get("tb_token")?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "supersecret"
        ) as JwtPayload;
        return decoded.sub ?? null;
    } catch {
        return null;
    }
}
export async function DELETE(req: NextRequest) {
    const prisma = await db();
    try {
        const urlId = req.nextUrl.searchParams.get("id") ?? undefined;
        const body = await req.json().catch(() => ({} as unknown));
        const id = (body as { id?: string })?.id ?? urlId;
        if (!id) {
            return NextResponse.json(
                { ok: false, message: "ID wajib disertakan" },
                { status: 400 }
            );
        }

        const used = await prisma.catatMeter.findFirst({
            where: { pelangganId: id, deletedAt: null },
            select: { id: true },
        });
        if (used) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Pelanggan tidak bisa dihapus karena sudah pernah dipakai di Catat Meter. Hapus data Catat Meter terkait terlebih dahulu jika memang diperlukan.",
                },
                { status: 409 }
            );
        }

        const userId = getAuthUserId(req);

        const result = await prisma.pelanggan.updateMany({
            where: { id, deletedAt: null },
            data: {
                deletedAt: new Date(),
                deletedBy: userId ?? null,
                statusAktif: false,
            },
        });

        if (result.count === 0) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Pelanggan tidak ditemukan atau sudah dihapus",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            message: "Pelanggan berhasil dihapus (soft delete)",
        });
    } catch (e) {
        const err = e as { code?: string; message?: string };
        if (err.code === "P2025") {
            return NextResponse.json(
                { ok: false, message: "Pelanggan tidak ditemukan" },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { ok: false, message: err.message ?? "Server error" },
            { status: 500 }
        );
    }
}
