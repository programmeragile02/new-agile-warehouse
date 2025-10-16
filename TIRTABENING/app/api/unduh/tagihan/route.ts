// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";// import { renderPageToJPG } from "@/lib/render-page-to-jpg";

// export const runtime = "nodejs";

// function getAppOrigin(req: NextRequest) {
//   const h = req.headers;
//   return (
//     process.env.APP_ORIGIN ||
//     process.env.NEXT_PUBLIC_APP_URL ||
//     h.get("origin") ||
//     `${h.get("x-forwarded-proto") || "http"}://${
//       h.get("x-forwarded-host") || h.get("host") || ""
//     }`
//   )?.replace(/\/$/, "");
// }

// export async function GET(req: NextRequest) {
//   try {
//     const url = new URL(req.url);
//     const tagihanId = url.searchParams.get("tagihanId") || "";
//     if (!tagihanId) {
//       return NextResponse.json(
//         { ok: false, message: "tagihanId wajib" },
//         { status: 400 }
//       );
//     }

//     const t = await prisma.tagihan.findUnique({
//       where: { id: tagihanId, deletedAt: null },
//       select: {
//         id: true,
//         periode: true,
//         pelanggan: { select: { kode: true, nama: true } },
//       },
//     });
//     if (!t)
//       return NextResponse.json(
//         { ok: false, message: "Tagihan tidak ditemukan" },
//         { status: 404 }
//       );

//     const origin = getAppOrigin(req);
//     // Sesuaikan path halaman cetak tagihan milik Anda:
//     // kalau file Anda berada di /print/tagihan/[tagihanId], maka:
//     const tplUrl = `${origin}/print/tagihan/${encodeURIComponent(tagihanId)}`;

//     const safeKode = (t.pelanggan?.kode || "CUST").replace(
//       /[^A-Za-z0-9_-]/g,
//       ""
//     );
//     const name = t.pelanggan?.nama || "Pelanggan";
//     const outName = `tagihan-${t.periode}-${name}-${safeKode}.jpg`;

//     const jpgUrl = await renderPageToJPG({
//       tplUrl,
//       outName,
//       subdir: "billing/img", // folder output
//       selector: ".card, .paper, body", // fallback selector
//     });

//     return NextResponse.json({ ok: true, url: jpgUrl });
//   } catch (e: any) {
//     console.error("[unduh-tagihan]", e);
//     return NextResponse.json(
//       { ok: false, message: e?.message || "Server error" },
//       { status: 500 }
//     );
//   }
// }
// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { renderPageToJPG } from "@/lib/render-page-to-jpg";
// import { resolveUploadPath } from "@/lib/uploads";
// import fs from "node:fs/promises";
// export const runtime = "nodejs";

// function getAppOrigin(req: NextRequest) {
//   const h = req.headers;
//   return (
//     process.env.APP_ORIGIN ||
//     process.env.NEXT_PUBLIC_APP_URL ||
//     h.get("origin") ||
//     `${h.get("x-forwarded-proto") || "http"}://${
//       h.get("x-forwarded-host") || h.get("host") || ""
//     }`
//   )?.replace(/\/$/, "");
// }

// export async function GET(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const url = new URL(req.url);
//     const tagihanId = url.searchParams.get("tagihanId") || "";
//     if (!tagihanId)
//       return NextResponse.json(
//         { ok: false, message: "tagihanId wajib" },
//         { status: 400 }
//       );

//     const t = await prisma.tagihan.findUnique({
//       where: { id: tagihanId, deletedAt: null },
//       select: {
//         id: true,
//         periode: true,
//         pelanggan: { select: { kode: true } },
//       },
//     });
//     if (!t)
//       return NextResponse.json(
//         { ok: false, message: "Tagihan tidak ditemukan" },
//         { status: 404 }
//       );

//     const origin = getAppOrigin(req);
//     const tplUrl = `${origin}/print/tagihan/${encodeURIComponent(tagihanId)}`;

//     const safeKode = (t.pelanggan?.kode || "CUST").replace(
//       /[^A-Za-z0-9_-]/g,
//       ""
//     );
//     const outName = `tagihan-${t.periode}-${safeKode}.jpg`;

//     const subdir = "billing/img";
//     const relSegments = subdir.split("/").filter(Boolean);
//     const absPath = resolveUploadPath(...relSegments, outName);
//     const apiUrl = `/api/file/${relSegments.join("/")}/${outName}`;

//     const exists = await fs
//       .stat(absPath)
//       .then(() => true)
//       .catch(() => false);
//     if (exists)
//       return NextResponse.json({ ok: true, url: apiUrl, cache: true });

//     const jpgUrl = await renderPageToJPG({
//       tplUrl,
//       outName,
//       subdir,
//       selector: ".paper, .card, body",
//     });
//     return NextResponse.json({ ok: true, url: jpgUrl, cache: false });
//   } catch (e: any) {
//     console.error("[unduh-tagihan]", e);
//     return NextResponse.json(
//       { ok: false, message: e?.message || "Server error" },
//       { status: 500 }
//     );
//   }
// }
// app/api/unduh/tagihan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { renderPageToJPG } from "@/lib/render-page-to-jpg"; // pastikan file ini mendukung headers

export const runtime = "nodejs";

function getAppOrigin(req: NextRequest) {
    const h = req.headers;
    return (
        process.env.APP_ORIGIN ||
        process.env.NEXT_PUBLIC_APP_URL ||
        h.get("origin") ||
        `${h.get("x-forwarded-proto") || "http"}://${
            h.get("x-forwarded-host") || h.get("host") || ""
        }`
    )?.replace(/\/$/, "");
}

