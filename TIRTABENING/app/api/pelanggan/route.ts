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
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

/* ===================== ENV (Warehouse) ===================== */
const WAREHOUSE_API_BASE =
    process.env.WAREHOUSE_API_BASE || "http://localhost:9000";
const WAREHOUSE_API_KEY = process.env.WAREHOUSE_API_KEY || "";
const PRODUCT_CODE = process.env.PRODUCT_CODE || "TIRTABENING";

/* ===================== Cookie helper ===================== */
function getCompanyIdFromCookie(req: NextRequest): string | null {
    // kita pakai cookie tb_company sesuai arsitektur login kamu
    return req.cookies.get("tb_company")?.value ?? null;
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

// 🔹 TAMBAH zonaId (opsional) & wa2 (opsional)
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

/* ===================== Entitlement fetch + cache ===================== */
type MaybeNum = number | null | undefined;

type WarehouseEntitlement = {
    code: string;
    value_number?: number | null;
    value_string?: string | null;
    enabled?: boolean;
};

type WarehouseResp = {
    ok?: boolean;
    entitlements?: WarehouseEntitlement[];
    packageCode?: string; // BASIC | PREMIUM | PROFESSIONAL | ...
    plan?: string; // alias (kalau Warehouse mengembalikannya begitu)
};

const TierLimit: Record<string, number> = {
    BASIC: 30,
    PREMIUM: 100,
    PROFESSIONAL: 500,
};

// in-memory cache 5 menit per company
const EntCache: Record<string, { max: number; exp: number }> =
    Object.create(null);
const now = () => Date.now();

/** Ambil entitlements dari Warehouse */
async function fetchEntitlementsFromWarehouse(
    companyId: string
): Promise<WarehouseResp | null> {
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
            // timeout bawaan edge/Node; kalau perlu custom timeout bisa ditambah AbortController
        });
        if (!res.ok) return null;
        const data = (await res.json()) as WarehouseResp;
        return data ?? null;
    } catch {
        return null;
    }
}

/** Resolve limit maksimal pelanggan:
 *  1) Cari entitlements["maksimal.pelanggan"] dari Warehouse
 *  2) Jika tidak ada → fallback ke packageCode (Basic/Premium/Professional)
 *  3) Jika tidak jelas → Infinity
 *  + Cache 5 menit per company
 */
async function resolveMaxCustomers(
    prisma: any,
    companyId: string | null
): Promise<number> {
    if (!companyId) return Infinity;

    // cache hit?
    const hit = EntCache[companyId];
    if (hit && hit.exp > now()) return hit.max;

    const resp = await fetchEntitlementsFromWarehouse(companyId);
    if (resp?.entitlements?.length) {
        const found = resp.entitlements.find(
            (e) => e.code === "maksimal.pelanggan" && (e.enabled ?? true)
        );
        const v: MaybeNum =
            found?.value_number ??
            (found?.value_string != null
                ? Number(found.value_string)
                : undefined);
        if (Number.isFinite(v)) {
            const max = Number(v);
            EntCache[companyId] = { max, exp: now() + 5 * 60_000 };
            return max;
        }
    }

    // fallback ke package/plan
    const pkg = (resp?.packageCode || resp?.plan || "").toUpperCase();
    if (TierLimit[pkg]) {
        const max = TierLimit[pkg];
        EntCache[companyId] = { max, exp: now() + 5 * 60_000 };
        return max;
    }

    // ultimate fallback
    const max = Infinity;
    EntCache[companyId] = { max, exp: now() + 60_000 }; // cache pendek 1 menit
    return max;
}

/** Hitung pelanggan aktif (exclude soft delete) */
async function countActiveCustomers(prisma: any): Promise<number> {
    return prisma.pelanggan.count({ where: { deletedAt: null } });
}

