// import { NextRequest, NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import { resolveTenant } from "@/lib/tenant-registry";
// import { prismaFor } from "@/lib/prisma-tenant";
// import { encodeCookie } from "@/lib/auth-session";
// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const companyId: string = String(body?.companyId ?? "").trim();
//     const password: string = String(body?.password ?? "");
//     const remember: boolean = !!body?.remember;

//     const productCode = process.env.NEXT_PUBLIC_PRODUCT_CODE!;
//     if (!companyId || !password) {
//       return NextResponse.json(
//         { ok: false, message: "Invalid body" },
//         { status: 400 }
//       );
//     }

//     const tenant = await resolveTenant(companyId, productCode);
//     if (!tenant)
//       return NextResponse.json(
//         { ok: false, message: "Company tidak ditemukan" },
//         { status: 404 }
//       );

//     const prisma = prismaFor(tenant.dbUrl);
//     const company = await prisma.mstCompany.findUnique({
//       where: { company_id: companyId },
//       select: { company_id: true, password: true },
//     });
//     if (!company)
//       return NextResponse.json(
//         { ok: false, message: "Company belum siap" },
//         { status: 404 }
//       );

//     const ok = await bcrypt.compare(password, company.password);
//     if (!ok)
//       return NextResponse.json(
//         { ok: false, message: "Password company salah" },
//         { status: 401 }
//       );

//     const tenantCookie = encodeCookie({
//       companyId: tenant.companyId,
//       productCode: tenant.productCode,
//       dbUrl: tenant.dbUrl,
//       packageCode: tenant.packageCode,
//     });

//     const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 4; // 30 hari vs 4 jam

//     const res = NextResponse.json({ ok: true });
//     res.cookies.set("tb_tenant", tenantCookie, {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: process.env.NODE_ENV === "production",
//       path: "/",
//       maxAge,
//     });
//     return res;
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, message: e?.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }

// app/api/auth/company-login/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant-registry";
import { encodeCookie } from "@/lib/auth-session";

const PRODUCT_CODE = process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING";

export async function POST(req: Request) {
  try {
    const { companyId, companyPassword } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { ok: false, message: "Company ID wajib diisi" },
        { status: 422 }
      );
    }

    // 1) Resolve ke Warehouse via helper kamu
    const info = await resolveTenant(String(companyId).toUpperCase(), PRODUCT_CODE);
    if (!info) {
      return NextResponse.json(
        { ok: false, message: "Company tidak ditemukan / tidak aktif" },
        { status: 404 }
      );
    }

    // (opsional) kalau ingin verifikasi company password di Warehouse,
    // sediakan endpoint terpisah. Untuk sekarang kita skip & cukup resolve.

    // 2) Set cookie tenant (format yang diharapkan lib/tenant-context.ts)
    const tenantPayload = {
      companyId: info.companyId,
      productCode: info.productCode,
      dbUrl: info.dbUrl,                  // <— ini yang nanti dibaca db()
      packageCode: info.packageCode,
    };

    const res = NextResponse.json({
      ok: true,
      tenant: { companyId: info.companyId, productCode: info.productCode },
    });

    res.cookies.set("tb_tenant", encodeCookie(tenantPayload), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 hari
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
