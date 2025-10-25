// // app/api/upload/route.ts
// import { NextResponse } from "next/server";
// import { randomUUID } from "crypto";
// import { promises as fs } from "fs";
// import path from "path";

// export const dynamic = "force-dynamic";

// export async function POST(req: Request) {
//     try {
//         const form = await req.formData();
//         const file = form.get("file");
//         if (!(file instanceof File)) {
//             return NextResponse.json(
//                 { ok: false, message: "File tidak ditemukan" },
//                 { status: 400 }
//             );
//         }

//         // validasi ringan
//         if (!file.type.startsWith("image/")) {
//             return NextResponse.json(
//                 { ok: false, message: "Harus file gambar" },
//                 { status: 400 }
//             );
//         }
//         const arrayBuffer = await file.arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);

//         const uploadsDir = path.join(process.cwd(), "public", "uploads");
//         await fs.mkdir(uploadsDir, { recursive: true });

//         const ext = (file.name.split(".").pop() || "png").toLowerCase();
//         const fname = `${randomUUID()}.${ext}`;
//         const outPath = path.join(uploadsDir, fname);

//         await fs.writeFile(outPath, buffer);

//         // URL publik
//         const publicUrl = `/uploads/${fname}`;

//         return NextResponse.json({ ok: true, url: publicUrl });
//     } catch (e: any) {
//         console.error("UPLOAD error:", e);
//         return NextResponse.json(
//             { ok: false, message: "Gagal upload" },
//             { status: 500 }
//         );
//     }
// }

// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveUploadFile } from "@/lib/uploads";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

/* ============== helpers compression (image only, target 200KB) ============== */

async function compressImageToTargetKB(
    input: Buffer,
    targetKB = 200,
    options?: { maxWidth?: number; minWidth?: number; format?: "webp" | "avif" }
) {
    const targetBytes = targetKB * 1024;
    let width = options?.maxWidth ?? 1600;
    const minWidth = options?.minWidth ?? 600;
    let quality = 80;
    const minQuality = 40;
    const format = options?.format ?? "webp";

    let out = await sharp(input, { failOn: "none" })
        .rotate()
        .resize({
            width,
            height: width,
            fit: "inside",
            withoutEnlargement: true,
        })
        [format]({ quality })
        .toBuffer();

    let iter = 0;
    while (out.byteLength > targetBytes && iter < 12) {
        iter++;
        if (out.byteLength > targetBytes * 1.6 && width > minWidth) {
            width = Math.max(minWidth, Math.floor(width * 0.85));
        } else if (quality > minQuality) {
            quality = Math.max(minQuality, quality - 8);
        } else if (width > minWidth) {
            width = Math.max(minWidth, Math.floor(width * 0.9));
        } else {
            break;
        }

        out = await sharp(input, { failOn: "none" })
            .rotate()
            .resize({
                width,
                height: width,
                fit: "inside",
                withoutEnlargement: true,
            })
            [format]({ quality })
            .toBuffer();
    }

    const mime = format === "webp" ? "image/webp" : "image/avif";
    const ext = format;
    return { buffer: out, mime, ext };
}

async function makeCompressedFileMax200KB(original: File, targetKB = 200) {
    const arrayBuf = await original.arrayBuffer();
    const input = Buffer.from(arrayBuf);
    const t = await fileTypeFromBuffer(input);
    const mime =
        t?.mime || (original as any).type || "application/octet-stream";

    if (/^image\//.test(mime)) {
        const {
            buffer,
            mime: outMime,
            ext: outExt,
        } = await compressImageToTargetKB(input, targetKB, {
            maxWidth: 1600,
            minWidth: 600,
            format: "webp",
        });
        const u8 = new Uint8Array(buffer);
        return new File([u8], `${randomUUID()}.${outExt}`, { type: outMime });
    }

    throw new Error(
        "Format file tidak didukung. Unggah gambar (jpg/png/webp)."
    );
}

/* ================= helper: baca cookie tb_company (sama pola pelunasan) ================ */

function getCompanyFromRequest(req: NextRequest) {
    try {
        const anyReq = req as any;
        const ck = anyReq?.cookies?.get?.("tb_company")?.value;
        if (ck) return ck;
        const cookieHeader = req.headers.get("cookie") || "";
        const found = cookieHeader
            .split(";")
            .map((s) => s.trim())
            .find((c) => c.startsWith("tb_company="));
        if (found) return decodeURIComponent(found.split("=")[1] || "");
        return null;
    } catch {
        return null;
    }
}

/* ===================== Route handlers ===================== */

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const contentType = (
            req.headers.get("content-type") || ""
        ).toLowerCase();
        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Content-Type harus multipart/form-data",
                },
                { status: 400 }
            );
        }

        const form = await req.formData();
        const file = form.get("file") as File | null; // frontend mengirim 'file'
        if (!file)
            return NextResponse.json(
                { ok: false, message: "File tidak ditemukan" },
                { status: 400 }
            );

        // validasi image
        if (
            !(file as any).type ||
            !String((file as any).type).startsWith("image/")
        ) {
            return NextResponse.json(
                { ok: false, message: "Harus file gambar" },
                { status: 400 }
            );
        }

        // compress -> File (webp)
        const compressed = await makeCompressedFileMax200KB(file, 200);

        // company (optional) dari cookie tb_company
        const companyFromCookie = getCompanyFromRequest(req) || undefined;

        // simpan menggunakan saveUploadFile (akan menaruh di .uploads/<company>/setting/logo/...)
        const saved = await saveUploadFile(
            compressed,
            "logo",
            companyFromCookie
        );

        // kembalikan publicUrl sesuai saveUploadFile (contoh: /api/file/<rel> atau /uploads/...)
        return NextResponse.json({ ok: true, url: saved.publicUrl });
    } catch (err: any) {
        console.error("POST /api/upload error:", err);
        return NextResponse.json(
            { ok: false, message: err?.message || "Upload error" },
            { status: 500 }
        );
    }
}
