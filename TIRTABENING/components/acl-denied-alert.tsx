"use client";

import * as React from "react";
import { cn } from "@/lib/utils"; // jika belum punya util cn, ganti dengan className join manual
import { Button } from "@/components/ui/button";
import {
    ShieldOff,
    ArrowLeft,
    RefreshCw,
    LifeBuoy,
    LockKeyhole,
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "./glass-card";

/* ===========================================================
   AclDeniedAlert
   -----------------------------------------------------------
   • Tampil apik sebagai full section atau inline card
   • Warna & gaya selaras tema (glass, subtle gradient)
   • Tombol aksi: kembali, muat ulang, bantuan
   • Props:
     - path, action: info teknis (opsional, untuk debug/teks)
     - title, message: custom copy
     - fullPage: true -> center screen
     - className: tailwind override
   =========================================================== */

type AclAction = "view" | "add" | "edit" | "delete";

export function AclDeniedAlert({
    path,
    action = "view",
    title = "Anda tidak memiliki izin",
    message = "Maaf, halaman atau aksi ini tidak tersedia untuk Anda.",
    fullPage = false,
    className,
    helpHref = "/support",
    onRetry,
}: {
    path?: string;
    action?: AclAction;
    title?: string;
    message?: string;
    fullPage?: boolean;
    className?: string;
    helpHref?: string;
    onRetry?: () => void;
}) {
    const handleBack = React.useCallback(() => {
        if (typeof window === "undefined") return;
        if (window.history.length > 1) window.history.back();
        else window.location.href = "/dashboard";
    }, []);

    const handleReload = React.useCallback(() => {
        if (onRetry) return onRetry();
        if (typeof window === "undefined") return;
        window.location.reload();
    }, [onRetry]);

    const Body = (
        <GlassCard
            className={cn(
                "relative overflow-hidden border-0 shadow-sm",
                "bg-white/70 backdrop-blur-md ring-1 ring-black/5",
                "p-6 sm:p-8 text-center",
                "flex flex-col items-center justify-center gap-3",
                className
            )}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_10%_0%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(60%_60%_at_90%_0%,rgba(59,130,246,0.15),transparent_60%)]"
            />

            <div className="relative inline-flex items-center justify-center rounded-2xl p-3 ring-1 ring-black/5 bg-white/70">
                <ShieldOff className="h-6 w-6 text-emerald-600" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                {title}
            </h3>

            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                {message}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>

                <Button
                    onClick={handleReload}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Muat Ulang
                </Button>

                <Button asChild variant="ghost">
                    <Link href={helpHref}>
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        Pusat Bantuan
                    </Link>
                </Button>
            </div>
        </GlassCard>
    );

    // === Center fullscreen ===
    if (fullPage) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center px-4">
                <div className="w-full max-w-lg">{Body}</div>
            </div>
        );
    }

    return Body;
}

/* ===========================================================
   AclDeniedInline (variasi kompak untuk area kecil, mis. dalam tab)
   =========================================================== */

export function AclDeniedInline({
    title = "Akses terbatas",
    message = "Anda tidak memiliki izin melihat bagian ini.",
    className,
    onRetry,
}: {
    title?: string;
    message?: string;
    className?: string;
    onRetry?: () => void;
}) {
    return (
        <div
            className={cn(
                "rounded-xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50/60 to-blue-50/60 p-4",
                "text-sm flex items-start gap-3",
                className
            )}
        >
            <div className="shrink-0 rounded-lg p-2 bg-white/80 ring-1 ring-black/5">
                <LockKeyhole className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="space-y-1">
                <div className="font-medium text-foreground">{title}</div>
                <div className="text-muted-foreground">{message}</div>
                {onRetry && (
                    <div className="pt-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-emerald-700 hover:text-emerald-800 hover:bg-white/70"
                            onClick={onRetry}
                        >
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            Coba lagi
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
