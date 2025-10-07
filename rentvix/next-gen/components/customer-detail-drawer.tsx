"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Edit,
  MessageSquare,
  Printer,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  User,
  CreditCard,
  Star,
  Clock,
} from "lucide-react"
import Link from "next/link"

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  whatsapp: string
  company: string
  position: string
  location: string
  address: string
  status: string
  type: string
  totalBookings: number
  totalRevenue: number
  lastBooking: string
  joinDate: string
  avatar: string
  idNumber: string
  dateOfBirth: string
  gender: string
  notes: string
  preferredContact: string
  creditLimit: number
  paymentTerms: number
}

interface CustomerDetailDrawerProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Sample rental history data
const sampleRentalHistory = [
  {
    id: 1,
    vehicleType: "Toyota Avanza",
    startDate: "2024-01-10",
    endDate: "2024-01-15",
    duration: "5 hari",
    amount: 1500000,
    status: "completed",
    rating: 5,
    notes: "Pelanggan sangat puas dengan layanan",
  },
  {
    id: 2,
    vehicleType: "Honda Civic",
    startDate: "2023-12-20",
    endDate: "2023-12-25",
    duration: "5 hari",
    amount: 2000000,
    status: "completed",
    rating: 4,
    notes: "Kendaraan dalam kondisi baik",
  },
  {
    id: 3,
    vehicleType: "Mitsubishi Pajero",
    startDate: "2023-11-15",
    endDate: "2023-11-20",
    duration: "5 hari",
    amount: 2500000,
    status: "completed",
    rating: 5,
    notes: "Excellent service, akan booking lagi",
  },
]

export function CustomerDetailDrawer({ customer, open, onOpenChange }: CustomerDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("personal")

  if (!customer) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      inactive: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      pending:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    }
    return variants[status as keyof typeof variants] || variants.active
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      corporate:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      individual:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
    }
    return variants[type as keyof typeof variants] || variants.individual
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      active: "Aktif / Active",
      inactive: "Nonaktif / Inactive",
      pending: "Pending / Pending",
    }
    return labels[status as keyof typeof labels] || status
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      corporate: "Perusahaan / Corporate",
      individual: "Perorangan / Individual",
    }
    return labels[type as keyof typeof labels] || type
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  const averageRating = sampleRentalHistory.reduce((acc, rental) => acc + rental.rating, 0) / sampleRentalHistory.length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={customer.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-lg">
                  {customer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">{customer.name}</SheetTitle>
                <SheetDescription className="text-base">{customer.company}</SheetDescription>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className={getStatusBadge(customer.status)}>
                    {getStatusLabel(customer.status)}
                  </Badge>
                  <Badge variant="outline" className={getTypeBadge(customer.type)}>
                    {getTypeLabel(customer.type)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{customer.totalBookings}</div>
                <div className="text-sm text-muted-foreground">Total Booking</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{formatCurrency(customer.totalRevenue)}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <div className="text-2xl font-bold text-primary">{averageRating.toFixed(1)}</div>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/customers/${customer.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Pelanggan / Edit Customer
              </Link>
            </Button>
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Data Pribadi / Personal</TabsTrigger>
            <TabsTrigger value="contact">Kontak / Contact</TabsTrigger>
            <TabsTrigger value="address">Alamat / Address</TabsTrigger>
            <TabsTrigger value="history">Riwayat / History</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informasi Pribadi / Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nama Lengkap / Full Name</label>
                    <p className="text-sm font-medium">{customer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nomor KTP / ID Number</label>
                    <p className="text-sm font-medium font-mono">{customer.idNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tanggal Lahir / Date of Birth</label>
                    <p className="text-sm font-medium">{new Date(customer.dateOfBirth).toLocaleDateString("id-ID")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Jenis Kelamin / Gender</label>
                    <p className="text-sm font-medium">
                      {customer.gender === "male" ? "Laki-laki / Male" : "Perempuan / Female"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tanggal Bergabung / Join Date</label>
                    <p className="text-sm font-medium">{new Date(customer.joinDate).toLocaleDateString("id-ID")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Kontak Preferensi / Preferred Contact
                    </label>
                    <p className="text-sm font-medium capitalize">{customer.preferredContact}</p>
                  </div>
                </div>
                {customer.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Catatan / Notes</label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Informasi Kontak / Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nomor Telepon / Phone Number</label>
                      <p className="text-sm font-medium font-mono">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                      <p className="text-sm font-medium font-mono">{customer.whatsapp}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm font-medium">{customer.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Informasi Perusahaan / Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nama Perusahaan / Company Name</label>
                    <p className="text-sm font-medium">{customer.company}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Posisi / Position</label>
                    <p className="text-sm font-medium">{customer.position}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Alamat / Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Alamat Lengkap / Full Address</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{customer.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Kota / City</label>
                  <p className="text-sm font-medium">{customer.location}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Informasi Kredit / Credit Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Limit Kredit / Credit Limit</label>
                    <p className="text-sm font-medium">{formatCurrency(customer.creditLimit)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Termin Pembayaran / Payment Terms
                    </label>
                    <p className="text-sm font-medium">{customer.paymentTerms} hari / days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Riwayat Sewa / Rental History</span>
                </CardTitle>
                <CardDescription>Total {sampleRentalHistory.length} transaksi / transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sampleRentalHistory.map((rental) => (
                  <div key={rental.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{rental.vehicleType}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(rental.startDate).toLocaleDateString("id-ID")} -{" "}
                              {new Date(rental.endDate).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                          <span>({rental.duration})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(rental.amount)}</div>
                        <div className="flex items-center space-x-1 mt-1">{renderStars(rental.rating)}</div>
                      </div>
                    </div>
                    {rental.notes && (
                      <div className="text-sm text-muted-foreground bg-muted p-2 rounded">{rental.notes}</div>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                      >
                        Selesai / Completed
                      </Badge>
                      <div className="text-xs text-muted-foreground">ID: #{rental.id.toString().padStart(4, "0")}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
