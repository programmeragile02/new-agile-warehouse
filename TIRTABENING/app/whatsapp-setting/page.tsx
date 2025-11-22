"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AppHeader } from "@/components/app-header";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    QrCode,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    LogOut,
    Info,
    Logs,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AuthGuard } from "@/components/auth-guard";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getTenantContext } from "@/lib/tenant-context";
import { PermissionGate } from "@/components/permission-gate";
import { AclDeniedAlert } from "@/components/acl-denied-alert";

type WAStatus = {
    ok: boolean;
    state: string; // e.g. INIT, QR, READY, AUTH_FAILURE, DISCONNECTED, LOGOUT
    ready: boolean;
    me?: any; // dari client.getMe()
    noContent?: boolean;
};

type LogItem = {
    ts: number;
    level: "info" | "warn" | "error" | "debug";
    msg: string;
    meta?: any;
};

/* ========= Helper Tooltip: desktop=Tooltip, mobile=Dialog ========= */
function useIsMobileStrict() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 640px)");
        const onChange = () => setIsMobile(mq.matches);
        onChange();
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, []);
    return isMobile;
}

function InfoTip({
    ariaLabel,
    children,
    open,
    onOpenChange,
    className = "",
}: {
    ariaLabel: string;
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (o: boolean) => void;
    className?: string;
}) {
    const isMobile = useIsMobileStrict();

    if (isMobile) {
        return (
            <>
                <button
                    type="button"
                    aria-label={ariaLabel}
                    className={`inline-flex items-center justify-center rounded-full p-1.5 hover:bg-muted/50 ${className}`}
                    onClick={() => onOpenChange?.(true)}
                >
                    <Info className="h-4 w-4 opacity-70" />
                </button>
                <Dialog open={!!open} onOpenChange={onOpenChange}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Info</DialogTitle>
                        </DialogHeader>
                        <div className="text-sm">{children}</div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <TooltipProvider delayDuration={120}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        aria-label={ariaLabel}
                        className={`inline-flex items-center justify-center rounded-full p-1.5 hover:bg-muted/50 ${className}`}
                    >
                        <Info className="h-4 w-4 opacity-70" />
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="start"
                    sideOffset={10}
                    collisionPadding={16}
                    className="rounded-md break-words whitespace-normal leading-relaxed p-3 shadow-lg pointer-events-auto"
                    style={{
                        position: "fixed",
                        zIndex: 2147483647,
                        width: "min(92vw, 420px)",
                    }}
                >
                    <div className="text-sm">{children}</div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default function WASettingPage() {
    const [status, setStatus] = useState<WAStatus | null>(null);
    const [qr, setQr] = useState<string | null>(null);
    const [loadingLogout, setLoadingLogout] = useState(false);
    const [loadingOnboard, setLoadingOnboard] = useState(false);
    const [forceRefreshTick, setForceRefreshTick] = useState(0);
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [logLimit, setLogLimit] = useState(200);
    const [offering, setOffering] = useState<string | null>(null);

    // state tooltip (untuk Dialog di mobile)
    const [openTip, setOpenTip] = useState(false);

    // toast
    const { toast } = useToast();

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const r = await fetch("/api/tenant/info", {
                    cache: "no-store",
                });
                if (!alive) return;
                const j = await r.json().catch(() => null);
                if (j?.ok && j?.offering)
                    setOffering(String(j.offering).toLowerCase());
            } catch (e) {
                // ignore
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // ---- POLLING STATUS & QR ----
    useEffect(() => {
        let alive = true;
        let backoffMs = 0;

        async function loop() {
            if (!alive) return;

            try {
                // status selalu diambil
                const sRes = await fetch("/api/wa/status", {
                    cache: "no-store",
                });
                if (sRes.status === 429) throw new Error("429");
                const s = (await sRes.json()) as WAStatus;
                if (!alive) return;
                setStatus(s);

                // qr hanya saat belum ready
                if (!s?.ready) {
                    const qRes = await fetch("/api/wa/qr", {
                        cache: "no-store",
                    });
                    if (qRes.status === 429) throw new Error("429");
                    const q = await qRes.json();
                    if (!alive) return;
                    setQr(q?.ok && q?.dataUrl ? q.dataUrl : null);
                } else {
                    setQr(null);
                }

                backoffMs = 0; // reset backoff saat sukses
            } catch (e: any) {
                // kalau 429, tunda 10s
                backoffMs = 10_000;
            } finally {
                // status tiap 5s, tapi hormati backoff jika ada
                const wait = Math.max(5_000, backoffMs);
                setTimeout(loop, wait);
            }
        }

        loop();
        return () => {
            alive = false;
        };
    }, [forceRefreshTick]);

    // ---- POLLING LOGS ----
    useEffect(() => {
        let alive = true;
        let backoffMs = 0;

        async function loop() {
            if (!alive) return;
            try {
                const r = await fetch(`/api/wa/logs?limit=${logLimit}`, {
                    cache: "no-store",
                });
                if (r.status === 429) throw new Error("429");
                const j = await r.json();
                if (!alive) return;
                if (j?.ok && Array.isArray(j.items)) setLogs(j.items);
                backoffMs = 0;
            } catch {
                backoffMs = 10_000; // 10s
            } finally {
                const wait = Math.max(2_000, backoffMs);
                setTimeout(loop, wait);
            }
        }

        loop();
        return () => {
            alive = false;
        };
    }, [logLimit]);

    function fmt(ts?: number) {
        if (!ts) return "-";
        const d = new Date(ts);
        return d.toLocaleTimeString("id-ID", { hour12: false });
    }

    // badge logs
    function levelBadge(lv: LogItem["level"]) {
        if (lv === "error") return <Badge className="bg-red-600">ERROR</Badge>;
        if (lv === "warn") return <Badge className="bg-amber-600">WARN</Badge>;
        if (lv === "debug")
            return <Badge className="bg-slate-600">DEBUG</Badge>;
        return <Badge className="bg-green-600">INFO</Badge>;
    }

    // badge status
    const badge = useMemo(() => {
        const s = status?.state || "UNKNOWN";
        if (status?.ready)
            return <Badge className="bg-green-600">Connected</Badge>;
        if (s === "QR")
            return <Badge className="bg-yellow-600">Waiting QR</Badge>;
        if (s === "AUTH_FAILURE")
            return <Badge className="bg-red-600">Auth Failure</Badge>;
        if (s === "DISCONNECTED")
            return <Badge className="bg-orange-600">Disconnected</Badge>;
        if (s === "LOGOUT")
            return <Badge className="bg-gray-600">Logged Out</Badge>;
        if (s === "INIT")
            return <Badge className="bg-slate-600">Initializing</Badge>;
        return <Badge className="bg-slate-600">{s}</Badge>;
    }, [status]);

    async function handleLogout() {
        try {
            setLoadingLogout(true);
            const r = await fetch("/api/wa/logout", { method: "POST" });
            const j = await r.json().catch(() => ({}));
            if (j?.ok) {
                setForceRefreshTick((n) => n + 1);
                toast({
                    title: "Logout berhasil",
                    description: "Sesi WhatsApp telah dihapus.",
                });
            } else {
                toast({
                    title: "Gagal logout",
                    description: j?.message || "Terjadi kesalahan saat logout.",
                    variant: "destructive",
                });
            }
        } catch (e) {
            console.error("logout error", e);
            toast({
                title: "Network error",
                description: "Gagal logout (network).",
                variant: "destructive",
            });
        } finally {
            setLoadingLogout(false);
        }
    }

    async function handleConnect() {
        try {
            setLoadingOnboard(true);
            const r = await fetch("/api/wa/onboard", { method: "POST" });
            const j = await r.json().catch(() => ({}));
            if (!j?.ok) {
                toast({
                    title: "Gagal membuat client",
                    description: j?.message || "unknown",
                    variant: "destructive",
                });
                return;
            }
            if (offering === "premium") {
                toast({
                    title: "Client Terhubung",
                    description:
                        "Whatsapp di paket anda memakai Whatsapp Nata Banyu.",
                });
            } else {
                toast({
                    title: "Client dibuat",
                    description: "Silakan scan QR di panel ini jika muncul.",
                });
            }
            setForceRefreshTick((n) => n + 1);
        } catch (e) {
            console.error("onboard error", e);
            toast({
                title: "Onboard gagal",
                description: "Onboard gagal (network).",
                variant: "destructive",
            });
        } finally {
            setLoadingOnboard(false);
        }
    }

    function formatMe(me: any) {
        if (!me) return { displayNumber: "-", displayName: "-", platform: "-" };

        // kasus umum: me.user adalah string nomor (user), me.pushname = nama, me.platform
        const displayNumber =
            typeof me.user === "string" && me.user.trim()
                ? `+${me.user}`
                : // kalau me.wid bisa berupa string atau object { _serialized: 'xxx' }
                typeof me.wid === "string"
                ? me.wid
                : me.wid && typeof me.wid.user === "string"
                ? me.wid.user
                : // fallback: coba properti lainnya
                me.id && typeof me.id === "string"
                ? me.id
                : "-";

        const displayName =
            (me.pushname && String(me.pushname)) ||
            (me.name && String(me.name)) ||
            "-";

        const platform = (me.platform && String(me.platform)) || "-";

        // debug: jika ada objek di tempat yang kami harapkan string, tampilkan console debug
        if (typeof me.user !== "string" && me.user) {
            console.debug("WASettingPage: unexpected me.user type", me.user);
        }
        if (me.wid && typeof me.wid === "object" && me.wid._serialized) {
            // fine, nothing to do
        }

        return { displayNumber, displayName, platform };
    }

    return (
        <AuthGuard requiredRole={"ADMIN"}>
            <PermissionGate
                path="/whatsapp-setting"
                action="view"
                fallback={<AclDeniedAlert fullPage />}
                loadingFallback={
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="flex items-center gap-2 text-primary">
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className="text-lg">Memuat…</span>
                        </div>
                    </div>
                }
            >
                <AppShell>
                    <AppHeader
                        title="WhatsApp Setting"
                        titleExtra={
                            <InfoTip
                                ariaLabel="Apa itu WhatsApp Setting?"
                                open={openTip}
                                onOpenChange={setOpenTip}
                            >
                                <b>WhatsApp Setting</b> dipakai untuk mengatur
                                nomor pengirim notifikasi WA. Hubungkan akun,
                                scan QR, lalu kirim notifikasi dari aplikasi.
                            </InfoTip>
                        }
                    />

                    <div className="flex flex-wrap gap-2 mt-4">
                        {/* Panel Whatsapp */}
                        <div className="max-w-4xl mx-auto">
                            <GlassCard className="p-4 md:p-6">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <QrCode className="w-6 h-6" />
                                        <div>
                                            <div className="text-lg font-semibold">
                                                WhatsApp Connection
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {badge}
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                setForceRefreshTick(
                                                    (n) => n + 1
                                                )
                                            }
                                            title="Refresh"
                                        >
                                            <RefreshCcw className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="grid md:grid-cols-2 gap-6 mt-3">
                                    {/* Status Panel */}
                                    <div className="space-y-3">
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Info className="w-5 h-5" />
                                            <span>Status:</span>
                                            <span className="font-medium">
                                                {status?.state ?? "-"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {status?.ready ? (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                    <span className="font-medium">
                                                        Connected
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                    <span className="font-medium">
                                                        Not Connected
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <div className="text-sm">
                                            <div className="text-muted-foreground mb-1">
                                                Account Info
                                            </div>
                                            {status?.ready && status?.me ? (
                                                (() => {
                                                    const {
                                                        displayNumber,
                                                        displayName,
                                                        platform,
                                                    } = formatMe(status.me);
                                                    return (
                                                        <div className="grid grid-cols-3 gap-y-2 rounded border bg-muted/30 p-3 text-sm">
                                                            <div className="text-muted-foreground">
                                                                Nomor
                                                            </div>
                                                            <div className="col-span-2 font-medium">
                                                                +{displayNumber}
                                                            </div>

                                                            <div className="text-muted-foreground">
                                                                Nama
                                                            </div>
                                                            <div className="col-span-2 font-medium">
                                                                {displayName}
                                                            </div>

                                                            <div className="text-muted-foreground">
                                                                Platform
                                                            </div>
                                                            <div className="col-span-2 font-medium">
                                                                {platform}
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <div className="rounded border bg-muted/20 p-3 text-xs text-muted-foreground">
                                                    - belum terhubung
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            <div className="flex gap-2">
                                                {offering !== "premium" && (
                                                    <Button
                                                        variant="destructive"
                                                        onClick={handleLogout}
                                                        disabled={loadingLogout}
                                                    >
                                                        <LogOut className="w-4 h-4 mr-2" />
                                                        Logout Session
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="secondary"
                                                    onClick={handleConnect}
                                                    disabled={loadingOnboard}
                                                >
                                                    <QrCode className="w-4 h-4 mr-2" />
                                                    {loadingOnboard
                                                        ? "Connecting..."
                                                        : "Connect WhatsApp"}
                                                </Button>
                                            </div>
                                            {offering === "premium" ? (
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    Connect Whatsapp untuk
                                                    menghubungkan ke nomor Nata
                                                    Banyu
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    Logout akan menghapus sesi.
                                                    Setelah itu, Connect
                                                    Whatsapp lagi untuk login
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* QR Panel */}
                                    <div className="space-y-3">
                                        <div className="text-sm text-muted-foreground font-semibold text-center">
                                            QR Code
                                        </div>
                                        {qr ? (
                                            <div className="rounded-lg border p-3 bg-white">
                                                {/* dataURL dari /api/wa/qr */}
                                                <img
                                                    src={qr}
                                                    alt="WhatsApp QR"
                                                    className="w-full h-auto mx-auto"
                                                />
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                                                {status?.ready
                                                    ? "Sudah terhubung. QR tidak tersedia."
                                                    : "QR belum tersedia. Klik tombol Connect Whatsapp, lalu tunggu status 'Waiting QR'."}
                                            </div>
                                        )}
                                        {!status?.ready && (
                                            <div className="text-xs text-muted-foreground">
                                                Buka WhatsApp di ponsel →
                                                Perangkat Tertaut → Tautkan
                                                Perangkat → Scan QR ini.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Logs */}
                        {offering !== "premium" && (
                            <div className="w-96 mx-auto min-h-0">
                                <GlassCard className="p-4 md:p-5 min-h-0">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <Logs className="w-6 h-6" />
                                            <div className="text-lg font-semibold">
                                                Logs
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm">Limit:</p>
                                            <Select
                                                value={String(logLimit)}
                                                onValueChange={(v) =>
                                                    setLogLimit(Number(v))
                                                }
                                            >
                                                <SelectTrigger className="h-8 px-2 text-xs w-[84px]">
                                                    <SelectValue placeholder="Limit" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[60]">
                                                    <SelectItem value="100">
                                                        100
                                                    </SelectItem>
                                                    <SelectItem value="200">
                                                        200
                                                    </SelectItem>
                                                    <SelectItem value="300">
                                                        300
                                                    </SelectItem>
                                                    <SelectItem value="500">
                                                        500
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    setForceRefreshTick(
                                                        (n) => n + 1
                                                    )
                                                }
                                                title="Refresh"
                                            >
                                                <RefreshCcw className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    <div
                                        className="mt-3 rounded-lg border flex flex-col overflow-hidden"
                                        style={{ height: 495 }}
                                    >
                                        <div
                                            className="flex-1 overflow-y-auto"
                                            style={{
                                                overscrollBehavior: "contain",
                                            }}
                                        >
                                            {logs.length === 0 ? (
                                                <div className="text-sm text-center text-muted-foreground p-4">
                                                    Belum ada log.
                                                </div>
                                            ) : (
                                                logs.map((l, i) => (
                                                    <div
                                                        key={i}
                                                        className="grid grid-cols-12 items-start px-3 py-2 border-t text-sm"
                                                    >
                                                        <div className="col-span-3 tabular-nums">
                                                            {fmt(l.ts)}
                                                        </div>
                                                        <div className="col-span-3">
                                                            {levelBadge(
                                                                l.level
                                                            )}
                                                        </div>
                                                        <div className="col-span-6 break-words">
                                                            {l.msg}
                                                        </div>
                                                        <div className="col-span-12 mt-2">
                                                            {l.meta ? (
                                                                <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">
                                                                    {JSON.stringify(
                                                                        l.meta,
                                                                        null,
                                                                        2
                                                                    )}
                                                                </pre>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    -
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        )}
                    </div>
                </AppShell>
            </PermissionGate>
        </AuthGuard>
    );
}
