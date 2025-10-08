"use client";
import { ReactNode } from "react";
import { useEntitlements } from "./entitlements-provider";

type Mode = "any" | "all";

export function FeatureGate({
    code,
    children,
    fallback,
    mode = "any",
}: {
    code: string | string[];
    children: ReactNode;
    fallback?: ReactNode;
    mode?: Mode; // any: salah satu ada, all: semua harus ada
}) {
    const { loading, canFeature, canAnyFeature } = useEntitlements();
    if (loading) return <>{fallback ?? null}</>;

    const ok = Array.isArray(code)
        ? mode === "all"
            ? code.every(canFeature)
            : canAnyFeature(code)
        : canFeature(code);

    return ok ? <>{children}</> : <>{fallback ?? null}</>;
}
