export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prismaFor } from "@/lib/prisma-tenant";
import { encodeCookie } from "@/lib/auth-session";
import jwt from "jsonwebtoken";
import { resolveLoginByEmail } from "@/lib/tenant-registry";

const WAREHOUSE_API =
    process.env.WAREHOUSE_API ||
    process.env.WAREHOUSE_BASE ||
    "http://localhost:9000";
const WAREHOUSE_KEY = process.env.WAREHOUSE_API_KEY || "dev-panel-key-abc";

const PKG_TO_OFFERING: Record<string, string> = {
    BASIC: "basic",
    PREMIUM: "premium",
    PROFESSIONAL: "professional",
};

function normalizeOffering(code?: string | null) {
    const key = String(code || "").toUpperCase();
    return PKG_TO_OFFERING[key] || "basic";
}

async function fetchAddons(instanceId?: string): Promise<string[]> {
    if (!instanceId) return [];
    const url = `${String(WAREHOUSE_API).replace(
        /\/+$/,
        ""
    )}/subscriptions/${encodeURIComponent(instanceId)}/features`;
    const res = await fetch(url, {
        headers: { "X-API-KEY": WAREHOUSE_KEY, Accept: "application/json" },
        cache: "no-store",
    }).catch(() => null as any);
    if (!res || !res.ok) return [];
    const json = await res.json().catch(() => ({}));
    return (json?.features || [])
        .filter(
            (f: any) =>
                (f?.enabled ?? true) &&
                String(f?.source || "").toLowerCase() === "addon"
        )
        .map((f: any) =>
            String(f?.code || f?.feature_code || "")
                .trim()
                .toLowerCase()
        )
        .filter(Boolean);
}

async function fetchExtraCustomers(companyId: string): Promise<number> {
    try {
        const url = `${String(WAREHOUSE_API).replace(
            /\/+$/,
            ""
        )}/api/company/entitlements`;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": WAREHOUSE_KEY,
            },
            body: JSON.stringify({
                company_id: companyId,
                product_code: "NATABANYU",
            }), // sesuaikan PRODUCT_CODE jika dynamic
        });
        if (!res.ok) return 0;
        const json = await res.json();
        const ent = Array.isArray(json?.entitlements) ? json.entitlements : [];
        const extra = ent.find(
            (e: any) => (e?.code || "").toLowerCase() === "extra.customers"
        );
        const num = Number(
            extra?.value_number ?? extra?.value ?? extra?.value_string
        );
        return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
    } catch {
        return 0;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const email = String(body?.email || body?.username || "")
            .toLowerCase()
            .trim();
        const password = String(body?.password || "").trim();

        if (!email)
            return NextResponse.json(
                { ok: false, message: "Email wajib diisi" },
                { status: 422 }
            );
        if (!password)
            return NextResponse.json(
                { ok: false, message: "Password wajib diisi" },
                { status: 422 }
            );

        // 1) Resolve + verify di Warehouse (CPIU)
        const resolved = await resolveLoginByEmail(email, password);
        if (!resolved.ok) {
            return NextResponse.json(
                { ok: false, message: resolved.message },
                { status: resolved.status }
            );
        }
        const info = resolved.data;

        // 2) Ambil profil user dari tenant (username = email)
        const prisma = prismaFor(info.dbUrl);
        const user = await prisma.user.findUnique({
            where: { username: email, deletedAt: null, isActive: true },
        });
        if (!user || user.deletedAt || !user.isActive) {
            return NextResponse.json(
                { ok: false, message: "Akun tidak aktif" },
                { status: 403 }
            );
        }

        const extraCustomers = await fetchExtraCustomers(info.companyId);
        const offering = normalizeOffering(info.packageCode);
        const addons = await fetchAddons(info.subscriptionInstanceId);
        const requirePasswordChange = !!user.mustChangePassword;

        // 3) Set cookies
        const res = NextResponse.json({
            ok: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
            },
            tenant: {
                companyId: info.companyId,
                productCode: info.productCode,
            },
            offering,
            requirePasswordChange,
        });

        res.cookies.set(
            "tb_tenant",
            encodeCookie({
                companyId: info.companyId,
                productCode: info.productCode,
                dbUrl: info.dbUrl,
                packageCode: info.packageCode,
            }),
            {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24 * 30,
            }
        );

        res.cookies.set(
            "tb_session",
            encodeCookie({
                uid: user.id,
                uname: user.username,
                role: user.role,
                companyId: info.companyId,
            }),
            {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 8,
            }
        );

        const token = jwt.sign(
            { sub: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || "supersecret",
            { expiresIn: "1d" }
        );
        res.cookies.set("tb_token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        res.cookies.set("tb_company", info.companyId, {
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });
        res.cookies.set("tb_offering", offering, {
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });
        if (addons.length) {
            res.cookies.set(
                `tb_addons__${info.companyId}`,
                JSON.stringify(addons),
                {
                    httpOnly: false,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60,
                }
            );
        }

        // extra pelanggan
        res.cookies.set("tb_addons", String(extraCustomers), {
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60,
        });

        if (!requirePasswordChange) {
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
        }

        return res;
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
