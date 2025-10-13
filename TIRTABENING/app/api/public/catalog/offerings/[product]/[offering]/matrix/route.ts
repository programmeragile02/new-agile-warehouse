// app/api/public/catalog/offerings/[product]/[offering]/matrix/route.ts
// import { NextResponse } from "next/server";

// export async function GET(
//     req: Request,
//     { params }: { params: { product: string; offering: string } }
// ) {
//     const { product, offering } = params;
//     const url = new URL(req.url);
//     const include = url.searchParams.get("include") ?? ""; // "menus,features"

//     const base = process.env.WAREHOUSE_BASE || "http://localhost:9000/api";
//     const clientKey = process.env.WAREHOUSE_CLIENT_KEY || "";

//     const whUrl = new URL(
//         `/catalog/offerings/${encodeURIComponent(product)}/${encodeURIComponent(
//             offering
//         )}/matrix`,
//         base
//     );
//     if (include) whUrl.searchParams.set("include", include);

//     try {
//         const res = await fetch(whUrl.toString(), {
//             headers: {
//                 Accept: "application/json",
//                 ...(clientKey ? { "X-CLIENT-KEY": clientKey } : {}),
//             },
//             cache: "no-store",
//         });

//         const json = await res.json().catch(() => ({}));

//         if (!res.ok || json?.ok === false) {
//             const message =
//                 json?.message ||
//                 json?.error ||
//                 `Upstream error (${res.status} ${res.statusText})`;
//             return NextResponse.json(
//                 {
//                     ok: false,
//                     product,
//                     offering,
//                     error: message,
//                     upstream_status: res.status,
//                 },
//                 { status: res.status }
//             );
//         }

//         return NextResponse.json(
//             { ok: true, product, offering, data: json.data ?? json },
//             { status: 200 }
//         );
//     } catch (e: any) {
//         return NextResponse.json(
//             {
//                 ok: false,
//                 product,
//                 offering,
//                 error: e?.message || "Network error to Warehouse",
//             },
//             { status: 502 }
//         );
//     }
// }

// app/api/public/catalog/offerings/[product]/[offering]/matrix/route.ts
import { NextResponse } from "next/server";

type MatrixParams = { product: string; offering: string };

export async function GET(
    req: Request,
    ctx: { params: Promise<MatrixParams> } // ⬅️ params sekarang Promise
) {
    // ⬅️ WAJIB await sebelum dipakai
    const { product, offering } = await ctx.params;

    if (!product || !offering) {
        return NextResponse.json(
            { ok: false, error: "Missing product/offering params" },
            { status: 400 }
        );
    }

    const url = new URL(req.url);
    const include = url.searchParams.get("include") ?? "";

    const rawBase =
        process.env.WAREHOUSE_BASE_OFFERING || "http://localhost:9000/api";
    const base = rawBase.replace(/\/+$/, ""); // trim trailing slash
    const clientKey = process.env.WAREHOUSE_CLIENT_KEY || "";

    const path = `/catalog/offerings/${encodeURIComponent(
        product
    )}/${encodeURIComponent(offering)}/matrix`;
    const whUrl =
        base +
        path +
        (include ? `?include=${encodeURIComponent(include)}` : "");

    try {
        const res = await fetch(whUrl, {
            headers: {
                Accept: "application/json",
                ...(clientKey ? { "X-CLIENT-KEY": clientKey } : {}),
            },
            cache: "no-store",
        });

        // Upstream kadang balikin non-JSON saat error; jaga-jaga pakai try
        let json: any = {};
        try {
            json = await res.json();
        } catch {
            json = {};
        }

        if (!res.ok || json?.ok === false) {
            const message =
                json?.message ||
                json?.error ||
                `Upstream error (${res.status} ${res.statusText})`;

            return NextResponse.json(
                {
                    ok: false,
                    product,
                    offering,
                    error: message,
                    upstream_status: res.status,
                    upstream_url: whUrl,
                },
                { status: res.status }
            );
        }

        return NextResponse.json(
            { ok: true, product, offering, data: json.data ?? json },
            { status: 200 }
        );
    } catch (e) {
        const err = e as Error;
        return NextResponse.json(
            {
                ok: false,
                product,
                offering,
                error: err?.message || "Network error to Warehouse",
                upstream_url: whUrl,
            },
            { status: 502 }
        );
    }
}
