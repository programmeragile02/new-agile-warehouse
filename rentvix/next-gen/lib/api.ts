export const API_URL = "http://localhost:8000/api";
import { authHeaders } from "@/lib/auth-tokens";

/* ========== Helpers ========== */
function isFileLike(v: any) {
    return (
        typeof File !== "undefined" && (v instanceof File || v instanceof Blob)
    );
}

function hasBinary(data: any): boolean {
    if (!data || typeof data !== "object") return false;
    return Object.values(data).some((v) => isFileLike(v));
}

/**
 * Hati-hati: JANGAN kirim 'foto' kalau bukan File/Blob.
 * Untuk object/array non-file tetap stringify.
 */
function toFormData(data: Record<string, any>): FormData {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
        if (v === undefined || v === null) return;

        // skip foto jika bukan File/Blob (hindari fail validasi image)
        if (k === "foto" && !isFileLike(v)) return;

        if (isFileLike(v)) {
            fd.append(k, v as Blob);
            return;
        }

        if (typeof v === "object") {
            fd.append(k, JSON.stringify(v));
            return;
        }

        fd.append(k, String(v));
    });
    return fd;
}

async function parseError(res: Response): Promise<never> {
    let msg = `HTTP ${res.status}`;
    try {
        const text = await res.text();
        if (text) {
            try {
                const j = JSON.parse(text);
                const base = j.message || msg;
                if (j.errors && typeof j.errors === "object") {
                    const parts = Object.entries(j.errors).flatMap(
                        ([field, arr]) => {
                            const vs = Array.isArray(arr) ? arr : [arr];
                            return vs.map((s: any) => `${field}: ${String(s)}`);
                        }
                    );
                    msg = parts.length
                        ? `${base} — ${parts.join(" | ")}`
                        : base;
                } else {
                    msg = base;
                }
            } catch {
                msg = text;
            }
        }
    } catch {}
    throw new Error(msg);
}

/* ========== Fetch list ========== */
export async function fetchData(
    entity: string,
    options?: { signal?: AbortSignal }
) {
    const res = await fetch(`${API_URL}/${entity}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: options?.signal,
    });
    if (!res.ok) return parseError(res);
    const response = await res.json();
    const rawData = Array.isArray(response) ? response : response.data;
    return rawData;
}

/* ========== Fetch paginated list (baru, untuk pagination server) ========== */
export async function fetchPaginatedData(
    entity: string,
    options?: {
        signal?: AbortSignal;
        params?: Record<string, any>; // { page, per_page, sort, order, ... }
    }
) {
    const url = new URL(`${API_URL}/${entity}`);
    if (options?.params) {
        Object.entries(options.params).forEach(([k, v]) => {
            if (v === undefined || v === null || v === "") return;
            url.searchParams.append(k, String(v));
        });
    }

    const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: options?.signal,
    });
    if (!res.ok) return parseError(res);

    // bentuk respon mengikuti controller: { success, message, total, data, meta, links }
    const j = await res.json();
    return j;
}

/* ========== Create (auto JSON/FormData) ========== */
export async function createData(entity: string, data: any) {
    const multipart = hasBinary(data);
    const res = await fetch(`${API_URL}/${entity}`, {
        method: "POST",
        headers: multipart
            ? { Accept: "application/json" }
            : {
                  "Content-Type": "application/json",
                  Accept: "application/json",
              },
        body: multipart ? toFormData(data) : JSON.stringify(data),
    });
    if (!res.ok) return parseError(res);
    return await res.json();
}

/* ========== Get by id ========== */
export async function getDataById(entity: string, id: string | number) {
    const res = await fetch(`${API_URL}/${entity}/${id}`, {
        headers: { Accept: "application/json" },
    });
    if (!res.ok) return parseError(res);
    const response = await res.json();
    return response.data || response;
}

/* ========== Update (auto JSON/FormData) ========== */
export async function updateData(
    entity: string,
    id: string | number,
    data: any
) {
    const multipart = hasBinary(data);

    if (multipart) {
        // *** Kunci perbaikan ***
        // Kirim POST + spoof _method=PUT agar file kebaca di Laravel
        const fd = toFormData(data);
        fd.append("_method", "PUT");

        const res = await fetch(`${API_URL}/${entity}/${id}`, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: fd,
        });
        if (!res.ok) return parseError(res);
        return await res.json();
    } else {
        // Tanpa file, boleh PUT JSON biasa
        // BONUS: jangan kirim 'foto' kalau hanya string path lama
        const payload = { ...data };
        if ("foto" in payload && typeof payload.foto === "string")
            delete payload.foto;

        const res = await fetch(`${API_URL}/${entity}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) return parseError(res);
        return await res.json();
    }
}

