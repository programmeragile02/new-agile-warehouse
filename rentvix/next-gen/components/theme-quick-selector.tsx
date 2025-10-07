"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Palette, Check, Sparkles } from "lucide-react"
import { useTheme } from "@/lib/contexts/theme-context"
import { useLanguage } from "@/lib/contexts/language-context"
import { themes } from "@/lib/themes"
import { useState } from "react"

export function ThemeQuickSelector() {
  const { currentTheme, applyTheme } = useTheme()
  const { language } = useLanguage()
  const [isApplying, setIsApplying] = useState<string | null>(null)

  const handleQuickSelect = async (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId)
    if (!theme || currentTheme.id === themeId) return

    setIsApplying(themeId)
    await new Promise((resolve) => setTimeout(resolve, 400))
    applyTheme(theme)
    setIsApplying(null)
  }

  return (
    <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-cyan-500/30 shadow-lg shadow-cyan-500/10">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Palette className="h-4 w-4 text-cyan-400" />
            <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
          </div>
          <h3 className="font-space-grotesk font-semibold text-sm text-cyan-100">
            {language === "id" ? "AI Theme" : "AI Theme"}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {themes.map((theme) => (
            <Button
              key={theme.id}
              variant={currentTheme.id === theme.id ? "default" : "outline"}
              size="sm"
              className={`gap-2 font-manrope transition-all duration-300 h-9 text-xs ${
                currentTheme.id === theme.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border-cyan-400/50"
                  : "bg-slate-800/30 hover:bg-slate-700/50 border-slate-600/50 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-200"
              }`}
              onClick={() => handleQuickSelect(theme.id)}
              disabled={isApplying === theme.id}
            >
              {isApplying === theme.id ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : currentTheme.id === theme.id ? (
                <Check className="h-3 w-3" />
              ) : (
                <div
                  className="w-3 h-3 rounded-full border border-current shadow-sm"
                  style={{ backgroundColor: theme.preview.primary }}
                />
              )}
              <span className="font-medium">{language === "id" ? theme.nameId : theme.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
