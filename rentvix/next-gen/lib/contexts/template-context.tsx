"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { templates, type Template } from "@/lib/templates"

interface TemplateContextType {
  selectedTemplate: Template
  setSelectedTemplate: (template: Template) => void
  applyTemplate: (template: Template) => void
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined)

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0])

  const applyTemplate = (template: Template) => {
    setSelectedTemplate(template)

    // Apply template colors to CSS variables
    const root = document.documentElement
    root.style.setProperty("--primary", template.colors.primary)
    root.style.setProperty("--secondary", template.colors.secondary)
    root.style.setProperty("--accent", template.colors.accent)

    // Save to localStorage
    localStorage.setItem("rentvix-selected-template", template.id)

    // Show success notification
    console.log(`Template "${template.name}" applied successfully!`)
  }

  useEffect(() => {
    // Load saved template on mount
    const savedTemplateId = localStorage.getItem("rentvix-selected-template")
    if (savedTemplateId) {
      const savedTemplate = templates.find((t) => t.id === savedTemplateId)
      if (savedTemplate) {
        applyTemplate(savedTemplate)
      }
    }
  }, [])

  return (
    <TemplateContext.Provider value={{ selectedTemplate, setSelectedTemplate, applyTemplate }}>
      {children}
    </TemplateContext.Provider>
  )
}

export function useTemplate() {
  const context = useContext(TemplateContext)
  if (!context) {
    throw new Error("useTemplate must be used within a TemplateProvider")
  }
  return context
}
