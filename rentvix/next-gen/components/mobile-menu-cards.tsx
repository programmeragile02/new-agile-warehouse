"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Car,
  Calendar,
  FileText,
  ArrowRightLeft,
  RotateCcw,
  CreditCard,
  Settings,
  Users,
  BarChart3,
  Wrench,
  History,
  UserCheck,
  Wallet,
  Fuel,
  TrendingUp,
  DollarSign,
  PieChart,
  Activity,
  Shield,
  MessageSquare,
  Bell,
  Receipt,
  Database,
  LogIn,
  Gift,
  Share2,
  BookOpen,
  HelpCircle,
  Video,
  MessageCircle,
  ChevronRight,
  Menu,
} from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"

const menuModules = [
  {
    id: "transactions",
    icon: Car,
    labelKey: "transactions" as const,
    description: "Manage bookings, contracts, and payments",
    descriptionId: "Kelola booking, kontrak, dan pembayaran",
    color: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    count: 24,
    items: [
      { icon: Calendar, labelKey: "bookingRental" as const, href: "/bookings" },
      { icon: Calendar, labelKey: "rentalSchedule" as const, href: "/schedule" },
      { icon: FileText, labelKey: "digitalContract" as const, href: "/contracts" },
      { icon: ArrowRightLeft, labelKey: "vehicleHandover" as const, href: "/handover" },
      { icon: RotateCcw, labelKey: "vehicleReturn" as const, href: "/returns" },
      { icon: CreditCard, labelKey: "invoicePayment" as const, href: "/invoices" },
    ],
  },
  {
    id: "operations",
    icon: Wrench,
    labelKey: "operations" as const,
    description: "Vehicle and driver management",
    descriptionId: "Manajemen kendaraan dan driver",
    color: "from-green-500 to-emerald-500",
    iconBg: "bg-green-100 dark:bg-green-900/50",
    iconColor: "text-green-600 dark:text-green-400",
    count: 18,
    items: [
      { icon: Car, labelKey: "vehicleManagement" as const, href: "/vehicles" },
      { icon: Calendar, labelKey: "maintenanceSchedule" as const, href: "/maintenance/schedule" },
      { icon: History, labelKey: "maintenanceHistory" as const, href: "/maintenance/history" },
      { icon: UserCheck, labelKey: "driverCrew" as const, href: "/drivers" },
      { icon: Wallet, labelKey: "driverAllowance" as const, href: "/driver-allowance" },
      { icon: Fuel, labelKey: "fuelMonitoring" as const, href: "/fuel-monitoring" },
    ],
  },
  {
    id: "reports",
    icon: BarChart3,
    labelKey: "reports" as const,
    description: "Analytics and financial reports",
    descriptionId: "Analitik dan laporan keuangan",
    color: "from-purple-500 to-violet-500",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    count: 12,
    items: [
      { icon: TrendingUp, labelKey: "transactionReports" as const, href: "/reports/transactions" },
      { icon: Car, labelKey: "vehicleUsageReports" as const, href: "/reports/usage" },
      { icon: DollarSign, labelKey: "financialReports" as const, href: "/reports/financial" },
      { icon: PieChart, labelKey: "profitLossPerUnit" as const, href: "/reports/profit-loss" },
      { icon: Activity, labelKey: "fleetKpiStats" as const, href: "/reports/kpi" },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    labelKey: "settings" as const,
    description: "System configuration and access",
    descriptionId: "Konfigurasi sistem dan akses",
    color: "from-orange-500 to-red-500",
    iconBg: "bg-orange-100 dark:bg-orange-900/50",
    iconColor: "text-orange-600 dark:text-orange-400",
    count: 8,
    items: [
      { icon: Receipt, labelKey: "rentalPricing" as const, href: "/settings/pricing" },
      { icon: Shield, labelKey: "accessRights" as const, href: "/settings/access" },
      { icon: MessageSquare, labelKey: "whatsappSender" as const, href: "/settings/whatsapp" },
      { icon: Bell, labelKey: "remindersNotifications" as const, href: "/settings/notifications" },
      { icon: FileText, labelKey: "contractTemplates" as const, href: "/settings/templates" },
    ],
  },
  {
    id: "customers",
    icon: Users,
    labelKey: "customers" as const,
    description: "Customer data and engagement",
    descriptionId: "Data pelanggan dan engagement",
    color: "from-pink-500 to-rose-500",
    iconBg: "bg-pink-100 dark:bg-pink-900/50",
    iconColor: "text-pink-600 dark:text-pink-400",
    count: 156,
    items: [
      { icon: Database, labelKey: "customerData" as const, href: "/customers" },
      { icon: LogIn, labelKey: "customerLogin" as const, href: "/customers/login" },
      { icon: History, labelKey: "bookingHistory" as const, href: "/customers/history" },
      { icon: Gift, labelKey: "couponsRewards" as const, href: "/customers/rewards" },
      { icon: Share2, labelKey: "shareApp" as const, href: "/customers/share" },
    ],
  },
  {
    id: "support",
    icon: HelpCircle,
    labelKey: "support" as const,
    description: "Help and documentation",
    descriptionId: "Bantuan dan dokumentasi",
    color: "from-teal-500 to-cyan-500",
    iconBg: "bg-teal-100 dark:bg-teal-900/50",
    iconColor: "text-teal-600 dark:text-teal-400",
    count: 4,
    items: [
      { icon: BookOpen, labelKey: "manualBook" as const, href: "/support/manual" },
      { icon: HelpCircle, labelKey: "faq" as const, href: "/support/faq" },
      { icon: Video, labelKey: "tutorialVideos" as const, href: "/support/tutorials" },
      { icon: MessageCircle, labelKey: "contactSupport" as const, href: "/support/contact" },
    ],
  },
]

export function MobileMenuCards() {
  const { t, language } = useLanguage()

  return (
    <div className="md:hidden">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-3 border border-primary/20">
          <Menu className="h-4 w-4" />
          <span className="text-sm font-manrope font-medium">{language === "id" ? "Menu Utama" : "Main Menu"}</span>
        </div>
        <h2 className="text-2xl font-bold font-space-grotesk tracking-tight text-foreground">
          {language === "id" ? "Pilih Modul" : "Select Module"}
        </h2>
        <p className="text-muted-foreground font-manrope mt-1">
          {language === "id" ? "Akses fitur dengan mudah" : "Access features easily"}
        </p>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {menuModules.map((module) => (
          <Dialog key={module.id}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/30 group bg-card text-card-foreground">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-3 rounded-xl ${module.iconBg} border border-border/50`}>
                      <module.icon className={`h-6 w-6 ${module.iconColor}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {module.count}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-space-grotesk font-bold leading-tight">
                    {t(module.labelKey)}
                  </CardTitle>
                  <CardDescription className="text-xs font-manrope leading-relaxed">
                    {language === "id" ? module.descriptionId : module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {module.items.length} {language === "id" ? "fitur" : "features"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>

            <DialogContent className="max-w-sm mx-auto bg-card text-card-foreground border-border">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-3 rounded-xl ${module.iconBg} border border-border/50`}>
                    <module.icon className={`h-6 w-6 ${module.iconColor}`} />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-space-grotesk font-bold">{t(module.labelKey)}</DialogTitle>
                    <DialogDescription className="text-sm font-manrope">
                      {language === "id" ? module.descriptionId : module.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-2 mt-4">
                {module.items.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 font-manrope hover:bg-primary/10 hover:text-primary"
                    asChild
                  >
                    <a href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{t(item.labelKey)}</span>
                    </a>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-4 bg-card text-card-foreground border-border">
          <div className="text-2xl font-bold text-primary">24</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </Card>
        <Card className="text-center p-4 bg-card text-card-foreground border-border">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">18</div>
          <div className="text-xs text-muted-foreground">Available</div>
        </Card>
        <Card className="text-center p-4 bg-card text-card-foreground border-border">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">12.5M</div>
          <div className="text-xs text-muted-foreground">Revenue</div>
        </Card>
      </div>
    </div>
  )
}
