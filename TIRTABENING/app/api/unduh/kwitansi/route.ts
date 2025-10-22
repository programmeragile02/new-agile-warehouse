import { NextRequest, NextResponse } from "next/server";
import { renderKwitansiToJPG } from "@/lib/render-kwitansi";
import { db } from "@/lib/db";

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
        const payId = url.searchParams.get("payId") || undefined;

        if (!tagihanId)
            return NextResponse.json(
                { ok: false, message: "tagihanId wajib" },
                { status: 400 }
            );

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

        // build forward headers
        const forwardHeaders: Record<string, string> = {};
        const cookie = req.headers.get("cookie");
        if (cookie) forwardHeaders["cookie"] = cookie;

        // jika kamu memakai header x-company-id, teruskan juga
        const xCompany =
            req.headers.get("x-company-id") ||
            req.headers.get("x-companyid") ||
            (req.cookies?.get("tb_company")?.value ?? null);
        if (xCompany) forwardHeaders["x-company-id"] = String(xCompany);

        const auth = req.headers.get("authorization");
        if (auth) forwardHeaders["authorization"] = auth;

        const origin = getAppOrigin(req);
        const safeKode = (t.pelanggan?.kode || "CUST").replace(
            /[^A-Za-z0-9_-]/g,
            ""
        );
        const outName = `kwitansi-${t.periode}-${safeKode}.jpg`;

        const out = (await renderKwitansiToJPG({
            tplUrl: `${origin}/print/kwitansi/${encodeURIComponent(
                tagihanId
            )}?payId=${payId ?? ""}`,
            outName,
            persist: false,
            headers: forwardHeaders,
        })) as { base64: string; filename: string; mimeType: "image/jpeg" }; // type assertion safe karena persist:false

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
        console.error("[unduh-kwitansi]", e);
        return NextResponse.json(
            { ok: false, message: e?.message || "Server error" },
            { status: 500 }
        );
    }
}