export async function GET(req: NextRequest) {
    const prisma = await db();
    try {
        const url = new URL(req.url);
        const tagihanId = url.searchParams.get("tagihanId") || "";
        if (!tagihanId) {
            return NextResponse.json(
                { ok: false, message: "tagihanId wajib" },
                { status: 400 }
            );
        }

        const t = await prisma.tagihan.findUnique({
            where: { id: tagihanId, deletedAt: null },
            select: {
                id: true,
                periode: true,
                pelanggan: { select: { kode: true } },
            },
        });
        if (!t)
            return NextResponse.json(
                { ok: false, message: "Tagihan tidak ditemukan" },
                { status: 404 }
            );

        const origin = getAppOrigin(req);
        const tplUrl = `${origin}/print/tagihan/${encodeURIComponent(
            tagihanId
        )}`;
        const safeKode = (t.pelanggan?.kode || "CUST").replace(
            /[^A-Za-z0-9_-]/g,
            ""
        );
        const outName = `tagihan-${t.periode}-${safeKode}.jpg`;

        // forward headers (cookie + x-company-id + authorization) supaya halaman print mengenali company/session
        const forwardHeaders: Record<string, string> = {};
        const cookie = req.headers.get("cookie");
        if (cookie) forwardHeaders["cookie"] = cookie;
        const xCompany =
            req.headers.get("x-company-id") ||
            req.headers.get("x-companyid") ||
            (req.cookies?.get("tb_company")?.value ?? null);
        if (xCompany) forwardHeaders["x-company-id"] = String(xCompany);
        const auth = req.headers.get("authorization");
        if (auth) forwardHeaders["authorization"] = auth;

        const raw = await renderPageToJPG({
            tplUrl,
            outName,
            selector: ".paper, .card, body",
            persist: false,
            headers: forwardHeaders,
        });

        // Type-narrow: jika render mengembalikan string (persist true), itu error di path ini
        if (typeof raw === "string") {
            return NextResponse.json(
                { ok: false, message: "unexpected render output" },
                { status: 500 }
            );
        }
        const out = raw; // now TS knows { base64, filename }

        const buf = Buffer.from(out.base64, "base64");
        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": "image/jpeg",
                "Content-Disposition": `attachment; filename="${out.filename}"`,
                "Cache-Control":
                    "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Content-Length": String(buf.length),
                "Accept-Ranges": "none",
                Pragma: "no-cache",
                Expires: "0",
                "Surrogate-Control": "no-store",
            },
        });
    } catch (e: any) {
        console.error("[unduh-tagihan]", e);
        return NextResponse.json(
            { ok: false, message: e?.message || "Server error" },
            { status: 500 }
        );
    }
}

// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { renderPageToJPG } from "@/lib/render-page-to-jpg";

// export const runtime = "nodejs";

// function getAppOrigin(req: NextRequest) {
//     const h = req.headers;
//     return (
//         process.env.APP_ORIGIN ||
//         process.env.NEXT_PUBLIC_APP_URL ||
//         h.get("origin") ||
//         `${h.get("x-forwarded-proto") || "http"}://${
//             h.get("x-forwarded-host") || h.get("host") || ""
//         }`
//     )?.replace(/\/$/, "");
// }

// export async function GET(req: NextRequest) {
//     const prisma = await db();
//     try {
//         const url = new URL(req.url);
//         const tagihanId = url.searchParams.get("tagihanId") || "";
//         if (!tagihanId) {
//             return NextResponse.json(
//                 { ok: false, message: "tagihanId wajib" },
//                 { status: 400 }
//             );
//         }

//         const t = await prisma.tagihan.findUnique({
//             where: { id: tagihanId, deletedAt: null },
//             select: {
//                 id: true,
//                 periode: true,
//                 pelanggan: { select: { kode: true } },
//             },
//         });
//         if (!t) {
//             return NextResponse.json(
//                 { ok: false, message: "Tagihan tidak ditemukan" },
//                 { status: 404 }
//             );
//         }

//         const origin = getAppOrigin(req);
//         const tplUrl = `${origin}/print/tagihan/${encodeURIComponent(
//             tagihanId
//         )}`;
//         const safeKode = (t.pelanggan?.kode || "CUST").replace(
//             /[^A-Za-z0-9_-]/g,
//             ""
//         );
//         const outName = `tagihan-${t.periode}-${safeKode}.jpg`;

//         const out = await renderPageToJPG({
//             tplUrl,
//             outName,
//             selector: ".paper, .card, body",
//             persist: false,
//         });

//         const buf = Buffer.from(out.base64, "base64");
//         return new NextResponse(buf, {
//             status: 200,
//             headers: {
//                 "Content-Type": "image/jpeg",
//                 "Content-Disposition": `attachment; filename="${out.filename}"`,
//                 "Cache-Control":
//                     "no-store, no-cache, must-revalidate, proxy-revalidate",
//                 "Content-Length": String(buf.length),
//                 "Accept-Ranges": "none",
//                 Pragma: "no-cache",
//                 Expires: "0",
//                 "Surrogate-Control": "no-store",
//             },
//         });
//     } catch (e: any) {
//         console.error("[unduh-tagihan]", e);
//         return NextResponse.json(
//             { ok: false, message: e?.message || "Server error" },
//             { status: 500 }
//         );
//     }
// }
