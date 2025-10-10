"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/app-shell";

export default function FirstLoginPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const meetsMin = newPassword.length >= 8;
    const hasNum = /\d/.test(newPassword);
    const hasAlpha = /[A-Za-z]/.test(newPassword);
    const strong = meetsMin && hasNum && hasAlpha;

    const canSubmit = useMemo(() => {
        if (!newPassword || !confirm) return false;
        if (newPassword !== confirm) return false;
        return strong;
    }, [newPassword, confirm, strong]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true);

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }), // first-login: tanpa currentPassword
            });
            const j = await res.json().catch(() => ({}));

            if (!res.ok || !j?.ok) {
                const msg =
                    j?.message ||
                    (res.status === 422
                        ? "Password terlalu pendek. Coba minimal 8 karakter dengan huruf & angka."
                        : "Gagal menyimpan password. Coba lagi ya.");
                toast({
                    variant: "destructive",
                    title: "Belum berhasil",
                    description: msg,
                });
                return;
            }

            toast({
                title: "Password berhasil diubah",
                description:
                    "Aman! Kamu akan diarahkan ke Dashboard sebentar lagi.",
            });
            setTimeout(() => router.replace("/dashboard"), 800);
        } catch {
            toast({
                variant: "destructive",
                title: "Terjadi kesalahan",
                description: "Koneksi bermasalah. Coba lagi ya.",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppShell>
            <div className="min-h-screen flex items-center justify-center px-4">
                <GlassCard className="w-full max-w-md p-6">
                    <div className="space-y-2 text-center">
                        <h1 className="text-xl font-semibold text-foreground">
                            Buat Password Baru
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Ini pertama kali kamu masuk. Yuk buat password
                            supaya akunmu lebih aman. ✨
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new">Password Baru</Label>
                            <Input
                                id="new"
                                type="password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimal 8 karakter"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm">
                                Konfirmasi Password Baru
                            </Label>
                            <Input
                                id="confirm"
                                type="password"
                                autoComplete="new-password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Ulangi password baru"
                                required
                            />
                            {!!confirm && newPassword !== confirm && (
                                <p className="text-xs text-red-500">
                                    Konfirmasi tidak sama dengan password baru.
                                </p>
                            )}
                        </div>

                        <div className="rounded-md border border-border/60 p-3 bg-muted/30">
                            <p className="text-xs mb-2 text-muted-foreground">
                                Supaya kuat, pastikan:
                            </p>
                            <ul className="text-xs space-y-1">
                                <li
                                    className={
                                        meetsMin
                                            ? "text-emerald-600"
                                            : "text-muted-foreground"
                                    }
                                >
                                    • Minimal 8 karakter
                                </li>
                                <li
                                    className={
                                        hasAlpha
                                            ? "text-emerald-600"
                                            : "text-muted-foreground"
                                    }
                                >
                                    • Ada huruf (A–Z)
                                </li>
                                <li
                                    className={
                                        hasNum
                                            ? "text-emerald-600"
                                            : "text-muted-foreground"
                                    }
                                >
                                    • Ada angka (0–9)
                                </li>
                            </ul>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!canSubmit || loading}
                        >
                            {loading ? "Menyimpan..." : "Simpan Password"}
                        </Button>

                        <p className="text-[11px] text-center text-muted-foreground">
                            Tips: jangan pakai tanggal lahir atau nama sendiri
                            ya.
                        </p>
                    </form>
                </GlassCard>
            </div>
        </AppShell>
    );
}
