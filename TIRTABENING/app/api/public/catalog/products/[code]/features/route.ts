// import type { NextRequest } from "next/server";
// import { assertProductKey } from "@/lib/auth-public";
// import { prisma } from "@/lib/prisma";
// import { mapFeatureRow } from "@/lib/map";

// export const runtime = "nodejs";

// export async function GET(
//     req: NextRequest,
//     ctx: { params: Promise<{ code: string }> }
// ) {
//     const err = assertProductKey(req);
//     if (err) return err;

//     try {
//         // Next.js 15: params harus di-await
//         const { code } = await ctx.params;
//         const productCode = String(code || "").trim();
//         if (!productCode) {
//             return Response.json({ message: "Missing code" }, { status: 400 });
//         }

//         // ⚠️ Model Feature kamu tidak punya productCode / moduleName / isActive.
//         // Pakai filter yang ada saja. Anggap "aktif" = deletedAt NULL.
//         // Jika app ini single-product, tidak perlu filter by product.
//         // Jika multi-product, lakukan filter via relasi (misal menu.productCode) — bisa ditambahkan nanti kalau ada.
//         const rows = await prisma.Feature.findMany({
//             where: {
//                 deletedAt: null, // aktif
//                 // type: { in: ['FEATURE', 'SUBFEATURE'] } // optional kalau enum-nya ada
//             },
//             orderBy: [{ orderNumber: "asc" }], // JANGAN pakai moduleName karena tidak ada
//         });

//         const data = (rows ?? []).map(mapFeatureRow); // mapper akan fallback module_name='General'
//         return Response.json({ data }, { status: 200 });
//     } catch (e: any) {
//         console.error("TB features public error:", e);
//         return Response.json(
//             {
//                 message: "Internal error (features)",
//                 error: String(e?.message ?? e),
//             },
//             { status: 500 }
//         );
//     }
// }

// app/api/features/[code]/route.ts
import { NextRequest } from "next/server";
import { assertProductKey } from "@/lib/auth-public";
// (opsional) kalau kamu punya prisma utk features lokal, import di sini
// import { prisma } from "@/lib/prisma";
import { mapFeatureRow } from "@/lib/map";

const UPSTREAM = process.env.FEATURES_UPSTREAM_BASE ?? "http://127.0.0.1:8000";
// ^ arahkan ke panel Laravel (bukan langsung warehouse) biar stabil:
// ex: http://127.0.0.1:8000/api/catalog/products

function abortableFetch(url: string, ms = 6000, init?: RequestInit) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...init, signal: ctrl.signal }).finally(() =>
        clearTimeout(t)
    );
}

export async function GET(
    req: NextRequest,
    { params }: { params: { code: string } }
) {
    const err = assertProductKey(req);
    if (err) return err;

    const code = String(params.code || "").toUpperCase();

    // 1) Try upstream (ke panel backend)
    try {
        const url = `${UPSTREAM}/api/catalog/products/${code}/features`;
        const r = await abortableFetch(url, 6000, {
            headers: { Accept: "application/json" },
        });

        if (r.ok) {
            const json = await r.json().catch(() => ({ data: [] }));
            const data = Array.isArray(json?.data)
                ? json.data.map(mapFeatureRow)
                : [];
            return Response.json({ data, source: "upstream" });
        }

        // Kalau upstream NON-200 (mis. 404) → fallback, JANGAN 502
        // console.warn(`[features] upstream non-200 ${r.status}`);
    } catch (e) {
        // console.warn(`[features] upstream error`, e);
    }

    // 2) Fallback (local) — kalau belum punya tabel fitur di product-app, kembalikan kosong
    //    Kalau ADA tabel lokal, kamu bisa ganti bagian ini ke query Prisma:
    //
    // const rows = await prisma.mstProductFeature.findMany({ where: { productCode: code } });
    // const data = rows.map(mapFeatureRow);
    //
    const data: any[] = [];
    return Response.json({ data, source: "fallback" }, { status: 200 });
}
