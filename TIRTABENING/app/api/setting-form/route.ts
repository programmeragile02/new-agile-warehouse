// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { db } from "@/lib/db";
// export const dynamic = "force-dynamic";

// const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
//   z.preprocess(
//     (v) => (typeof v === "string" && v.trim() === "" ? null : v),
//     schema
//   );

// function cleanData<T extends Record<string, any>>(obj: T): Partial<T> {
//   const out: Record<string, any> = {};
//   for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
//   return out as Partial<T>;
// }

// // ——— Tambahkan field baru di schema ini ———
// const SystemSchema = z.object({
//   namaPerusahaan: emptyToNull(z.string().max(120).nullable()).optional(),
//   alamat: emptyToNull(z.string().max(255).nullable()).optional(),
//   telepon: emptyToNull(z.string().max(30).nullable()).optional(),
//   email: emptyToNull(z.string().email().max(120).nullable()).optional(),
//   logoUrl: emptyToNull(z.string().max(255).nullable()).optional(),

//   // baru:
//   namaBankPembayaran: emptyToNull(z.string().max(120).nullable()).optional(),
//   norekPembayaran: emptyToNull(z.string().max(50).nullable()).optional(),
//   anNorekPembayaran: emptyToNull(z.string().max(120).nullable()).optional(),
//   namaBendahara: emptyToNull(z.string().max(120).nullable()).optional(),
//   whatsappCs: emptyToNull(z.string().max(30).nullable()).optional(),
// });

// export async function GET() {
//   const prisma = await db();
//   try {
//     const row =
//       (await prisma.setting.findUnique({ where: { id: 1 } })) ??
//       (await prisma.setting.create({
//         data: {
//           id: 1,
//           // default tarif
//           tarifPerM3: 3000,
//           abonemen: 10000,
//           biayaAdmin: 2500,
//           tglJatuhTempo: 15,
//           dendaTelatBulanSama: 5000,
//           dendaTelatBulanBerbeda: 10000,

//           // profil default kosong
//           namaPerusahaan: "",
//           alamat: "",
//           telepon: "",
//           email: "",
//           logoUrl: "",

//           // field baru default kosong
//           namaBankPembayaran: "",
//           norekPembayaran: "",
//           anNorekPembayaran: "",
//           namaBendahara: "",
//           whatsappCs: "",

//           // jadwal
//           tanggalCatatDefault: null,
//         },
//       }));

//     return NextResponse.json({
//       namaPerusahaan: row.namaPerusahaan ?? "",
//       alamat: row.alamat ?? "",
//       telepon: row.telepon ?? "",
//       email: row.email ?? "",
//       logoUrl: row.logoUrl ?? "",

//       // baru:
//       namaBankPembayaran: row.namaBankPembayaran ?? "",
//       norekPembayaran: row.norekPembayaran ?? "",
//       anNorekPembayaran: row.anNorekPembayaran ?? "",
//       namaBendahara: row.namaBendahara ?? "",
//       whatsappCs: row.whatsappCs ?? "",
//     });
//   } catch (e) {
//     console.error("GET /api/setting-form error:", e);
//     return NextResponse.json(
//       { message: "Gagal memuat profil" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(req: Request) {
//   const prisma = await db();
//   try {
//     const json = await req.json().catch(() => ({}));
//     const parsed = SystemSchema.safeParse(json);
//     if (!parsed.success) {
//       return NextResponse.json(
//         { message: "Validasi gagal", issues: parsed.error.flatten() },
//         { status: 400 }
//       );
//     }

//     const data = cleanData(parsed.data);

//     const updated = await prisma.setting.upsert({
//       where: { id: 1 },
//       update: data,
//       create: {
//         id: 1,
//         // default tarif
//         tarifPerM3: 3000,
//         abonemen: 10000,
//         biayaAdmin: 2500,
//         tglJatuhTempo: 15,
//         dendaTelatBulanSama: 5000,
//         dendaTelatBulanBerbeda: 10000,

//         // jadwal
//         tanggalCatatDefault: null,

//         // profil + field baru
//         namaPerusahaan: "",
//         alamat: "",
//         telepon: "",
//         email: "",
//         logoUrl: "",
//         namaBankPembayaran: "",
//         norekPembayaran: "",
//         anNorekPembayaran: "",
//         namaBendahara: "",
//         whatsappCs: "",

//         ...data,
//       },
//       select: {
//         namaPerusahaan: true,
//         alamat: true,
//         telepon: true,
//         email: true,
//         logoUrl: true,

//         // baru (ikut dikembalikan agar form sinkron)
//         namaBankPembayaran: true,
//         norekPembayaran: true,
//         anNorekPembayaran: true,
//         namaBendahara: true,
//         whatsappCs: true,
//       },
//     });

