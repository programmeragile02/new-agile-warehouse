"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, CreditCard, CheckCircle } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"

const suggestions = [
  {
    id: 1,
    type: "overdue",
    title: "Overdue Returns",
    description: "3 vehicles are overdue for return",
    action: "Review Now",
    priority: "high",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
  {
    id: 2,
    type: "approval",
    title: "Pending Approvals",
    description: "5 bookings waiting for approval",
    action: "Approve",
    priority: "medium",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
  },
  {
    id: 3,
    type: "payment",
    title: "Outstanding Payments",
    description: "Rp 8,500,000 in pending payments",
    action: "Follow Up",
    priority: "high",
    icon: CreditCard,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  {
    id: 4,
    type: "maintenance",
    title: "Maintenance Due",
    description: "2 vehicles need scheduled maintenance",
    action: "Schedule",
    priority: "medium",
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
]

export function SmartSuggestions() {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("smartSuggestions")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="flex items-center gap-3 p-3 rounded-lg border">
            <div className={`rounded-lg p-2 ${suggestion.bgColor}`}>
              <suggestion.icon className={`h-4 w-4 ${suggestion.color}`} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{suggestion.title}</p>
                <Badge variant={suggestion.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                  {suggestion.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{suggestion.description}</p>
            </div>
            <Button size="sm" variant="outline">
              {suggestion.action}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
