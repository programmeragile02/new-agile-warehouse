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
            company_id: String(companyId).toUpperCase(),
            product_code: String(productCode).toUpperCase(),
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
