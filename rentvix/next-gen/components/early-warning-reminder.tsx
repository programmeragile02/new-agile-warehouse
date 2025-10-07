"use client"

import { useState } from "react"
import { Bell, AlertTriangle, Clock, Car, CreditCard, Wrench, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLanguage } from "@/lib/contexts/language-context"

interface Warning {
  id: string
  type: "critical" | "warning" | "info"
  category: "vehicle" | "payment" | "maintenance" | "booking"
  title: string
  titleId: string
  message: string
  messageId: string
  time: string
  actionRequired: boolean
}

const mockWarnings: Warning[] = [
  {
    id: "1",
    type: "critical",
    category: "payment",
    title: "Overdue Payment Alert",
    titleId: "Peringatan Pembayaran Terlambat",
    message: "Invoice #INV-2025-001 is 5 days overdue. Customer: PT. Maju Jaya",
    messageId: "Invoice #INV-2025-001 terlambat 5 hari. Pelanggan: PT. Maju Jaya",
    time: "2 hours ago",
    actionRequired: true,
  },
  {
    id: "2",
    type: "warning",
    category: "maintenance",
    title: "Maintenance Due Soon",
    titleId: "Perawatan Segera Jatuh Tempo",
    message: "Vehicle B 1234 ABC requires service in 2 days",
    messageId: "Kendaraan B 1234 ABC memerlukan servis dalam 2 hari",
    time: "4 hours ago",
    actionRequired: true,
  },
  {
    id: "3",
    type: "warning",
    category: "vehicle",
    title: "Low Fuel Alert",
    titleId: "Peringatan BBM Rendah",
    message: "Vehicle B 5678 DEF has low fuel level (15%)",
    messageId: "Kendaraan B 5678 DEF memiliki BBM rendah (15%)",
    time: "6 hours ago",
    actionRequired: false,
  },
  {
    id: "4",
    type: "info",
    category: "booking",
    title: "Booking Reminder",
    titleId: "Pengingat Booking",
    message: "Upcoming booking tomorrow at 09:00 AM",
    messageId: "Booking besok pada pukul 09:00 WIB",
    time: "1 day ago",
    actionRequired: false,
  },
]

export function EarlyWarningReminder() {
  const [warnings, setWarnings] = useState<Warning[]>(mockWarnings)
  const [isOpen, setIsOpen] = useState(false)
  const { language } = useLanguage()

  const criticalCount = warnings.filter((w) => w.type === "critical").length
  const warningCount = warnings.filter((w) => w.type === "warning").length
  const totalCount = criticalCount + warningCount

  const dismissWarning = (id: string) => {
    setWarnings(warnings.filter((w) => w.id !== id))
  }

  const getIcon = (category: Warning["category"]) => {
    switch (category) {
      case "vehicle":
        return <Car className="h-4 w-4" />
      case "payment":
        return <CreditCard className="h-4 w-4" />
      case "maintenance":
        return <Wrench className="h-4 w-4" />
      case "booking":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: Warning["type"]) => {
    switch (type) {
      case "critical":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
      case "warning":
        return "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800"
      case "info":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      default:
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800"
    }
  }

  if (totalCount === 0) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-foreground hover:text-primary hover:bg-accent border border-foreground/20 hover:border-primary/30 transition-all duration-300 flex items-center justify-center relative"
      >
        <Bell className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-foreground hover:text-primary hover:bg-accent border border-foreground/20 hover:border-primary/30 transition-all duration-300 flex items-center justify-center relative"
        >
          <Bell className="h-4 w-4" />
          {totalCount > 0 && (
            <Badge
              variant={criticalCount > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-center text-xs font-medium min-w-[20px]"
            >
              {totalCount > 99 ? "99+" : totalCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {language === "id" ? "Peringatan Sistem" : "System Warnings"}
          </DialogTitle>
          <DialogDescription>
            {language === "id"
              ? `${totalCount} peringatan memerlukan perhatian Anda`
              : `${totalCount} warnings require your attention`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="space-y-3">
            {warnings.map((warning) => (
              <div key={warning.id} className={`p-3 rounded-lg border ${getTypeColor(warning.type)} relative`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissWarning(warning.id)}
                  className="absolute top-1 right-1 h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="flex items-start gap-3 pr-6">
                  <div className="mt-0.5">{getIcon(warning.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{language === "id" ? warning.titleId : warning.title}</h4>
                      {warning.actionRequired && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0.5 flex items-center justify-center text-center"
                        >
                          {language === "id" ? "Tindakan" : "Action"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs opacity-90 mb-2">{language === "id" ? warning.messageId : warning.message}</p>
                    <p className="text-xs opacity-70">{warning.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
