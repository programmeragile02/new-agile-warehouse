// Revenue data for the last 12 months
export const revenueData = [
  { month: "Jan", revenue: 45000000, name: "Pendapatan" },
  { month: "Feb", revenue: 52000000, name: "Pendapatan" },
  { month: "Mar", revenue: 48000000, name: "Pendapatan" },
  { month: "Apr", revenue: 61000000, name: "Pendapatan" },
  { month: "May", revenue: 55000000, name: "Pendapatan" },
  { month: "Jun", revenue: 67000000, name: "Pendapatan" },
  { month: "Jul", revenue: 72000000, name: "Pendapatan" },
  { month: "Aug", revenue: 69000000, name: "Pendapatan" },
  { month: "Sep", revenue: 78000000, name: "Pendapatan" },
  { month: "Oct", revenue: 84000000, name: "Pendapatan" },
  { month: "Nov", revenue: 91000000, name: "Pendapatan" },
  { month: "Dec", revenue: 95000000, name: "Pendapatan" },
]

// Fleet status distribution
export const fleetStatusData = [
  { name: "Tersedia", value: 32, color: "#10b981" },
  { name: "Disewa", value: 28, color: "#3b82f6" },
  { name: "Maintenance", value: 8, color: "#f59e0b" },
  { name: "Tidak Aktif", value: 4, color: "#ef4444" },
]

// Weekly bookings data
export const weeklyBookingsData = [
  { day: "Sen", bookings: 12, completed: 10, name: "Booking" },
  { day: "Sel", bookings: 15, completed: 13, name: "Booking" },
  { day: "Rab", bookings: 18, completed: 16, name: "Booking" },
  { day: "Kam", bookings: 14, completed: 12, name: "Booking" },
  { day: "Jum", bookings: 22, completed: 20, name: "Booking" },
  { day: "Sab", bookings: 25, completed: 23, name: "Booking" },
  { day: "Min", bookings: 20, completed: 18, name: "Booking" },
]

// Top customers data
export const topCustomersData = [
  { name: "PT Maju Jaya", bookings: 24, revenue: 45000000, type: "Corporate" },
  { name: "John Doe", bookings: 18, revenue: 32000000, type: "Individual" },
  { name: "CV Sukses Mandiri", bookings: 15, revenue: 28000000, type: "Corporate" },
  { name: "Jane Smith", bookings: 12, revenue: 22000000, type: "Individual" },
  { name: "PT Global Tech", bookings: 10, revenue: 18000000, type: "Corporate" },
]

// Vehicle usage data
export const vehicleUsageData = [
  { vehicle: "Toyota Avanza", usage: 85, rentedDays: 26, totalDays: 30 },
  { vehicle: "Honda Civic", usage: 72, rentedDays: 22, totalDays: 30 },
  { vehicle: "Suzuki Ertiga", usage: 68, rentedDays: 20, totalDays: 30 },
  { vehicle: "Mitsubishi Xpander", usage: 60, rentedDays: 18, totalDays: 30 },
  { vehicle: "Toyota Innova", usage: 55, rentedDays: 17, totalDays: 30 },
]

// Maintenance schedule data
export const maintenanceScheduleData = [
  { vehicle: "Toyota Avanza B1234CD", type: "Service Rutin", status: "upcoming", dueDate: "2025-02-15" },
  { vehicle: "Honda Civic B5678EF", type: "Ganti Oli", status: "overdue", dueDate: "2025-01-20" },
  { vehicle: "Suzuki Ertiga B9012GH", type: "Tune Up", status: "scheduled", dueDate: "2025-02-25" },
  { vehicle: "Mitsubishi Xpander B3456IJ", type: "Service AC", status: "upcoming", dueDate: "2025-02-18" },
]

// Fuel consumption data
export const fuelConsumptionData = [
  { month: "Sep", consumption: 2400, cost: 18000000, name: "Konsumsi BBM" },
  { month: "Oct", consumption: 2600, cost: 19500000, name: "Konsumsi BBM" },
  { month: "Nov", consumption: 2800, cost: 21000000, name: "Konsumsi BBM" },
  { month: "Dec", consumption: 3200, cost: 24000000, name: "Konsumsi BBM" },
  { month: "Jan", consumption: 3000, cost: 22500000, name: "Konsumsi BBM" },
  { month: "Feb", consumption: 2900, cost: 21750000, name: "Konsumsi BBM" },
]

// Monthly comparison data
export const monthlyComparisonData = {
  currentMonth: {
    revenue: 95000000,
    bookings: 156,
    customers: 89,
    utilization: 78,
  },
  previousMonth: {
    revenue: 84000000,
    bookings: 142,
    customers: 82,
    utilization: 72,
  },
}

