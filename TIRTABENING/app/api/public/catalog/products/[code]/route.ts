import { NextRequest } from "next/server";
import { assertProductKey } from "@/lib/auth-public";
import { productMeta, mapFeatureRow, mapMenuRow } from "@/lib/map";

export async function GET(
    req: NextRequest,
    { params }: { params: { code: string } }
) {
    const err = assertProductKey(req);
    if (err) return err;

    const code = String(params.code).toUpperCase();
    const meta = productMeta();
    if (meta.product_code.toUpperCase() !== code) {
        return new Response(JSON.stringify({ message: "Not found" }), {
            status: 404,
        });
    }
    return Response.json({ data: meta });
}
