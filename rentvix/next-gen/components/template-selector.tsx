"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Check, Palette, Sparkles } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"
import { useTemplate } from "@/lib/contexts/template-context"
import { TemplatePreviewModal } from "./template-preview-modal"
import { templates, type Template } from "@/lib/templates"
import { useState } from "react"

interface TemplateSelectorProps {
  category?: "theme"
  onSelectTemplate?: (template: Template) => void
}

export function TemplateSelector({ category, onSelectTemplate }: TemplateSelectorProps) {
  const { language } = useLanguage()
  const { selectedTemplate, applyTemplate } = useTemplate()
  const [isApplying, setIsApplying] = useState<string | null>(null)

  const filteredTemplates = category ? templates.filter((t) => t.category === category) : templates

  const handleSelectTemplate = async (template: Template) => {
    setIsApplying(template.id)

    // Simulate loading for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    applyTemplate(template)
    onSelectTemplate?.(template)

    setIsApplying(null)
  }

  const isSelected = (template: Template) => selectedTemplate.id === template.id
  const isLoading = (template: Template) => isApplying === template.id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Palette className="h-4 w-4" />
          <span className="text-sm font-manrope font-medium">
            {language === "id" ? "Pilih Template" : "Choose Template"}
          </span>
        </div>
        <h2 className="text-2xl font-bold font-space-grotesk tracking-tight">
          {language === "id" ? "Template Tema RentVix Pro" : "RentVix Pro Theme Templates"}
        </h2>
        <p className="text-muted-foreground font-manrope">
          {language === "id"
            ? "Pilih tema yang sesuai dengan kepribadian bisnis Anda"
            : "Choose a theme that matches your business personality"}
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`group relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 overflow-hidden ${
              isSelected(template)
                ? "border-primary shadow-lg ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
          >
            {/* Selected Badge */}
            {isSelected(template) && (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-primary hover:bg-primary text-primary-foreground text-xs font-outfit gap-1">
                  <Check className="h-3 w-3" />
                  {language === "id" ? "Terpilih" : "Selected"}
                </Badge>
              </div>
            )}

            {/* Gradient Background Preview */}
            <div className={`h-20 bg-gradient-to-r ${template.gradient} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-2 left-3">
                <Sparkles className="h-4 w-4 text-white/80" />
              </div>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-space-grotesk font-bold tracking-tight flex items-center gap-2">
                {language === "id" ? template.nameId : template.name}
              </CardTitle>
              <CardDescription className="text-sm font-manrope leading-relaxed">
                {language === "id" ? template.descriptionId : template.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              {/* Color Palette Preview */}
              <div className="flex gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: template.colors.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: template.colors.secondary }}
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: template.colors.accent }}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <TemplatePreviewModal template={template}>
                  <Button variant="ghost" size="sm" className="w-full gap-2 font-manrope hover:bg-primary/10">
                    <Eye className="h-4 w-4" />
                    {language === "id" ? "Pratinjau" : "Preview"}
                  </Button>
                </TemplatePreviewModal>

                <Button
                  className={`w-full gap-2 font-manrope font-medium transition-all duration-300 ${
                    isSelected(template)
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                  disabled={isLoading(template)}
                >
                  {isLoading(template) ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {language === "id" ? "Menerapkan..." : "Applying..."}
                    </>
                  ) : isSelected(template) ? (
                    <>
                      <Check className="h-4 w-4" />
                      {language === "id" ? "Terpilih" : "Selected"}
                    </>
                  ) : (
                    <>
                      <Palette className="h-4 w-4" />
                      {language === "id" ? "Pilih Template" : "Select Template"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Selection Info */}
      <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-r ${selectedTemplate.gradient} flex items-center justify-center`}
          >
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-space-grotesk font-bold text-lg">
              {language === "id" ? "Template Aktif:" : "Active Template:"}{" "}
              <span className="text-primary">
                {language === "id" ? selectedTemplate.nameId : selectedTemplate.name}
              </span>
            </h3>
            <p className="text-muted-foreground font-manrope">
              {language === "id" ? selectedTemplate.descriptionId : selectedTemplate.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
