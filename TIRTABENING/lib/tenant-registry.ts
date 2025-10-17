import "server-only";

export type TenantInfo = {
    companyId: string;
    productCode: string;
    dbUrl: string;
    packageCode?: string;
    appUrl?: string;
    subscriptionInstanceId?: string;
};

function apiBase(): string {
    const api = (process.env.WAREHOUSE_API || "").trim(); // ex: http://localhost:9000/api
    if (api) return api.replace(/\/+$/, "");
    const base = (process.env.WAREHOUSE_BASE || "").trim(); // ex: http://localhost:9000
    if (!base) throw new Error("WAREHOUSE_BASE/WAREHOUSE_API missing");
    return `${base.replace(/\/+$/, "")}/api`;
}

function apiKey(): string {
    const key = (process.env.WAREHOUSE_API_KEY || "").trim();
    if (!key) throw new Error("WAREHOUSE_API_KEY missing");
    return key;
}

/** Legacy resolver (tanpa password) – masih dipakai untuk kebutuhan non-login */
export async function resolveTenant(
    companyId: string,
    productCode: string
): Promise<TenantInfo | null> {
    const url = `${apiBase()}/tenants/resolve?company_id=${encodeURIComponent(
        companyId
    )}&product_code=${encodeURIComponent(productCode)}`;
    const res = await fetch(url, {
        headers: { "X-API-KEY": apiKey(), Accept: "application/json" },
        cache: "no-store",
    });
    if (!res.ok) return null;
    const j = await res.json().catch(() => null);
    if (!j?.ok) return null;
    return {
        companyId: j.data.company_id,
        productCode: j.data.product_code,
        dbUrl: j.data.db_url,
        packageCode: j.data.package_code ?? undefined,
        appUrl: j.data.app_url ?? undefined,
        subscriptionInstanceId: j.data.subscription_instance_id ?? undefined,
    };
}

/** NEW: Auth resolver (WAJIB password) – gunakan ini di proses login company */
export async function resolveTenantAuth(
    companyId: string,
    productCode: string,
    companyPassword: string
): Promise<TenantInfo | null> {
    const url = `${apiBase()}/tenant/resolve-auth`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey(),
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            company_id: String(companyId),
            product_code: String(productCode),
            company_password: companyPassword,
        }),
        cache: "no-store",
    });

    if (!res.ok) return null;
    const j = await res.json().catch(() => null);
    if (!j?.ok) return null;

    return {
        companyId: j.data.company_id,
        productCode: j.data.product_code,
        dbUrl: j.data.db_url,
        packageCode: j.data.package_code ?? undefined,
        appUrl: j.data.app_url ?? undefined,
        subscriptionInstanceId: j.data.subscription_instance_id ?? undefined,
    };
}

/**
 * NEW: Login resolver (email + password → TenantInfo).
 * Server Warehouse memvalidasi ke tabel customer_product_instance_users,
 * lalu mengembalikan company_id dan db_url dari customer_product_instances.
 */
export async function resolveLoginByEmail(
    email: string,
    password: string,
    productCode = process.env.NEXT_PUBLIC_PRODUCT_CODE || "NATABANYU"
): Promise<
    | { ok: true; data: TenantInfo }
    | { ok: false; status: number; message: string }
> {
    const url = `${apiBase()}/tenant/resolve-login`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey(),
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            product_code: String(productCode),
            email: String(email).toLowerCase().trim(),
            password: String(password),
        }),
        cache: "no-store",
    }).catch(() => null as any);

    if (!res)
        return {
            ok: false,
            status: 503,
            message: "Tidak bisa menghubungi Warehouse",
        };
    const j = await res.json().catch(() => ({}));

    if (res.ok && j?.ok && j?.data) {
        const d = j.data;
        return {
            ok: true,
            data: {
                companyId: d.company_id,
                productCode: d.product_code,
                dbUrl: d.db_url,
                packageCode: d.package_code ?? undefined,
                appUrl: d.app_url ?? undefined,
                subscriptionInstanceId: d.subscription_instance_id ?? undefined,
            },
        };
    }
    return {
        ok: false,
        status: res.status || 500,
        message: j?.error || "Login gagal",
    };
}

export async function syncUserPasswordToWarehouse(params: {
    productCode?: string;
    email: string;
    newPassword: string;
    companyId?: string;
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
    const url = `${apiBase()}/tenant/sync-user-password`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey(),
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            product_code:
                params.productCode ||
                process.env.NEXT_PUBLIC_PRODUCT_CODE ||
                "NATABANYU",
            email: String(params.email).toLowerCase().trim(),
            new_password: params.newPassword,
            company_id: params.companyId || undefined,
        }),
        cache: "no-store",
    }).catch(() => null as any);

    if (!res)
        return {
            ok: false,
            status: 503,
            message: "Warehouse tidak dapat dihubungi",
        };
    const j = await res.json().catch(() => ({}));

    if (res.ok && j?.ok) return { ok: true };
    return {
        ok: false,
        status: res.status || 500,
        message: j?.error || "Sync gagal",
    };
}
