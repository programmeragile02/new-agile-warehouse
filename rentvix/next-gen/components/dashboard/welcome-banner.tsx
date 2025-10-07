"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Plus, Car, Calendar, BarChart3 } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"
import { useRouter } from "next/navigation"

export function WelcomeBanner() {
  const { t, language } = useLanguage()
  const router = useRouter()

  const quickActions = [
    {
      icon: Plus,
      label: "Booking Baru",
      labelEn: "New Booking",
      href: "/bookings",
      variant: "default" as const,
    },
    {
      icon: Car,
      label: "Tambah Kendaraan",
      labelEn: "Add Vehicle",
      href: "/vehicles",
      variant: "outline" as const,
    },
    {
      icon: Calendar,
      label: "Jadwal",
      labelEn: "Schedule",
      href: "/schedule",
      variant: "outline" as const,
    },
    {
      icon: BarChart3,
      label: "Laporan",
      labelEn: "Reports",
      href: "/reports",
      variant: "outline" as const,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Welcome Card */}
      <Card className="welcome-banner relative overflow-hidden shadow-theme-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">{t("welcomeMessage")}</h2>
              </div>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                {language === "id"
                  ? "Kelola bisnis rental kendaraan Anda dengan mudah dan efisien. Semua dalam satu platform."
                  : "Manage your vehicle rental business easily and efficiently. Everything in one platform."}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-card hover:bg-accent hover:text-accent-foreground border-border hover:border-primary/30 transition-all duration-300"
              >
                {language === "id" ? "Tutorial" : "Tutorial"}
              </Button>
              <Button
                size="sm"
                className="gap-2 font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-theme"
              >
                {language === "id" ? "Mulai Sekarang" : "Get Started"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 right-8 w-20 h-20 bg-primary/10 rounded-full translate-y-10" />
      </Card>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.href}
            onClick={() => router.push(action.href)}
            variant={action.variant}
            className={`gap-2 h-12 transition-all duration-300 ${
              action.variant === "default"
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-theme"
                : "border-primary/20 hover:bg-primary/5 hover:border-primary/40"
            }`}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-sm font-medium">{language === "id" ? action.label : action.labelEn}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
