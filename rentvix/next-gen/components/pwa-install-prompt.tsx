"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const { t, language } = useLanguage()

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  if (!showPrompt || !deferredPrompt) return null

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 shadow-lg border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              {language === "id" ? "Install RentVix Pro" : "Install RentVix Pro"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "id"
                ? "Install aplikasi untuk akses yang lebih cepat dan pengalaman seperti aplikasi native."
                : "Install the app for faster access and a native app experience."}
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleInstall} className="gap-2">
                <Download className="h-3 w-3" />
                {language === "id" ? "Install" : "Install"}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                {language === "id" ? "Nanti" : "Later"}
              </Button>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
