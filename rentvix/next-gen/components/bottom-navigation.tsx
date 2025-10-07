"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Calendar, Car, Users, Plus, Bell, MessageSquare } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"
import { usePathname } from "next/navigation"

const bottomNavItems = [
  {
    id: "home",
    icon: Home,
    labelKey: "dashboard" as const,
    href: "/",
    badge: null,
  },
  {
    id: "bookings",
    icon: Calendar,
    labelKey: "bookingRental" as const,
    href: "/bookings",
    badge: "3",
  },
  {
    id: "vehicles",
    icon: Car,
    labelKey: "vehicleManagement" as const,
    href: "/vehicles",
    badge: null,
  },
  {
    id: "customers",
    icon: Users,
    labelKey: "customers" as const,
    href: "/customers",
    badge: null,
  },
]

const quickActions = [
  {
    id: "new-booking",
    icon: Plus,
    label: "New Booking",
    labelId: "Booking Baru",
    href: "/bookings/new",
    color: "bg-primary hover:bg-primary/90 text-primary-foreground",
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notifications",
    labelId: "Notifikasi",
    href: "/notifications",
    color: "bg-orange-500 hover:bg-orange-600 text-white",
    badge: "5",
  },
  {
    id: "support",
    icon: MessageSquare,
    label: "Support",
    labelId: "Bantuan",
    href: "/support",
    color: "bg-green-500 hover:bg-green-600 text-white",
  },
]

export function BottomNavigation() {
  const { t, language } = useLanguage()
  const pathname = usePathname()
  const [showQuickActions, setShowQuickActions] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Quick Actions Overlay */}
      {showQuickActions && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowQuickActions(false)}
        >
          <div className="absolute bottom-20 left-4 right-4 space-y-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                className={`w-full justify-start gap-3 h-12 shadow-lg font-manrope ${action.color}`}
                asChild
                onClick={() => setShowQuickActions(false)}
              >
                <a href={action.href}>
                  <div className="relative">
                    <action.icon className="h-5 w-5" />
                    {action.badge && (
                      <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[10px] bg-red-500 text-white border-0 flex items-center justify-center rounded-full">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium font-manrope">{language === "id" ? action.labelId : action.label}</span>
                </a>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar - 4 Items Only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border shadow-lg">
        <div className="grid grid-cols-4 safe-area-pb">
          {bottomNavItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`relative flex flex-col items-center justify-center gap-1 h-16 rounded-none transition-all duration-300 font-manrope ${
                isActive(item.href)
                  ? "text-primary bg-primary/10 border-t-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              asChild
            >
              <a href={item.href} className="flex flex-col items-center justify-center gap-1 w-full h-full">
                <div className="relative flex items-center justify-center">
                  <item.icon className={`h-5 w-5 ${isActive(item.href) ? "text-primary" : ""}`} />
                  {item.badge && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[9px] bg-red-500 text-white border-0 flex items-center justify-center rounded-full">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium leading-tight text-center font-manrope ${isActive(item.href) ? "text-primary" : ""}`}
                >
                  {t(item.labelKey)}
                </span>
              </a>
            </Button>
          ))}
        </div>
      </div>

      {/* Bottom padding for content to avoid overlap */}
      <div className="h-20 md:hidden" />
    </>
  )
}
