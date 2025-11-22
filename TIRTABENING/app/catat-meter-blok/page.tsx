// app/catat-meter-blok/page.tsx
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/glass-card";
import { AppHeader } from "@/components/app-header";

// ⬇️ perhatikan: default import, nama bebas tapi konsisten
import { MeterBlokForm } from "@/components/meter-blok-form";
import { MeterBlokGrid } from "@/components/meter-blok-grid";
import { PermissionGate } from "@/components/permission-gate";
import { AclDeniedAlert } from "@/components/acl-denied-alert";
export default function CatatMeterBlokPage() {
    return (
        <AuthGuard requiredRole="petugas">
            <PermissionGate
                path="/catat-meter-blok"
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
                    <div className="max-w-6xl mx-auto space-y-6">
                        <AppHeader title="Catat Meter Blok" />

                        <GlassCard className="p-6">
                            <h2 className="text-xl font-semibold text-foreground mb-4">
                                Pilih Periode & Blok
                            </h2>
                            <MeterBlokForm />
                        </GlassCard>

                        <MeterBlokGrid />
                    </div>
                </AppShell>
            </PermissionGate>
        </AuthGuard>
    );
}