/* ===================== Handlers ===================== */
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
            if (!existsZona) {
                return NextResponse.json(
                    { ok: false, message: "Zona tidak ditemukan" },
                    { status: 404 }
                );
            }
        }

        const kode = genCustomerCode(nama);
        const finalUsername = username ?? genUsername(nama);

        const normalizeWA = (v?: string) => {
            if (!v) return undefined;
            const digits = v.replace(/\D/g, "");
            if (!digits) return "";
            if (digits.startsWith("0")) return `62${digits.slice(1)}`;
            if (digits.startsWith("62")) return digits;
            return digits;
        };

        const waNorm = normalizeWA(wa) ?? null;
        const wa2Norm = normalizeWA(wa2) ?? null;

        const rawPassword =
            (password && String(password)) ||
            `tb-${Math.random().toString(36).slice(2, 8)}`;
        const passwordHash = await bcrypt.hash(rawPassword, 10);

        const companyId = getCompanyIdFromCookie(req);

        // ====== KUOTA: cek dalam transaksi (anti race) ======
        const out = await prisma.$transaction(async (tx) => {
            const max = await resolveMaxCustomers(tx, companyId);
            const used = await countActiveCustomers(tx);
            if (used >= max) {
                return { blocked: true as const, used, max };
            }

            // 1) create user
            const user = await tx.user.create({
                data: {
                    username: finalUsername,
                    passwordHash,
                    name: nama,
                    phone: waNorm ?? null,
                    role: "WARGA",
                    isActive: true,
                },
                select: { id: true, username: true, name: true },
            });

            // 2) auto noUrutRumah jika perlu
            if (zonaId && noUrutRumah === null) {
                const maxNo = await tx.pelanggan.aggregate({
                    where: { zonaId, deletedAt: null },
                    _max: { noUrutRumah: true },
                });
                noUrutRumah = (maxNo._max.noUrutRumah ?? 0) + 1;
            }

            // 3) create pelanggan
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

        return NextResponse.json(
            {
                ok: true,
                data: {
                    pelanggan: out.pelanggan,
                    user: { username: out.user.username },
                    tempPassword: rawPassword,
                    quota: {
                        used: out.used,
                        max: out.max,
                        remaining: Math.max(0, out.max - out.used),
                    },
                },
                message: "Pelanggan & user berhasil dibuat",
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

        // ===== Quick quota lookup untuk UI =====
        if (sp.get("quota") === "1") {
            const companyId = getCompanyIdFromCookie(req);
            const max = await resolveMaxCustomers(prisma, companyId);
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

/* ===================== PUT (tanpa perubahan kuota) ===================== */
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

        const schema = z.object({
            id: z.string().optional(),
            nama: z.string().min(1).optional(),
            wa: z.string().optional(),
            wa2: z.string().optional(),
            alamat: z.string().min(1).optional(),
            meterAwal: z.number().int().nonnegative().optional(),
            status: z.enum(["aktif", "nonaktif"]).optional(),
            zonaId: z.string().nullable().optional(),
            noUrutRumah: z.number().int().positive().nullable().optional(),
            lat: z.number().min(-90).max(90).nullable().optional(),
            lng: z.number().min(-180).max(180).nullable().optional(),
        });

        const parsed = schema.safeParse(rawBody);
        if (!parsed.success) {
            const msg = parsed.error.issues.map((i) => i.message).join(", ");
            return NextResponse.json(
                { ok: false, message: msg },
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

        const zonaIdNorm =
            body.zonaId !== undefined
                ? body.zonaId === ""
                    ? null
                    : body.zonaId
                : undefined;

        const noUrutNorm =
            body.noUrutRumah === null
                ? null
                : body.noUrutRumah === undefined
                ? undefined
                : Number(body.noUrutRumah);

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

        const normalizeWA = (v?: string) => {
            if (!v) return undefined;
            const digits = v.replace(/\D/g, "");
            if (!digits) return "";
            if (digits.startsWith("0")) return `62${digits.slice(1)}`;
            if (digits.startsWith("62")) return digits;
            return digits;
        };

        if (body.nama !== undefined) data.nama = body.nama;
        if (body.alamat !== undefined) data.alamat = body.alamat;
        if (body.wa !== undefined)
            (data as any).wa = normalizeWA(body.wa) ?? null;
        if (body.wa2 !== undefined)
            (data as any).wa2 = normalizeWA(body.wa2) ?? null;
        if (body.status !== undefined)
            data.statusAktif = body.status === "aktif";
        if (body.lat !== undefined) (data as any).lat = body.lat;
        if (body.lng !== undefined) (data as any).lng = body.lng;

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

            if (zonaIdNorm !== undefined) {
                data.zonaId = zonaIdNorm;
            }

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
            } else if (
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
            } else if (zonaChanged) {
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
            } else if (noUrutNorm === null) {
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
        // (pesan meta tetap seperti versimu)
        return NextResponse.json({
            ok: true,
            item: {
                id: out.updated.id,
                kodeCustomer: out.updated.kode,
                nama: out.updated.nama,
                noWA: out.updated.wa ?? "",
                noWA2: out.updated.wa2 ?? "",
                alamat: out.updated.alamat,
                meterAwal: out.updated.meterAwal,
                status: out.updated.statusAktif
                    ? ("aktif" as const)
                    : ("nonaktif" as const),
                zonaId: out.updated.zonaId ?? null,
                zonaNama: out.updated.zona?.nama ?? null,
                noUrutRumah: out.updated.noUrutRumah ?? null,
                lat: out.updated.lat != null ? Number(out.updated.lat) : null,
                lng: out.updated.lng != null ? Number(out.updated.lng) : null,
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
