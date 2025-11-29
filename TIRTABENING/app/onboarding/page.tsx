"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import OnboardingGetStarted from "@/components/ui/OnboardingGetStarted";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";

type StepKey =
    | "tarif"
    | "pengaturan"
    | "hak-akses"
    | "jadwal"
    | "user"
    | "tandon"
    | "blok"
    | "pelanggan"
    | "jadwal-catat";

export default function OnboardingPage() {
    const router = useRouter();
    const [completedKeys, setCompletedKeys] = useState<StepKey[]>([]);
    const [loading, setLoading] = useState(true);

    const TOTAL_STEPS = 9;
    const allDone = !loading && (completedKeys?.length ?? 0) >= TOTAL_STEPS;

    async function loadState() {
        setLoading(true);
        try {
            const res = await fetch("/api/onboarding-state", {
                cache: "no-store",
            });
            if (!res.ok) {
                setCompletedKeys([]);
                return;
            }
            const j = await res.json();
            setCompletedKeys(
                Array.isArray(j.completedKeys) ? j.completedKeys : []
            );
        } catch (e) {
            console.error("Failed loading onboarding state", e);
            setCompletedKeys([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadState();
    }, []);

    return (
        <AuthGuard requiredRole="ADMIN">
            <AppShell>
                <AppHeader
                    title="Onboarding"
                    showBackButton={false}
                    showBreadcrumb={false}
                />
                <div className="mx-auto space-y-6">
                    <div className="-mt-2">
                        <OnboardingGetStarted
                            completedKeys={completedKeys}
                            loading={loading}
                        />
                    </div>

                    {allDone ? (
                        <div className="flex justify-end">
                            <Button
                                onClick={() => router.push("/dashboard")}
                                className="h-9"
                            >
                                Buka Dashboard
                            </Button>
                        </div>
                    ) : null}
                </div>
            </AppShell>
        </AuthGuard>
    );
}
