"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Check, X } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"

interface TemplatePreviewModalProps {
  template: {
    id: string
    name: string
    nameId: string
    description: string
    descriptionId: string
    preview: string
    features: string[]
    featuresId: string[]
    category: string
  }
  children: React.ReactNode
}

export function TemplatePreviewModal({ template, children }: TemplatePreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { language } = useLanguage()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{language === "id" ? template.nameId : template.name}</span>
            <Badge variant="outline" className="capitalize">
              {template.category}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Large Preview */}
          <div className="aspect-video rounded-lg bg-muted overflow-hidden">
            <img
              src={template.preview || "/placeholder.svg"}
              alt={`${template.name} preview`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{language === "id" ? "Deskripsi" : "Description"}</h3>
            <p className="text-muted-foreground">{language === "id" ? template.descriptionId : template.description}</p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{language === "id" ? "Fitur Utama" : "Key Features"}</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {(language === "id" ? template.featuresId : template.features).map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{language === "id" ? "Pratinjau Dashboard" : "Dashboard Preview"}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">24</div>
                  <div className="text-sm text-blue-600/70">Active Bookings</div>
                </div>
              </div>
              <div className="aspect-square rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">18</div>
                  <div className="text-sm text-green-600/70">Available Cars</div>
                </div>
              </div>
              <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">12.5M</div>
                  <div className="text-sm text-purple-600/70">Revenue</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1 gap-2">
              <Check className="h-4 w-4" />
              {language === "id" ? "Pilih Template Ini" : "Select This Template"}
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Eye className="h-4 w-4" />
              {language === "id" ? "Demo Langsung" : "Live Demo"}
            </Button>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
