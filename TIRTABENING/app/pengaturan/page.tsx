// app/pengaturan/page.tsx
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/glass-card";
import { AppHeader } from "@/components/app-header";
import { TarifForm } from "@/components/tarif-form";
import { SystemForm } from "@/components/system-form";
import { UserManagement } from "@/components/user-management";
import { PermissionMatrix } from "@/components/permission-matrix";
import { ScheduleSettingsForm } from "@/components/schedule-settings-form";
export default function PengaturanPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6">
          <AppHeader title="Pengaturan" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tarif Air */}
            <GlassCard className="p-6  space-y-20">
              <TarifForm />
              <ScheduleSettingsForm />
            </GlassCard>

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
    </AuthGuard>
  );
}
