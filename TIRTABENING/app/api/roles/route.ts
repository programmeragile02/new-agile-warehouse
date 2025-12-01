import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Plan helper
function getPlanFromReq(req: NextRequest): string | null {
    // dukung tb_offering (premium/professional/basic)
    for (const key of ["tb_offering", "tb_plan", "tb_package"]) {
        const v = req.cookies.get(key)?.value;
        if (v && v.trim()) return v.toUpperCase();
    }
    for (const key of ["x-plan", "x-package"]) {
        const v = req.headers.get(key);
        if (v && v.trim()) return v.toUpperCase();
    }

    if (process.env.COMPANY_PLAN) {
        return process.env.COMPANY_PLAN.toUpperCase();
    }

    return null;
}

// limit role per paket
const RoleTierLimit: Record<string, number> = {
    BASIC: 3,
    PREMIUM: 4,
    PROFESSIONAL: 6,
};

function resolveMaxRoles(planHint?: string | null): {
    planCode: string;
    maxRoles: number;
} {
    const hint = (
        planHint ||
        process.env.COMPANY_PLAN ||
        "BASIC"
    ).toUpperCase();

    if (RoleTierLimit[hint]) {
        return { planCode: hint, maxRoles: RoleTierLimit[hint] };
    }

    // fallback kalau paket tidak dikenal
    return { planCode: "BASIC", maxRoles: RoleTierLimit.BASIC };
}

export async function GET(req: NextRequest) {
    try {
        const prisma = await db();
        const roles = await prisma.appRole.findMany({
            orderBy: { createdAt: "asc" },
        });

        const planHint = getPlanFromReq(req);
        const { planCode, maxRoles } = resolveMaxRoles(planHint);

        const used = roles.length;
        const max = maxRoles;
        const remaining = Math.max(0, max - used);

        const readablePlan =
            planCode === "BASIC"
                ? "Basic"
                : planCode === "PREMIUM"
                ? "Premium"
                : planCode === "PROFESSIONAL"
                ? "Professional"
                : planCode;

        return NextResponse.json({
            ok: true,
            data: roles,
            quota: {
                used,
                max,
                remaining,
                planCode: readablePlan,
            },
        });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const prisma = await db();
        const body = await req.json();
        const name = String(body.name || "").trim();
        const description = (body.description ?? "").toString().trim() || null;

        if (!name) {
            return NextResponse.json(
                { ok: false, error: "Nama role wajib diisi" },
                { status: 400 }
            );
        }

        // === Ambil paket dari cookie/header/env (sama konsepnya dengan pelanggan)
        const planHint = getPlanFromReq(req);
        const { planCode, maxRoles } = resolveMaxRoles(planHint);

        const currentCount = await prisma.appRole.count();

        if (currentCount >= maxRoles) {
            const readablePlan =
                planCode === "BASIC"
                    ? "Basic"
                    : planCode === "PREMIUM"
                    ? "Premium"
                    : planCode === "PROFESSIONAL"
                    ? "Professional"
                    : planCode;

            return NextResponse.json(
                {
                    ok: false,
                    code: "ROLE_QUOTA_EXCEEDED",
                    error: `Maksimal ${maxRoles} role yang bisa dibuat untuk paket ${readablePlan}. Silakan hapus role yang tidak dipakai atau upgrade paket.`,
                    meta: {
                        planCode: readablePlan,
                        used: currentCount,
                        max: maxRoles,
                        remaining: Math.max(0, maxRoles - currentCount),
                    },
                },
                { status: 403 }
            );
        }

        const role = await prisma.appRole.create({
            data: {
                name,
                description,
                isActive: body.isActive ?? true,
            },
        });

        return NextResponse.json({ ok: true, data: role }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}