// Bookings data for the bookings page
export const bookingsData = [
  {
    id: "BK001",
    bookingCode: "BK001",
    customerName: "John Doe",
    customerPhone: "+62 812-3456-7890",
    customerEmail: "john.doe@email.com",
    vehicleType: "Toyota Avanza",
    vehiclePlate: "B 1234 CD",
    startDate: "2025-01-20",
    endDate: "2025-01-23",
    duration: 3,
    status: "active",
    totalCost: 1500000,
    paymentStatus: "paid",
    pickupLocation: "Jakarta Pusat",
    dropoffLocation: "Jakarta Selatan",
    driverName: "Ahmad Wijaya",
    driverPhone: "+62 813-9876-5432",
    notes: "Perjalanan bisnis ke Bandung",
    createdAt: "2025-01-18T10:30:00Z",
    updatedAt: "2025-01-20T08:15:00Z",
  },
  {
    id: "BK002",
    bookingCode: "BK002",
    customerName: "Jane Smith",
    customerPhone: "+62 821-5555-1234",
    customerEmail: "jane.smith@email.com",
    vehicleType: "Honda Civic",
    vehiclePlate: "B 5678 EF",
    startDate: "2025-01-25",
    endDate: "2025-01-30",
    duration: 5,
    status: "pending",
    totalCost: 2500000,
    paymentStatus: "pending",
    pickupLocation: "Bandung",
    dropoffLocation: "Surabaya",
    driverName: "Budi Santoso",
    driverPhone: "+62 814-1111-2222",
    notes: "Liburan keluarga",
    createdAt: "2025-01-22T14:20:00Z",
    updatedAt: "2025-01-22T14:20:00Z",
  },
  {
    id: "BK003",
    bookingCode: "BK003",
    customerName: "Ahmad Wijaya",
    customerPhone: "+62 856-7777-8888",
    customerEmail: "ahmad.wijaya@email.com",
    vehicleType: "Suzuki Ertiga",
    vehiclePlate: "B 9012 GH",
    startDate: "2025-01-10",
    endDate: "2025-01-12",
    duration: 2,
    status: "completed",
    totalCost: 1000000,
    paymentStatus: "paid",
    pickupLocation: "Jakarta Barat",
    dropoffLocation: "Jakarta Timur",
    driverName: "Siti Nurhaliza",
    driverPhone: "+62 815-3333-4444",
    notes: "Acara keluarga",
    createdAt: "2025-01-08T09:00:00Z",
    updatedAt: "2025-01-12T18:30:00Z",
  },
  {
    id: "BK004",
    bookingCode: "BK004",
    customerName: "Siti Nurhaliza",
    customerPhone: "+62 877-9999-0000",
    customerEmail: "siti.nurhaliza@email.com",
    vehicleType: "Mitsubishi Xpander",
    vehiclePlate: "B 3456 IJ",
    startDate: "2025-02-01",
    endDate: "2025-02-06",
    duration: 5,
    status: "cancelled",
    totalCost: 3000000,
    paymentStatus: "refunded",
    pickupLocation: "Yogyakarta",
    dropoffLocation: "Solo",
    driverName: "Michael Johnson",
    driverPhone: "+62 816-5555-6666",
    notes: "Dibatalkan karena perubahan jadwal",
    createdAt: "2025-01-28T11:45:00Z",
    updatedAt: "2025-01-30T16:20:00Z",
  },
  {
    id: "BK005",
    bookingCode: "BK005",
    customerName: "Michael Johnson",
    customerPhone: "+62 888-1111-2222",
    customerEmail: "michael.johnson@email.com",
    vehicleType: "Toyota Innova",
    vehiclePlate: "B 7890 KL",
    startDate: "2025-02-05",
    endDate: "2025-02-10",
    duration: 5,
    status: "draft",
    totalCost: 2750000,
    paymentStatus: "unpaid",
    pickupLocation: "Semarang",
    dropoffLocation: "Malang",
    driverName: "Lisa Permata",
    driverPhone: "+62 817-7777-8888",
    notes: "Draft booking - belum dikonfirmasi",
    createdAt: "2025-02-01T13:15:00Z",
    updatedAt: "2025-02-01T13:15:00Z",
  },
  {
    id: "BK006",
    bookingCode: "BK006",
    customerName: "Lisa Permata",
    customerPhone: "+62 899-3333-4444",
    customerEmail: "lisa.permata@email.com",
    vehicleType: "Daihatsu Terios",
    vehiclePlate: "B 2468 MN",
    startDate: "2025-02-08",
    endDate: "2025-02-12",
    duration: 4,
    status: "active",
    totalCost: 2200000,
    paymentStatus: "partial",
    pickupLocation: "Bekasi",
    dropoffLocation: "Bogor",
    driverName: "John Doe",
    driverPhone: "+62 818-9999-0000",
    notes: "Perjalanan wisata alam",
    createdAt: "2025-02-05T08:30:00Z",
    updatedAt: "2025-02-08T07:45:00Z",
  },
]

// Legacy support - rentalData alias
export const rentalData = bookingsData
