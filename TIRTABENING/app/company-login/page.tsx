import { AppShell } from "@/components/app-shell";
import CompanyLoginForm from "@/components/CompanyLoginForm";
import { GlassCard } from "@/components/glass-card";
import { TirtaLogo } from "@/components/tirta-logo";
export default function CompanyLoginPage() {
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
            Silahkan Login Company Terlebih Dahulu
          </p>
        </div>

        {/* Company Login Card */}
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Login Company
              </h2>
              <p className="text-muted-foreground text-pretty">
                Masukkan <b>Company ID</b> dan <b>Password</b> dari email
                aktivasi
              </p>
            </div>

            <CompanyLoginForm />
          </div>
        </GlassCard>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Tirta Bening. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
