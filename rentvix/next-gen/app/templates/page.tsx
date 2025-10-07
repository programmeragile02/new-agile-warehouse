"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { SidebarInset } from "@/components/ui/sidebar"
import { TemplateSelector } from "@/components/template-selector"
import { TemplateComparison } from "@/components/template-comparison"
import { useLanguage } from "@/lib/contexts/language-context"

export default function TemplatesPage() {
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
              {language === "id" ? "Pilihan Template" : "Template Selection"}
            </h1>
            <p className="text-lg text-muted-foreground font-manrope max-w-2xl mx-auto leading-relaxed">
              {language === "id"
                ? "Personalisasi tampilan dashboard RentVix Pro sesuai dengan gaya bisnis Anda. Pilih dari 4 tema yang telah dirancang khusus."
                : "Personalize your RentVix Pro dashboard appearance according to your business style. Choose from 4 specially designed themes."}
            </p>
          </div>

          {/* Template Selector */}
          <TemplateSelector category="theme" />

          {/* Template Comparison Section */}
          <div className="mt-16 pt-16 border-t border-border/40">
            <TemplateComparison />
          </div>
        </main>
      </SidebarInset>
    </>
  )
}
