"use client";
import { useEffect, useState } from "react";

type AclAction = "view" | "add" | "edit" | "delete";

export function PermissionGate({
    path,
    action = "view",
    children,
    fallback = null,
    loadingFallback = null,
}: {
    path: string;
    action?: AclAction;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    loadingFallback?: React.ReactNode;
}) {
    const [state, setState] = useState<"loading" | "allow" | "deny">("loading");

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const qs = new URLSearchParams({ path, action });
                const res = await fetch("/api/acl/check?" + qs.toString(), {
                    cache: "no-store",
                });
                const j = await res.json();
                if (!mounted) return;
                setState(j?.ok && j?.allowed ? "allow" : "deny");
            } catch {
                if (!mounted) return;
                setState("deny");
            }
        })();
        return () => {
            mounted = false;
        };
    }, [path, action]);

    if (state === "loading") return <>{loadingFallback}</>;
    if (state === "deny") return <>{fallback}</>;
    return <>{children}</>;
}
