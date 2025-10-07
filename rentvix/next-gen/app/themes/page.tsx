"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { SidebarInset } from "@/components/ui/sidebar"
import { ThemeSelector } from "@/components/theme-selector"
import { useLanguage } from "@/lib/contexts/language-context"

export default function ThemesPage() {
  const { language } = useLanguage()

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <TopNavbar />
        <main className="flex-1 space-y-8 p-6 custom-scrollbar">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold font-space-grotesk tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {language === "id" ? "Pilihan Theme" : "Theme Selection"}
            </h1>
            <p className="text-lg text-muted-foreground font-manrope max-w-2xl mx-auto leading-relaxed">
              {language === "id"
                ? "Ubah tampilan dashboard RentVix Pro sesuai dengan gaya dan kepribadian bisnis Anda. Pilih dari 4 theme yang telah dirancang khusus."
                : "Change your RentVix Pro dashboard appearance according to your business style and personality. Choose from 4 specially designed themes."}
            </p>
          </div>

          {/* Theme Selector */}
          <ThemeSelector />

          {/* Additional Info */}
          <div className="text-center py-12 bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl border">
            <h3 className="text-2xl font-bold font-space-grotesk mb-4">
              {language === "id" ? "Theme Akan Tersimpan Otomatis" : "Theme Will Be Saved Automatically"}
            </h3>
            <p className="text-muted-foreground font-manrope mb-6 max-w-md mx-auto">
              {language === "id"
                ? "Pilihan theme Anda akan tersimpan dan diterapkan setiap kali Anda membuka dashboard."
                : "Your theme choice will be saved and applied every time you open the dashboard."}
            </p>
          </div>
        </main>
      </SidebarInset>
    </>
  )
}