/* ========== Delete ========== */
export async function deleteData(
    entity: string,
    id: string | number
): Promise<void> {
    const res = await fetch(`${API_URL}/${entity}/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
    });
    if (!res.ok) return parseError(res);
    return await res.json();
}

export async function deletedData(entity: string) {
    const res = await fetch(`${API_URL}/${entity}-deleted`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    return res.json();
}

export async function restore(entity: string, id: string) {
    const res = await fetch(`${API_URL}/${entity}/restore/${id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    return res.json();
}

export async function forceDelete(entity: string, id: string) {
    const res = await fetch(`${API_URL}/${entity}/force/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    });
    return res.json();
}

export async function fetchStats(entity: string) {
    const res = await fetch(`${API_URL}/${entity}/stats`, {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`Gagal mengambil statistik untuk ${entity}`);
    }

    const response = await res.json();

    return response.data ?? response;
}
export async function syncAccessControlMatrix(
    user_level_id: string | number,
    items: Array<{
        menu_id: string | number;
        view: boolean;
        add: boolean;
        edit: boolean;
        delete: boolean;
        approve: boolean;
    }>
) {
    const res = await fetch(`${API_URL}/access_control_matrices/sync`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({ user_level_id, items }),
    });
    if (!res.ok) return parseError(res);
    return await res.json();
}

/* ========== Export Excel (Backend) ========== */

export type ExportExcelParams = {
    // metadata tanda tangan & header
    city?: string;
    approved_by_name?: string;
    approved_by_title?: string;
    approved_date?: string; // format bebas, contoh: "16/08/2025"

    // filter opsional (sesuaikan dengan controllermu)
    search?: string;
    status?: string;

    // kalau pakai auth cookie/session, set true agar kirim credentials
    withCredentials?: boolean;
};

/** Utility: bikin query string tapi skip undefined/null */
function toQuery(params: Record<string, any> = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        qs.append(k, String(v));
    });
    const s = qs.toString();
    return s ? `?${s}` : "";
}

/**
 * Ambil file Excel sebagai Blob dari backend.
 * Contoh pakai:
 *   const blob = await exportExcel('vehicles', { city: 'Jakarta' });
 */
export async function exportExcel(
    entityPlural: string,
    params: ExportExcelParams = {}
): Promise<Blob> {
    const { withCredentials, ...rest } = params;
    const url = `${API_URL}/${entityPlural}/export-excel${toQuery(rest)}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        credentials: withCredentials ? "include" : "same-origin",
    });

    if (!res.ok) return parseError(res);
    return await res.blob();
}

/**
 * Shortcut: langsung download ke file .xlsx
 * Contoh pakai:
 *   await downloadExcel('vehicles', { city: 'Jakarta' }, 'Vehicles_Export.xlsx');
 */
export async function downloadExcel(
    entityPlural: string,
    params: ExportExcelParams = {},
    filename?: string
) {
    const blob = await exportExcel(entityPlural, params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
        filename ||
        `${entityPlural.replace(/-/g, "_")}_${new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:T]/g, "")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}

/** (opsional) hanya membentuk URL jika kamu butuh dipakai di <a href> */
export function getExportExcelUrl(
    entityPlural: string,
    params: ExportExcelParams = {}
) {
    return `${API_URL}/${entityPlural}/export-excel${toQuery(params)}`;
}

/* ========== Export PDF ========== */

export type ExportPdfParams = {
    // metadata tanda tangan & header
    approver_name?: string;
    approver_title?: string;
    approver_date?: string;
    place?: string;

    // filter opsional (sesuaikan dengan controller
    search?: string;
    status?: string;
    columns?: string; // contoh: "plate_number,brand,year"

    limit?: number;

    // kalau pakai auth cookie/session, set true agar kirim credentials
    withCredentials?: boolean;
};

export async function exportPdf(
    entityPlural: string,
    params: ExportPdfParams = {}
): Promise<Blob> {
    const { withCredentials, ...rest } = params;
    const qs = new URLSearchParams();
    Object.entries(rest).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        qs.append(k, String(v));
    });

    const url = `${API_URL}/${entityPlural}/export-pdf${
        qs.toString() ? `?${qs.toString()}` : ""
    }`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/pdf",
        },
        credentials: withCredentials ? "include" : "same-origin",
    });

    if (!res.ok) return parseError(res);
    return await res.blob();
}

/** Shortcut: langsung download ke file .pdf */
export async function downloadPdf(
    entityPlural: string,
    params: ExportPdfParams = {},
    filename?: string
) {
    const blob = await exportPdf(entityPlural, params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
        filename ||
        `${entityPlural.replace(/-/g, "_")}_${new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:T]/g, "")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}

/** (opsional) hanya membentuk URL jika mau dipakai di <a href> */
export function getExportPdfUrl(
    entityPlural: string,
    params: ExportPdfParams = {}
) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        qs.append(k, String(v));
    });
    return `${API_URL}/pdf/${entityPlural}${
        qs.toString() ? `?${qs.toString()}` : ""
    }`;
}

