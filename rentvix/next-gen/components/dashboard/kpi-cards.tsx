"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, Car, DollarSign, Calendar } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"

export function KpiCards() {
  const { language } = useLanguage()

  const kpiData = [
    {
      title: language === "id" ? "Total Pendapatan" : "Total Revenue",
      value: "Rp 45,200,000",
      change: "+12.5%",
      trend: "up" as const,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/50",
    },
    {
      title: language === "id" ? "Total Booking" : "Total Bookings",
      value: "156",
      change: "+8.2%",
      trend: "up" as const,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: language === "id" ? "Pelanggan Aktif" : "Active Customers",
      value: "89",
      change: "+15.3%",
      trend: "up" as const,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
    },
    {
      title: language === "id" ? "Utilisasi Armada" : "Fleet Utilization",
      value: "78%",
      change: "-2.1%",
      trend: "down" as const,
      icon: Car,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi, index) => (
        <Card key={index} className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{kpi.title}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mt-1 truncate">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      kpi.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {kpi.change}
                  </span>
                </div>
              </div>
              <div className={`p-2 sm:p-3 rounded-lg ${kpi.bgColor} flex-shrink-0`}>
                <kpi.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${kpi.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
