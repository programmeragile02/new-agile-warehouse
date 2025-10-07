"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, Car, Users, X } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"

const fabActions = [
  { icon: Calendar, label: "New Booking", href: "/bookings/new" },
  { icon: Car, label: "Add Vehicle", href: "/vehicles/new" },
  { icon: Users, label: "Add Customer", href: "/customers/new" },
]

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { language } = useLanguage()

  return (
    <div className="fab md:hidden">
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3">
          {fabActions.map((action, index) => (
            <Button
              key={action.href}
              size="sm"
              className="w-full justify-start gap-2 shadow-lg"
              style={{ animationDelay: `${index * 50}ms` }}
              asChild
            >
              <a href={action.href} onClick={() => setIsOpen(false)}>
                <action.icon className="h-4 w-4" />
                {action.label}
              </a>
            </Button>
          ))}
        </div>
      )}

      <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  )
}
