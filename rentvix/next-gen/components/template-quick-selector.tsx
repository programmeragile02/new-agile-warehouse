"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Palette, Check } from "lucide-react"
import { useTemplate } from "@/lib/contexts/template-context"
import { useLanguage } from "@/lib/contexts/language-context"
import { templates } from "@/lib/templates"
import { useState } from "react"

export function TemplateQuickSelector() {
  const { selectedTemplate, applyTemplate } = useTemplate()
  const { language } = useLanguage()
  const [isApplying, setIsApplying] = useState<string | null>(null)

  const handleQuickSelect = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    setIsApplying(templateId)
    await new Promise((resolve) => setTimeout(resolve, 300))
    applyTemplate(template)
    setIsApplying(null)
  }

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-space-grotesk font-semibold">
            {language === "id" ? "Pilihan Template Cepat" : "Quick Template Selection"}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant={selectedTemplate.id === template.id ? "default" : "outline"}
              size="sm"
              className={`gap-2 font-manrope transition-all duration-300 ${
                selectedTemplate.id === template.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-background/50 hover:bg-primary/10"
              }`}
              onClick={() => handleQuickSelect(template.id)}
              disabled={isApplying === template.id}
            >
              {isApplying === template.id ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : selectedTemplate.id === template.id ? (
                <Check className="h-3 w-3" />
              ) : (
                <div
                  className="w-3 h-3 rounded-full border border-current"
                  style={{ backgroundColor: template.colors.primary }}
                />
              )}
              <span className="text-xs">{language === "id" ? template.nameId : template.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
