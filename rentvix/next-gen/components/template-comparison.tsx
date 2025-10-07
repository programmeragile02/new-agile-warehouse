"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, GitCompare } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"

const templateFeatures = {
  "small-business": {
    modules: ["Basic Booking", "Vehicle Management", "Customer Data", "Simple Reports"],
    modulesId: ["Booking Dasar", "Manajemen Kendaraan", "Data Pelanggan", "Laporan Sederhana"],
    analytics: "Basic",
    users: "Up to 5",
    storage: "10GB",
    support: "Email",
    price: "$29/month",
    priceId: "Rp 435,000/bulan",
  },
  startup: {
    modules: ["All Booking Features", "Fleet Management", "Customer Portal", "Advanced Reports", "Mobile App"],
    modulesId: ["Semua Fitur Booking", "Manajemen Armada", "Portal Pelanggan", "Laporan Lanjutan", "Aplikasi Mobile"],
    analytics: "Advanced",
    users: "Up to 15",
    storage: "50GB",
    support: "Email + Chat",
    price: "$79/month",
    priceId: "Rp 1,185,000/bulan",
  },
  enterprise: {
    modules: ["All Features", "Multi-location", "API Access", "Custom Integrations", "White Label"],
    modulesId: ["Semua Fitur", "Multi-lokasi", "Akses API", "Integrasi Kustom", "White Label"],
    analytics: "Enterprise",
    users: "Unlimited",
    storage: "Unlimited",
    support: "24/7 Phone + Chat",
    price: "$199/month",
    priceId: "Rp 2,985,000/bulan",
  },
}

export function TemplateComparison() {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(["small-business", "startup"])
  const { language } = useLanguage()

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : prev.length < 3
          ? [...prev, templateId]
          : prev,
    )
  }

  const comparisonData = [
    {
      key: "modules",
      label: language === "id" ? "Modul Tersedia" : "Available Modules",
      type: "list",
    },
    {
      key: "analytics",
      label: language === "id" ? "Tingkat Analitik" : "Analytics Level",
      type: "text",
    },
    {
      key: "users",
      label: language === "id" ? "Jumlah Pengguna" : "Number of Users",
      type: "text",
    },
    {
      key: "storage",
      label: language === "id" ? "Penyimpanan" : "Storage",
      type: "text",
    },
    {
      key: "support",
      label: language === "id" ? "Dukungan" : "Support",
      type: "text",
    },
    {
      key: "price",
      label: language === "id" ? "Harga" : "Price",
      type: "price",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <GitCompare className="h-6 w-6" />
          {language === "id" ? "Bandingkan Template" : "Compare Templates"}
        </h2>
        <p className="text-muted-foreground">
          {language === "id"
            ? "Pilih hingga 3 template untuk dibandingkan fitur dan harganya"
            : "Select up to 3 templates to compare their features and pricing"}
        </p>
      </div>

      {/* Template Selection */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.keys(templateFeatures).map((templateId) => (
          <Button
            key={templateId}
            variant={selectedTemplates.includes(templateId) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleTemplate(templateId)}
            disabled={!selectedTemplates.includes(templateId) && selectedTemplates.length >= 3}
          >
            {templateId === "small-business" && (language === "id" ? "Bisnis Kecil" : "Small Business")}
            {templateId === "startup" && "Startup"}
            {templateId === "enterprise" && (language === "id" ? "Perusahaan" : "Enterprise")}
          </Button>
        ))}
      </div>

      {/* Comparison Table */}
      {selectedTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === "id" ? "Perbandingan Fitur" : "Feature Comparison"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">{language === "id" ? "Fitur" : "Feature"}</th>
                    {selectedTemplates.map((templateId) => (
                      <th key={templateId} className="text-center p-4 font-medium min-w-[200px]">
                        <div className="space-y-1">
                          <div className="capitalize">
                            {templateId === "small-business" && (language === "id" ? "Bisnis Kecil" : "Small Business")}
                            {templateId === "startup" && "Startup"}
                            {templateId === "enterprise" && (language === "id" ? "Perusahaan" : "Enterprise")}
                          </div>
                          {templateId === "startup" && (
                            <Badge variant="secondary" className="text-xs">
                              {language === "id" ? "Populer" : "Popular"}
                            </Badge>
                          )}
                          {templateId === "small-business" && (
                            <Badge variant="secondary" className="text-xs">
                              {language === "id" ? "Rekomendasi" : "Recommended"}
                            </Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row) => (
                    <tr key={row.key} className="border-b">
                      <td className="p-4 font-medium">{row.label}</td>
                      {selectedTemplates.map((templateId) => {
                        const template = templateFeatures[templateId as keyof typeof templateFeatures]
                        const value = template[row.key as keyof typeof template]

                        return (
                          <td key={templateId} className="p-4 text-center">
                            {row.type === "list" ? (
                              <div className="space-y-1">
                                {(language === "id" && row.key === "modules"
                                  ? template.modulesId
                                  : (value as string[])
                                ).map((item, index) => (
                                  <div key={index} className="flex items-center justify-center gap-1 text-sm">
                                    <Check className="h-3 w-3 text-green-600" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            ) : row.type === "price" ? (
                              <div className="space-y-1">
                                <div className="text-lg font-bold text-primary">
                                  {language === "id" ? template.priceId : template.price}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm">{value as string}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {selectedTemplates.length > 0 && (
        <div className="flex justify-center gap-3">
          {selectedTemplates.map((templateId) => (
            <Button key={templateId} className="gap-2">
              <Check className="h-4 w-4" />
              {language === "id" ? "Pilih" : "Select"}{" "}
              {templateId === "small-business"
                ? language === "id"
                  ? "Bisnis Kecil"
                  : "Small Business"
                : templateId === "startup"
                  ? "Startup"
                  : language === "id"
                    ? "Perusahaan"
                    : "Enterprise"}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
