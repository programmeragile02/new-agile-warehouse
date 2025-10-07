"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, Calendar, DollarSign, TrendingUp, TrendingDown, Users, Wrench, AlertTriangle } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"

const statisticsData = [
  {
    key: "activeBookings",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: Calendar,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    description: "Active rentals today",
    descriptionId: "Rental aktif hari ini",
  },
  {
    key: "availableVehicles",
    value: "18",
    change: "-3",
    trend: "down",
    icon: Car,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
    description: "Ready for rent",
    descriptionId: "Siap disewakan",
  },
  {
    key: "todayRevenue",
    value: "Rp 12.5M",
    change: "+8.2%",
    trend: "up",
    icon: DollarSign,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
    description: "Today's earnings",
    descriptionId: "Pendapatan hari ini",
  },
  {
    key: "customers",
    value: "156",
    change: "+23",
    trend: "up",
    icon: Users,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/50",
    description: "Total customers",
    descriptionId: "Total pelanggan",
  },
  {
    key: "maintenance",
    value: "3",
    change: "+1",
    trend: "up",
    icon: Wrench,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
    description: "In maintenance",
    descriptionId: "Dalam perawatan",
  },
  {
    key: "overdue",
    value: "2",
    change: "-1",
    trend: "down",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/50",
    description: "Overdue returns",
    descriptionId: "Terlambat kembali",
  },
]

export function StatisticsTable() {
  const { t, language } = useLanguage()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-space-grotesk tracking-tight">
          {language === "id" ? "Statistik Hari Ini" : "Today's Statistics"}
        </h2>
        <Badge variant="outline" className="text-xs">
          {language === "id" ? "Real-time" : "Real-time"}
        </Badge>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statisticsData.map((stat) => (
          <Card key={stat.key} className="kpi-card relative overflow-hidden card-hover shadow-theme">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className={`rounded-lg p-2 ${stat.bgColor} border border-border/50`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <Badge
                variant={stat.trend === "up" ? "default" : "secondary"}
                className={`text-[10px] px-1 py-0 h-5 ${
                  stat.trend === "up"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800"
                    : stat.trend === "down" && stat.key === "overdue"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800"
                      : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp className="h-2 w-2 mr-1" />
                ) : (
                  <TrendingDown className="h-2 w-2 mr-1" />
                )}
                {stat.change}
              </Badge>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground font-space-grotesk">{stat.value}</div>
                <CardTitle className="text-xs font-medium text-muted-foreground font-manrope leading-tight">
                  {t(stat.key as keyof typeof import("@/lib/i18n").translations.en)}
                </CardTitle>
                <p className="text-[10px] text-muted-foreground font-manrope">
                  {language === "id" ? stat.descriptionId : stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
