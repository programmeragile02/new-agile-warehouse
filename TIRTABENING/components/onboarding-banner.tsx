"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

export function OnboardingBanner() {
    const [state, setState] = useState({
        progressPct: 0,
        completed: 0,
        total: 9,
        loaded: false,
        onboardingCompleted: false,
    });
    const [showCongrats, setShowCongrats] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // hide banner di halaman onboarding
    if (pathname.startsWith("/onboarding")) return null;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/onboarding-state", {
                    cache: "no-store",
                });
                const json = await res.json();
                if (cancelled) return;

                const completed = Array.isArray(json.completedKeys)
                    ? json.completedKeys.length
                    : 0;
                const total = 9;
                const pct = Math.min(
                    100,
                    json.progressPct ?? Math.round((completed / total) * 100)
                );

                setState({
                    progressPct: pct,
                    completed,
                    total,
                    loaded: true,
                    onboardingCompleted: json.onboardingCompleted ?? false,
                });

                // jika progres 100% dan belum pernah disimpan -> simpan
                if (pct >= 100 && !json.onboardingCompleted) {
                    setShowCongrats(true);
                    confetti({
                        particleCount: 140,
                        spread: 80,
                        origin: { y: 0.6 },
                    });
                    await fetch("/api/onboarding-state/complete", {
                        method: "POST",
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    setState({
                        progressPct: 0,
                        completed: 0,
                        total: 9,
                        loaded: true,
                        onboardingCompleted: false,
                    });
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!state.loaded) return null;

    return (
        <>
            {/* Banner hanya tampil kalau belum selesai */}
            {!state.onboardingCompleted && state.progressPct < 100 && (
                <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-sm text-primary font-semibold">
                                Anda belum menyelesaikan Penyiapan Nata Banyu
                            </p>
                            <p className="text-sm font-medium text-primary">
                                {state.completed} dari {state.total} langkah
                                penyiapan sudah diselesaikan
                            </p>
                            <Progress
                                value={state.progressPct}
                                className="mt-2 h-2 bg-primary/20"
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={() => router.push("/onboarding")}
                            className="bg-primary text-white hover:bg-primary/90 shrink-0"
                        >
                            Lanjutkan Onboarding
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal tetap dirender terpisah */}
            <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-center">
                            Selamat! 🎉
                        </DialogTitle>
                        <DialogDescription className="mt-2 text-base text-muted-foreground text-center">
                            Anda telah menyelesaikan seluruh proses penyiapan{" "}
                            <span className="font-semibold text-foreground">
                                Nata Banyu
                            </span>
                            . Aplikasi kini siap digunakan sepenuhnya untuk
                            pencatatan dan penagihan meter air.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex justify-center">
                        <Button onClick={() => setShowCongrats(false)}>
                            Lanjutkan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
