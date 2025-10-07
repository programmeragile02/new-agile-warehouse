// src/lib/auth-tokens.ts

export const TOKENS = {
    company: "rvx_company_token",
    user: "rvx_user_token",
    perms: "rvx_perms",
} as const;

export type AcmPerm = {
    menu_id: number;
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
};

// ============ Company Token ============
export function setCompanyToken(tok: string) {
    if (tok) localStorage.setItem(TOKENS.company, tok);
}
export function getCompanyToken(): string {
    return localStorage.getItem(TOKENS.company) || "";
}
export function clearCompanyToken() {
    localStorage.removeItem(TOKENS.company);
}

// ============== User Token =============
export function setUserToken(tok: string) {
    if (tok) localStorage.setItem(TOKENS.user, tok);
}
export function getUserToken(): string {
    return localStorage.getItem(TOKENS.user) || "";
}
export function clearUserToken() {
    localStorage.removeItem(TOKENS.user);
}

// ================ Perms ================
export function setPerms(perms: AcmPerm[] | any[]) {
    localStorage.setItem(TOKENS.perms, JSON.stringify(perms || []));
}
export function getPerms<A = AcmPerm[]>(): A {
    try {
        return JSON.parse(localStorage.getItem(TOKENS.perms) || "[]");
    } catch {
        return [] as unknown as A;
    }
}
export function clearPerms() {
    localStorage.removeItem(TOKENS.perms);
}

// ============ Clear Helpers ============
/** Logout user saja (tetap simpan company_token) */
export function clearUserAuth() {
    clearUserToken();
    clearPerms();
}
/** Logout company saja */
export function clearCompanyAuth() {
    clearCompanyToken();
}
/** Bersihkan semua (saat ganti perusahaan) */
export function clearAllAuth() {
    clearUserAuth();
    clearCompanyAuth();
}

// ============ Header Utilities =========
/** Kembalikan Authorization Bearer <token> bila ada */
export function authHeaders(typ: "company" | "user"): HeadersInit {
    const token = typ === "company" ? getCompanyToken() : getUserToken();
    return token
        ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
        : { Accept: "application/json" };
}
