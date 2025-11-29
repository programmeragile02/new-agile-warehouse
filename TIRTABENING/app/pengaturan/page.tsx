// app/pengaturan/page.tsxk
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/glass-card";
import { AppHeader } from "@/components/app-header";
import { TarifForm } from "@/components/tarif-form";
import { SystemForm } from "@/components/system-form";
import { UserManagement } from "@/components/user-management";
import { PermissionMatrix } from "@/components/permission-matrix";
import { ScheduleSettingsForm } from "@/components/schedule-settings-form";
import { AclDeniedAlert } from "@/components/acl-denied-alert";
import { PermissionGate } from "@/components/permission-gate";
export default function PengaturanPage() {
    return (
        <AuthGuard requiredRole="ADMIN">
            <PermissionGate
                path="/pengaturan"
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
                        <AppHeader title="Pengaturan" />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                {/* Tarif Air */}
                                <GlassCard className="p-6">
                                    <TarifForm />
                                </GlassCard>
                                <GlassCard className="p-6">
                                    <ScheduleSettingsForm />
                                </GlassCard>
                            </div>

                            {/* Pengaturan Sistem */}
                            <GlassCard className="p-6">
                                <SystemForm />
                            </GlassCard>

                            {/* Pengaturan Jadwal Pencatatan
            <GlassCard className="p-6">
             
            </GlassCard> */}

                            {/* Manajemen User */}
                            <GlassCard className="p-6 lg:col-span-2">
                                <UserManagement />
                            </GlassCard>

                            {/* Permission Matrix */}
                            <GlassCard className="p-6 lg:col-span-2">
                                <PermissionMatrix />
                            </GlassCard>
                        </div>
                    </div>
                </AppShell>
            </PermissionGate>
        </AuthGuard>
    );
}
