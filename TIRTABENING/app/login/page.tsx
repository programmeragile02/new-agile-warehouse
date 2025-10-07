import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/glass-card";
import { LoginForm } from "@/components/login-form";
import { TirtaLogo } from "@/components/tirta-logo";
import { cookies } from "next/headers";
import { decodeCookie } from "@/lib/auth-session";
import { redirect } from "next/navigation";
export default function LoginPage() {
  const hasTenant = !!decodeCookie(cookies().get("tb_tenant")?.value ?? null);
  if (!hasTenant) redirect("/company-login");

  return (
    <AppShell>
      <div className="max-w-md mx-auto space-y-6 pt-8">
        {/* Branding Header */}
        <div className="text-center py-8">
          <TirtaLogo size="lg" className="mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-primary mb-2 text-balance">
            Tirta Bening
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Sistem Manajemen Tagihan Air
          </p>
        </div>

        {/* Login Card */}
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Masuk ke Sistem
              </h2>
              {!hasTenant && (
                <p className="text-sm text-amber-600">
                  Kamu belum login Company. Silakan login Company terlebih
                  dahulu.
                </p>
              )}
              {hasTenant && (
                <p className="text-muted-foreground text-pretty">
                  Silakan masukkan kredensial Anda
                </p>
              )}
            </div>

            <LoginForm />
          </div>
        </GlassCard>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Tirta Bening. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