//     return NextResponse.json({
//       namaPerusahaan: updated.namaPerusahaan ?? "",
//       alamat: updated.alamat ?? "",
//       telepon: updated.telepon ?? "",
//       email: updated.email ?? "",
//       logoUrl: updated.logoUrl ?? "",

//       // baru:
//       namaBankPembayaran: updated.namaBankPembayaran ?? "",
//       norekPembayaran: updated.norekPembayaran ?? "",
//       anNorekPembayaran: updated.anNorekPembayaran ?? "",
//       namaBendahara: updated.namaBendahara ?? "",
//       whatsappCs: updated.whatsappCs ?? "",
//     });
//   } catch (e) {
//     console.error("PUT /api/setting-form error:", e);
//     return NextResponse.json(
//       { message: "Gagal menyimpan profil" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// "" -> null untuk field nullable
const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess(
        (v) => (typeof v === "string" && v.trim() === "" ? null : v),
        schema
    );

// buang undefined (biar partial update gak nulis undefined)
function cleanData<T extends Record<string, any>>(obj: T): Partial<T> {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
    return out as Partial<T>;
}

// sanitasi logoUrl: drop kalau blob:
const sanitizeLogo = z.preprocess((v) => {
    if (typeof v !== "string") return v;
    if (v.startsWith("blob:")) return null; // <-- JANGAN SIMPAN blob:
    return v.trim();
}, z.string().max(255).nullable());

const SystemSchema = z.object({
    namaPerusahaan: emptyToNull(z.string().max(120).nullable()).optional(),
    alamat: emptyToNull(z.string().max(255).nullable()).optional(),
    telepon: emptyToNull(z.string().max(30).nullable()).optional(),
    email: emptyToNull(z.string().email().max(120).nullable()).optional(),
    logoUrl: sanitizeLogo.optional(), // <-- pakai sanitizer

    namaBankPembayaran: emptyToNull(z.string().max(120).nullable()).optional(),
    norekPembayaran: emptyToNull(z.string().max(50).nullable()).optional(),
    anNorekPembayaran: emptyToNull(z.string().max(120).nullable()).optional(),
    namaBendahara: emptyToNull(z.string().max(120).nullable()).optional(),
    whatsappCs: emptyToNull(z.string().max(30).nullable()).optional(),
});

const selectFields = {
    namaPerusahaan: true,
    alamat: true,
    telepon: true,
    email: true,
    logoUrl: true,
    namaBankPembayaran: true,
    norekPembayaran: true,
    anNorekPembayaran: true,
    namaBendahara: true,
    whatsappCs: true,
} as const;

// GET: buat row minimal bila belum ada
export async function GET() {
    const prisma = await db();
    try {
        const row = await prisma.setting.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1 },
            select: selectFields,
        });

        return NextResponse.json({
            namaPerusahaan: row.namaPerusahaan ?? "",
            alamat: row.alamat ?? "",
            telepon: row.telepon ?? "",
            email: row.email ?? "",
            logoUrl: row.logoUrl ?? "",
            namaBankPembayaran: row.namaBankPembayaran ?? "",
            norekPembayaran: row.norekPembayaran ?? "",
            anNorekPembayaran: row.anNorekPembayaran ?? "",
            namaBendahara: row.namaBendahara ?? "",
            whatsappCs: row.whatsappCs ?? "",
        });
    } catch (e) {
        console.error("GET /api/setting-form error:", e);
        return NextResponse.json(
            { message: "Gagal memuat profil" },
            { status: 500 }
        );
    }
}

// PUT: update partial + sanitasi logoUrl
export async function PUT(req: Request) {
    const prisma = await db();
    try {
        const json = await req.json().catch(() => ({}));
        const parsed = SystemSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { message: "Validasi gagal", issues: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const data = cleanData(parsed.data);

        // pastikan baris ada
        await prisma.setting.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1 },
        });

        const updated = await prisma.setting.update({
            where: { id: 1 },
            data,
            select: selectFields,
        });

        return NextResponse.json({
            namaPerusahaan: updated.namaPerusahaan ?? "",
            alamat: updated.alamat ?? "",
            telepon: updated.telepon ?? "",
            email: updated.email ?? "",
            logoUrl: updated.logoUrl ?? "",
            namaBankPembayaran: updated.namaBankPembayaran ?? "",
            norekPembayaran: updated.norekPembayaran ?? "",
            anNorekPembayaran: updated.anNorekPembayaran ?? "",
            namaBendahara: updated.namaBendahara ?? "",
            whatsappCs: updated.whatsappCs ?? "",
        });
    } catch (e) {
        console.error("PUT /api/setting-form error:", e);
        return NextResponse.json(
            { message: "Gagal menyimpan profil" },
            { status: 500 }
        );
    }
}
