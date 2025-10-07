"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Palette, Check, Sparkles } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"
import { useTheme } from "@/lib/contexts/theme-context"
import { themes, type Theme } from "@/lib/themes"
import { useState } from "react"

export function ThemeSelector() {
  const { language } = useLanguage()
  const { currentTheme, applyTheme } = useTheme()
  const [isApplying, setIsApplying] = useState<string | null>(null)

  const handleSelectTheme = async (theme: Theme) => {
    if (currentTheme.id === theme.id) return

    setIsApplying(theme.id)

    // Simulate loading for better UX
    await new Promise((resolve) => setTimeout(resolve, 600))

    applyTheme(theme)
    setIsApplying(null)
  }

  const isSelected = (theme: Theme) => currentTheme.id === theme.id
  const isLoading = (theme: Theme) => isApplying === theme.id

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Palette className="h-4 w-4" />
          <span className="text-sm font-medium">{language === "id" ? "Pilihan Theme" : "Theme Selection"}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === "id" ? "Pilih Theme RentVix Pro" : "Choose RentVix Pro Theme"}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {language === "id"
            ? "Personalisasi tampilan dashboard dengan memilih theme yang sesuai dengan kepribadian bisnis Anda"
            : "Personalize your dashboard appearance by choosing a theme that matches your business personality"}
        </p>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {themes.map((theme) => (
          <Card
            key={theme.id}
            className={`group relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 overflow-hidden ${
              isSelected(theme)
                ? "border-primary shadow-md ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handleSelectTheme(theme)}
          >
            {/* Selected Badge */}
            {isSelected(theme) && (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1 shadow-sm">
                  <Check className="h-3 w-3" />
                  {language === "id" ? "Aktif" : "Active"}
                </Badge>
              </div>
            )}

            {/* Theme Preview Header */}
            <div className={`h-20 bg-gradient-to-r ${theme.gradient} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white/80" />
              </div>

              {/* Color Dots */}
              <div className="absolute bottom-2 left-3 flex gap-1.5">
                <div
                  className="w-3 h-3 rounded-full border border-white/30 shadow-sm"
                  style={{ backgroundColor: theme.preview.primary }}
                />
                <div
                  className="w-3 h-3 rounded-full border border-white/30 shadow-sm"
                  style={{ backgroundColor: theme.preview.secondary }}
                />
                <div
                  className="w-3 h-3 rounded-full border border-white/30 shadow-sm"
                  style={{ backgroundColor: theme.preview.accent }}
                />
              </div>
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                {language === "id" ? theme.nameId : theme.name}
                {isSelected(theme) && <Check className="h-4 w-4 text-green-600" />}
              </CardTitle>
              <CardDescription className="text-sm">
                {language === "id" ? theme.descriptionId : theme.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              {/* Color Palette Preview */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {language === "id" ? "Palet Warna" : "Color Palette"}
                </p>
                <div className="flex gap-1">
                  <div
                    className="flex-1 h-6 rounded border shadow-sm"
                    style={{ backgroundColor: theme.preview.primary }}
                  />
                  <div
                    className="flex-1 h-6 rounded border shadow-sm"
                    style={{ backgroundColor: theme.preview.secondary }}
                  />
                  <div
                    className="flex-1 h-6 rounded border shadow-sm"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                </div>
              </div>

              {/* Select Button */}
              <Button
                className={`w-full gap-2 font-medium transition-all duration-300 ${
                  isSelected(theme) ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary hover:bg-primary/90"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectTheme(theme)
                }}
                disabled={isLoading(theme)}
                size="sm"
              >
                {isLoading(theme) ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {language === "id" ? "Menerapkan..." : "Applying..."}
                  </>
                ) : isSelected(theme) ? (
                  <>
                    <Check className="h-3 w-3" />
                    {language === "id" ? "Theme Aktif" : "Active Theme"}
                  </>
                ) : (
                  <>
                    <Palette className="h-3 w-3" />
                    {language === "id" ? "Pilih Theme" : "Select Theme"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Theme Info */}
      <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-r ${currentTheme.gradient} flex items-center justify-center shadow-md`}
          >
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">
              {language === "id" ? "Theme Aktif:" : "Active Theme:"}{" "}
              <span className="text-primary">{language === "id" ? currentTheme.nameId : currentTheme.name}</span>
            </h3>
            <p className="text-muted-foreground text-sm">
              {language === "id" ? currentTheme.descriptionId : currentTheme.description}
            </p>
            <div className="flex gap-2 mt-2">
              <div
                className="w-4 h-4 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: currentTheme.preview.primary }}
              />
              <div
                className="w-4 h-4 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: currentTheme.preview.secondary }}
              />
              <div
                className="w-4 h-4 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: currentTheme.preview.accent }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
