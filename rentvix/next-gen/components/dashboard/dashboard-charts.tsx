"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts"
import { ChevronDown, ChevronUp, TrendingUp, Users, Star, Wrench, Fuel, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/contexts/language-context"

// Sample data
const revenueData = [
  { month: "Jan", revenue: 12500000, bookings: 45 },
  { month: "Feb", revenue: 15200000, bookings: 52 },
  { month: "Mar", revenue: 18700000, bookings: 61 },
  { month: "Apr", revenue: 16800000, bookings: 58 },
  { month: "May", revenue: 21300000, bookings: 67 },
  { month: "Jun", revenue: 19500000, bookings: 63 },
  { month: "Jul", revenue: 23100000, bookings: 72 },
  { month: "Aug", revenue: 25600000, bookings: 78 },
  { month: "Sep", revenue: 22400000, bookings: 69 },
  { month: "Oct", revenue: 27800000, bookings: 84 },
  { month: "Nov", revenue: 31200000, bookings: 92 },
  { month: "Dec", revenue: 28900000, bookings: 87 },
]

const fleetStatusData = [
  { name: "Available", value: 18, color: "#10b981" },
  { name: "Rented", value: 24, color: "#3b82f6" },
  { name: "Maintenance", value: 3, color: "#f59e0b" },
]

const weeklyBookingsData = [
  { day: "Mon", bookings: 12 },
  { day: "Tue", bookings: 19 },
  { day: "Wed", bookings: 15 },
  { day: "Thu", bookings: 22 },
  { day: "Fri", bookings: 28 },
  { day: "Sat", bookings: 35 },
  { day: "Sun", bookings: 18 },
]

const topCustomers = [
  { name: "PT. Maju Jaya", bookings: 24, revenue: 12500000 },
  { name: "CV. Sukses Mandiri", bookings: 18, revenue: 9800000 },
  { name: "John Doe", bookings: 15, revenue: 7200000 },
  { name: "Jane Smith", bookings: 12, revenue: 6100000 },
  { name: "Ahmad Wijaya", bookings: 10, revenue: 5400000 },
]

const vehicleUsage = [
  { vehicle: "Toyota Avanza", usage: 85, bookings: 24 },
  { vehicle: "Honda Civic", usage: 72, bookings: 18 },
  { vehicle: "Suzuki Ertiga", usage: 68, bookings: 15 },
  { vehicle: "Mitsubishi Xpander", usage: 91, bookings: 28 },
  { vehicle: "Daihatsu Terios", usage: 45, bookings: 12 },
]

const maintenanceSchedule = [
  { vehicle: "B 1234 ABC", type: "Service Rutin", date: "2025-01-28", status: "scheduled" },
  { vehicle: "B 5678 DEF", type: "Ganti Oli", date: "2025-01-30", status: "overdue" },
  { vehicle: "B 9012 GHI", type: "Cek Ban", date: "2025-02-02", status: "scheduled" },
  { vehicle: "B 3456 JKL", type: "Service Besar", date: "2025-02-05", status: "scheduled" },
]

const fuelConsumptionData = [
  { month: "Jan", consumption: 1250, cost: 18750000 },
  { month: "Feb", consumption: 1420, cost: 21300000 },
  { month: "Mar", consumption: 1680, cost: 25200000 },
  { month: "Apr", consumption: 1580, cost: 23700000 },
  { month: "May", consumption: 1890, cost: 28350000 },
  { month: "Jun", consumption: 1750, cost: 26250000 },
]

const performanceData = [
  { month: "Jan", efficiency: 78, satisfaction: 4.2, onTime: 92 },
  { month: "Feb", efficiency: 82, satisfaction: 4.4, onTime: 94 },
  { month: "Mar", efficiency: 85, satisfaction: 4.6, onTime: 96 },
  { month: "Apr", efficiency: 80, satisfaction: 4.3, onTime: 93 },
  { month: "May", efficiency: 88, satisfaction: 4.7, onTime: 97 },
  { month: "Jun", efficiency: 91, satisfaction: 4.8, onTime: 98 },
]

const regionalBookingsData = [
  { region: "Jakarta", bookings: 45, revenue: 18500000 },
  { region: "Bandung", bookings: 32, revenue: 12800000 },
  { region: "Surabaya", bookings: 28, revenue: 11200000 },
  { region: "Medan", bookings: 22, revenue: 8800000 },
  { region: "Makassar", bookings: 18, revenue: 7200000 },
]

const regionalRevenueData = [
  { region: "Jakarta", revenue: 18500000 },
  { region: "Bandung", revenue: 12800000 },
  { region: "Surabaya", revenue: 11200000 },
  { region: "Medan", revenue: 8800000 },
  { region: "Makassar", revenue: 7200000 },
]

export function DashboardCharts() {
  const [showAllCharts, setShowAllCharts] = useState(false)
  const { language } = useLanguage()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{" "}
              {typeof entry.value === "number" && entry.value > 1000000
                ? formatCurrency(entry.value)
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const initialCharts = [
    // Revenue Trend Chart
    <Card key="revenue-trend" className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {language === "id" ? "Tren Pendapatan" : "Revenue Trend"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `${value / 1000000}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>,

    // Fleet Status Chart
    <Card key="fleet-status">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center">
            <div className="h-2 w-2 rounded bg-primary" />
          </div>
          {language === "id" ? "Status Armada" : "Fleet Status"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={fleetStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {fleetStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-4">
          {fleetStatusData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-muted-foreground">
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>,

    // Weekly Bookings Chart
    <Card key="weekly-bookings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <div className="h-2 w-2 rounded bg-green-600" />
          </div>
          {language === "id" ? "Booking Mingguan" : "Weekly Bookings"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyBookingsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>,

    // Top Customers
    <Card key="top-customers">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {language === "id" ? "Pelanggan Teratas" : "Top Customers"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topCustomers.map((customer, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.bookings} bookings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">{formatCurrency(customer.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>,
  ]

  const additionalCharts = [
    // Vehicle Usage
    <Card key="vehicle-usage" className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <div className="h-2 w-2 rounded bg-blue-600" />
          </div>
          {language === "id" ? "Utilisasi Kendaraan" : "Vehicle Usage"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vehicleUsage.map((vehicle, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{vehicle.vehicle}</span>
                <span className="text-sm text-muted-foreground">
                  {vehicle.usage}% ({vehicle.bookings} bookings)
                </span>
              </div>
              <Progress value={vehicle.usage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>,

    // Maintenance Schedule
    <Card key="maintenance-schedule">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-orange-500" />
          {language === "id" ? "Jadwal Perawatan" : "Maintenance Schedule"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {maintenanceSchedule.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{item.vehicle}</p>
                <p className="text-xs text-muted-foreground">{item.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">{item.date}</p>
                <Badge
                  variant={item.status === "overdue" ? "destructive" : "secondary"}
                  className="text-xs flex items-center justify-center text-center"
                >
                  {item.status === "overdue" ? "Terlambat" : "Terjadwal"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>,

    // Fuel Consumption
    <Card key="fuel-consumption" className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5 text-red-500" />
          {language === "id" ? "Konsumsi BBM" : "Fuel Consumption"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={fuelConsumptionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="consumption"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>,

    // Performance Metrics
    <Card key="performance-metrics" className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          {language === "id" ? "Metrik Performa" : "Performance Metrics"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="efficiency" stroke="#8b5cf6" strokeWidth={2} name="Efficiency (%)" />
            <Line type="monotone" dataKey="onTime" stroke="#10b981" strokeWidth={2} name="On Time (%)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>,

    // Regional Bookings
    <Card key="regional-bookings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-indigo-500" />
          {language === "id" ? "Booking Regional" : "Regional Bookings"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={regionalBookingsData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              type="category"
              dataKey="region"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="bookings" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>,

    // Regional Revenue
    <Card key="regional-revenue">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-500" />
          {language === "id" ? "Pendapatan Regional" : "Regional Revenue"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={regionalRevenueData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `${value / 1000000}M`}
            />
            <YAxis
              type="category"
              dataKey="region"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>,
  ]

  const visibleCharts = showAllCharts ? [...initialCharts, ...additionalCharts] : initialCharts

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {language === "id" ? "Analitik Dashboard" : "Dashboard Analytics"}
        </h2>
        <div className="text-sm text-muted-foreground">
          {language === "id"
            ? `Menampilkan ${visibleCharts.length} dari ${initialCharts.length + additionalCharts.length} grafik`
            : `Showing ${visibleCharts.length} of ${initialCharts.length + additionalCharts.length} charts`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{visibleCharts}</div>

      <div className="flex justify-center">
        <Button onClick={() => setShowAllCharts(!showAllCharts)} variant="outline" className="gap-2">
          {showAllCharts ? (
            <>
              <ChevronUp className="h-4 w-4" />
              {language === "id" ? "Sembunyikan Chart" : "Hide Charts"}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              {language === "id" ? "Lihat Semua Chart" : "Show All Charts"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
