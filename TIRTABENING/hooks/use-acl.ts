"use client";

import { useEffect, useMemo, useState } from "react";

type AclMap = Record<
    string,
    { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }
>;

export function useAcl() {
    const [acl, setAcl] = useState<AclMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch("/api/acl/effective", {
                    cache: "no-store",
                });
                const j = await res.json();
                if (!res.ok || j?.ok === false) {
                    if (alive) {
                        setError(j?.error || "Gagal memuat ACL");
                        setAcl({});
                    }
                } else {
                    if (alive) setAcl(j.data || {});
                }
            } catch (e: any) {
                if (alive) {
                    setError(String(e.message || e));
                    setAcl({});
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const can = useMemo(() => {
        return (
            route: string,
            action: "view" | "add" | "edit" | "delete" = "view"
        ): boolean => {
            const norm = normalizePath(route);
            const hit =
                acl[norm] || acl[route] || acl[norm.replace(/\/+$/, "")];
            if (!hit) return false;
            switch (action) {
                case "view":
                    return !!hit.canView;
                case "add":
                    return !!hit.canAdd;
                case "edit":
                    return !!hit.canEdit;
                case "delete":
                    return !!hit.canDelete;
                default:
                    return false;
            }
        };
    }, [acl]);

    return { acl, can, loading, error };
}

function normalizePath(p: string) {
    if (!p) return "/";
    let s = p.trim();
    if (!s.startsWith("/")) s = "/" + s;
    if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
    return s;
}