export async function saveAccessControlMatrixBulk(
    userLevelId: string | number,
    rows: {
        id: number | string;
        view: boolean;
        add: boolean;
        edit: boolean;
        delete: boolean;
        approve: boolean;
    }[]
) {
    const items = rows.map((r) => ({
        menu_id: Number(r.id), // ⬅️ wajib numerik
        view: !!r.view,
        add: !!r.add,
        edit: !!r.edit,
        delete: !!r.delete,
        approve: !!r.approve,
    }));

    const res = await fetch(`${API_URL}/access_control_matrices/bulk`, {
        method: "POST",
        cache: "no-store",
        next: { revalidate: 0 },
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
        },
        body: JSON.stringify({ user_level_id: Number(userLevelId), items }),
    });

    if (!res.ok) {
        let msg = await res.text().catch(() => "");
        try {
            msg = JSON.parse(msg).message || msg;
        } catch {}
        throw new Error(msg || "Gagal menyimpan izin (bulk).");
    }
    return res.json(); // { success, data: [...] }
}

/** pastikan path selalu diawali "/" */
function withLeadingSlash(path: string) {
    if (!path) return "/";
    return path.startsWith("/") ? path : `/${path}`;
}

/** Normalisasi URL supaya tidak jadi "/api/api/..." dan tidak ada double slash */
function normalizeApiPath(path: string) {
    // Jika sudah full URL, jangan diprefix ulang
    if (/^https?:\/\//i.test(path)) return path;

    // Buang trailing slash pada API_URL
    const base = API_URL.replace(/\/+$/, "");
    // Pastikan path diawali slash tunggal
    let p = withLeadingSlash(path);

    // Jika base berakhiran "/api" dan path juga diawali "/api/", hapus "/api" di depan path
    const ENDS_WITH_API = base.toLowerCase().endsWith("/api");
    const STARTS_WITH_API = p.toLowerCase().startsWith("/api/");
    if (ENDS_WITH_API && STARTS_WITH_API) {
        p = p.slice(4); // buang "/api" di depan path
    }

    // Karena base sudah tanpa trailing slash dan p sudah diawali satu slash, cukup gabungkan
    return `${base}${p}`;
}

type ApiTyp = "company" | "user";

export async function apiFetch(
    path: string,
    init: RequestInit = {},
    typ?: ApiTyp
) {
    const isJsonBody =
        !!init.body &&
        typeof init.body === "string" &&
        (init.headers as any)?.["Content-Type"] !==
            "application/x-www-form-urlencoded" &&
        (init.headers as any)?.["Content-Type"] !== "multipart/form-data";

    const baseHeaders: HeadersInit = {
        Accept: "application/json",
        ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
    };

    const hdrFromInit = init.headers ?? {};
    const hdrFromAuth = typ ? authHeaders(typ) : {};

    const headers: HeadersInit = {
        ...baseHeaders,
        ...(typeof hdrFromInit === "object" ? hdrFromInit : {}),
        ...hdrFromAuth,
    };

    const url = normalizeApiPath(path);

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15000);

    const doFetch = async () =>
        fetch(url, {
            mode: "cors",
            cache: "no-store",
            ...init,
            headers,
            signal: ac.signal,
            credentials: "same-origin",
        });

    let res: Response;
    try {
        res = await doFetch();
    } catch {
        try {
            res = await doFetch(); // retry sekali untuk error jaringan
        } catch (err) {
            clearTimeout(t);
            throw err;
        }
    }
    clearTimeout(t);

    if (!res) throw new Error("Network error: empty response from server");

    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const text = await res.text();
            if (text) {
                try {
                    const j = JSON.parse(text);
                    msg = j.message ?? j.error ?? text ?? msg;
                } catch {
                    msg = text;
                }
            }
        } catch {}
        const err = new Error(msg);
        (err as any).status = res.status;
        throw err;
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        return res.json();
    }
    return res; // non-JSON (file, dsb.)
}

// Ambil tree menu dari backend (sudah ada versi kamu—pakai ini kalau belum)
export async function fetchMenusTree(params?: {
    product_code?: string;
    include_inactive?: boolean;
    level_id?: string | number; // <-- tambahan
}) {
    const url = new URL(`${API_URL}/menus/tree`);
    if (params?.product_code)
        url.searchParams.set("product_code", String(params.product_code));
    if (params?.include_inactive) url.searchParams.set("include_inactive", "1");
    if (params?.level_id != null)
        url.searchParams.set("level_id", String(params.level_id));

    const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });
    if (!res.ok) return parseError(res);
    const j = await res.json();
    return Array.isArray(j) ? j : j.data ?? [];
}

/** Ambil semua ACM lalu saring di FE — fallback jika server belum prune */
export async function fetchPermsForLevel(levelId: string | number) {
    const res = await fetch(`${API_URL}/access_control_matrices`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });
    if (!res.ok) return parseError(res);
    const j = await res.json();
    const rows = Array.isArray(j) ? j : j.data ?? [];
    return rows.filter((r: any) => String(r.user_level_id) === String(levelId));
}
