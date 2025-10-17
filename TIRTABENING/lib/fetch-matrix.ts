// lib/fetch-matrix.ts
import "server-only";
import { cookies } from "next/headers";

/* ========= Types ========= */
export type MatrixMenu = {
    id: string;
    parent_id: string | null;
    level: number;
    type: "group" | "module" | "menu";
    title: string;
    icon?: string;
    color?: string;
    route_path?: string;
    order_number?: number;
    is_active?: boolean;
    product_code?: string;
    product_id?: string | null;
    crud_builder_id?: string | null;
};

export type MatrixFeature = {
    id: string;
    feature_code: string;
    name: string;
    description?: string;
    module_name?: string; // "" = global
    item_type: "FEATURE" | "SUBFEATURE";
    parent_id: string | null;
    parent_code?: string;
    is_active: boolean;
    order_number?: number;
    price_addon?: number;
    trial_available?: boolean;
    trial_days?: number | null;
    product_code: string;
};

export type MatrixPayload = {
    product?: string;
    offering?: string;
    menus?: MatrixMenu[];
    features?: MatrixFeature[];
};

/* ========= Helpers ========= */
function getProductCode(): string {
    return (
        process.env.NEXT_PUBLIC_PRODUCT_CODE ||
        process.env.PRODUCT_CODE ||
        "NATABANYU"
    );
}

function getOfferingFromCookie(): string {
    try {
        const v = cookies().get("tb_offering")?.value ?? "";
        return v.trim();
    } catch {
        return "";
    }
}

function getOffering(): string {
    // urutan prioritas
    return (
        getOfferingFromCookie() ||
        process.env.NEXT_PUBLIC_DEFAULT_OFFERING ||
        process.env.DEFAULT_OFFERING ||
        "basic"
    );
}

/** Bangun URL ke route internal produk. Jika tidak ada BASE, pakai relative path. */
function buildLocalUrl(path: string, params?: Record<string, string>) {
    const base =
        process.env.NEXT_PUBLIC_BASE ||
        process.env.NEXT_PUBLIC_SITE_URL || // lebih aman daripada VERCEL_URL (butuh protokol)
        "";

    const abs = base
        ? new URL(path, base.endsWith("/") ? base : base + "/")
        : new URL(path, "http://localhost/");
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v != null && v !== "") abs.searchParams.set(k, v);
        }
    }
    // tanpa BASE -> jadikan relative (biar cookies/headers konteks server tetap kepakai)
    return base
        ? abs.toString()
        : abs.toString().replace(/^https?:\/\/localhost\/?/, "/");
}

/* ========= MAIN ========= */
/**
 * Ambil matrix paket (menus, features) dari proxy route produk:
 *   /api/public/catalog/offerings/[product]/[offering]/matrix
 *
 * include: "menus" | "features" | "menus,features"
 * Fail-closed: jika upstream error → {menus:[], features:[]}
 */
export async function fetchMatrixInternal(
    include = "menus,features"
): Promise<MatrixPayload> {
    const product = getProductCode();
    const offering = getOffering();

    const url = buildLocalUrl(
        `/api/public/catalog/offerings/${encodeURIComponent(
            product
        )}/${encodeURIComponent(offering)}/matrix`,
        { include }
    );

    try {
        // forward cookies agar route internal tetap punya konteks (aman meski kini belum perlu)
        const cookieHeader = (() => {
            try {
                return cookies().toString();
            } catch {
                return "";
            }
        })();

        const res = await fetch(url, {
            cache: "no-store",
            headers: {
                Accept: "application/json",
                ...(cookieHeader ? { cookie: cookieHeader } : {}),
            },
        });

        const json: any = await res.json().catch(() => ({}));
        if (!res.ok || json?.ok === false) {
            return { product, offering, menus: [], features: [] };
        }

        const data = json?.data ?? json;
        const menus: MatrixMenu[] = Array.isArray(data?.menus)
            ? data.menus
            : [];
        const features: MatrixFeature[] = Array.isArray(data?.features)
            ? data.features
            : [];

        return { product, offering, menus, features };
    } catch {
        return { product, offering, menus: [], features: [] };
    }
}
