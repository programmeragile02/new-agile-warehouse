// app/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { TopNavbar } from "@/components/top-navbar";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SmartSuggestions } from "@/components/dashboard/smart-suggestions";
import { StatisticsTable } from "@/components/dashboard/statistics-table";
import { EarlyWarningReminder } from "@/components/early-warning-reminder";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FloatingActionButton } from "@/components/floating-action-button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearUserAuth, getUserToken } from "@/lib/auth-tokens";

export default function HomePage() {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const t = getUserToken();
        if (!t) {
            router.replace("/login/user"); // ⬅️ langsung ke user
            return;
        }

        // (opsional) verifikasi token ke backend
        // (async () => {
        //   try {
        //     await apiFetch("/auth/user/me", { method: "GET" }, "user");
        //     setReady(true);
        //   } catch {
        //     clearUserAuth();
        //     router.replace("/login/user");
        //   }
        // })();
    }, [router]);

    const handleLogout = async () => {
        try {
            await apiFetch("/auth/logout/user", { method: "POST" }, "user");
        } catch {}
        clearUserAuth(); // ⬅️ simpan company_token
        router.replace("/login/user");
    };

    return (
        <>
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
                <TopNavbar onLogout={handleLogout as any} />
            </div>
            <main className="flex-1 space-y-6 p-4 md:p-6 bg-background text-foreground min-h-screen pb-24 md:pb-6">
                <WelcomeBanner />
                <Suspense
                    fallback={
                        <div className="animate-pulse bg-muted h-32 rounded-lg" />
                    }
                >
                    <KpiCards />
                </Suspense>
                <DashboardCharts />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RecentActivity />
                    <SmartSuggestions />
                </div>
                <StatisticsTable />
                <EarlyWarningReminder />
            </main>
            {isMobile ? <BottomNavigation /> : <FloatingActionButton />}
        </>
    );
}
