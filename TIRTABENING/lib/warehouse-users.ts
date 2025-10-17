// import "server-only";

// const PRODUCT_CODE = process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING";
// const DEBUG = (process.env.DEBUG_WAREHOUSE || "").toLowerCase() === "1";

// function apiBase(): string {
//     const api = (process.env.WAREHOUSE_API || "").trim(); // ex: http://localhost:9000/api
//     if (api) return api.replace(/\/+$/, "");
//     const base = (process.env.WAREHOUSE_BASE || "").trim(); // ex: http://localhost:9000
//     if (!base) throw new Error("WAREHOUSE_BASE/WAREHOUSE_API missing");
//     return `${base.replace(/\/+$/, "")}/api`;
// }
// function apiKey(): string {
//     const key = (process.env.WAREHOUSE_API_KEY || "").trim();
//     if (!key) throw new Error("WAREHOUSE_API_KEY missing");
//     return key;
// }

// async function callWarehouse(path: string, payload: Record<string, any>) {
//     const url = `${apiBase()}${path.startsWith("/") ? "" : "/"}${path}`;
//     const body = JSON.stringify(payload);

//     if (DEBUG) {
//         console.log("[WH DEBUG] →", url);
//         console.log("[WH DEBUG] payload:", body);
//     }

//     const res = await fetch(url, {
//         method: "POST",
//         headers: {
//             "X-API-KEY": apiKey(),
//             "Content-Type": "application/json",
//             Accept: "application/json",
//             "X-Requested-By": "tb-app",
//         },
//         body,
//         cache: "no-store",
//     });

//     const text = await res.text().catch(() => "");
//     if (DEBUG) {
//         console.log("[WH DEBUG] ← status:", res.status);
//         console.log("[WH DEBUG] ← body:", text);
//     }

//     if (!res.ok) {
//         // biar mudah dicari di log server Next
//         throw new Error(`[WAREHOUSE ERROR] ${res.status} ${url} ${text}`);
//     }

//     try {
//         return JSON.parse(text);
//     } catch {
//         return { ok: true, raw: text };
//     }
// }

// /**
//  * Upsert CPIU — kontrak seragam dengan Warehouse:
//  * {
//  *   product_code, company_id, email, password?, is_active?
//  * }
//  * - password opsional (kalau update tanpa ganti password, cukup kirim is_active)
//  */
// export async function warehouseUpsertCpiu(params: {
//     email: string;
//     companyId: string;
//     password?: string;
//     isActive?: boolean;
// }) {
//     const payload: any = {
//         product_code: PRODUCT_CODE,
//         email: params.email,
//         company_id: params.companyId,
//     };
//     if (typeof params.isActive === "boolean")
//         payload.is_active = params.isActive;
//     if (params.password) payload.password = params.password;

//     return callWarehouse("/tenant/sync-user", payload);
// }

// /** Helper set aktif/nonaktif (pakai upsert juga) */
// export async function warehouseSetCpiuActive(params: {
//     email: string;
//     companyId: string;
//     isActive: boolean;
// }) {
//     return warehouseUpsertCpiu({
//         email: params.email,
//         companyId: params.companyId,
//         isActive: params.isActive,
//     });
// }

// lib/warehouse-users.ts
import "server-only";

const PRODUCT_CODE = process.env.NEXT_PUBLIC_PRODUCT_CODE || "NATABANYU";

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

/** Upsert CPIU (product_code + email unik). */
export async function warehouseUpsertCpiu(params: {
    email: string;
    companyId: string;
    passwordPlain?: string | null;
    passwordHash?: string | null;
    isActive?: boolean;
}) {
    const url = `${apiBase()}/tenant/sync-user`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey(),
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            product_code: PRODUCT_CODE,
            email: params.email,
            company_id: params.companyId,
            password_plain: params.passwordPlain ?? undefined,
            password_hash: params.passwordHash ?? undefined,
            is_active:
                typeof params.isActive === "boolean"
                    ? params.isActive
                    : undefined,
        }),
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `[WAREHOUSE ERROR] ${res.status} ${url} ${text || ""}`.trim()
        );
    }
    return res.json().catch(() => ({}));
}

export async function warehouseSetCpiuActive(params: {
    email: string;
    companyId: string;
    isActive: boolean;
}) {
    const url = `${apiBase()}/tenant/sync-user`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey(),
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            product_code: PRODUCT_CODE,
            email: params.email,
            company_id: params.companyId,
            is_active: params.isActive,
        }),
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `[WAREHOUSE ERROR] ${res.status} ${url} ${text || ""}`.trim()
        );
    }
    return res.json().catch(() => ({}));
}
