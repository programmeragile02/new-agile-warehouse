"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/contexts/language-context"
import { Car, CreditCard, Wrench, Calendar } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "booking",
    title: "New booking created",
    description: "Toyota Avanza - 3 days rental",
    user: "John Doe",
    time: "2 minutes ago",
    icon: Calendar,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    id: 2,
    type: "payment",
    title: "Payment received",
    description: "Invoice #INV-001 - Rp 1,500,000",
    user: "Jane Smith",
    time: "15 minutes ago",
    icon: CreditCard,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    id: 3,
    type: "maintenance",
    title: "Maintenance completed",
    description: "Honda Civic - Oil change",
    user: "Mechanic Team",
    time: "1 hour ago",
    icon: Wrench,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  {
    id: 4,
    type: "return",
    title: "Vehicle returned",
    description: "Suzuki Ertiga - B 5678 DEF",
    user: "Mike Johnson",
    time: "2 hours ago",
    icon: Car,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
]

export function RecentActivity() {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("recentActivity")}
          <Badge variant="secondary" className="ml-auto">
            {activities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${activity.bgColor}`}>
              <activity.icon className={`h-4 w-4 ${activity.color}`} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{activity.title}</p>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground">by {activity.user}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
