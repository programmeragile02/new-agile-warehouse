// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";// import * as jose from "jose";

// export async function GET(req: NextRequest) {
//   try {
//     const jwt = req.cookies.get("tb_token")?.value;
//     if (!jwt) return NextResponse.json({ ok: false }, { status: 401 });

//     const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
//     const { payload } = await jose.jwtVerify(jwt, secret);

//     const userId = (payload.sub as string) || (payload["id"] as string);
//     if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { id: true, username: true, role: true, name: true, phone: true, isActive: true },
//     });
//     if (!user || !user.isActive) return NextResponse.json({ ok: false }, { status: 401 });

//     return NextResponse.json({ ok: true, user });
//   } catch {
//     return NextResponse.json({ ok: false }, { status: 401 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { decodeCookie } from "@/lib/auth-session";
import * as jose from "jose";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const prisma = await db();
    try {
        // 1) Coba tb_session (HMAC)
        const s = decodeCookie<{ uid: string }>(
            req.cookies.get("tb_session")?.value ?? ""
        );
        let userId = s?.uid ?? null;

        // 2) Back-compat: JWT lama tb_token
        if (!userId) {
            const jwt = req.cookies.get("tb_token")?.value;
            if (jwt) {
                const secret = new TextEncoder().encode(
                    process.env.JWT_SECRET || "dev-secret"
                );
                const { payload } = await jose.jwtVerify(jwt, secret);
                userId =
                    (payload.sub as string) ||
                    (payload["id"] as string) ||
                    (payload["userId"] as string) ||
                    null;
            }
        }

        if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

        // Ambil prisma tenant
        // const productCode = process.env.NEXT_PUBLIC_PRODUCT_CODE!;
        // const { dbUrl } = getTenantContextOrThrow(productCode);
        // const prisma = prismaFor(dbUrl);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                role: true,
                name: true,
                phone: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive)
            return NextResponse.json({ ok: false }, { status: 401 });

        return NextResponse.json({ ok: true, user });
    } catch {
        return NextResponse.json({ ok: false }, { status: 401 });
    }
}
