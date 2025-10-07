export const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    transactions: "Transactions",
    operations: "Operations",
    reports: "Reports",
    masterData: "Master Data",
    users: "Users",
    settings: "Settings",
    customers: "Customers",
    support: "Support",

    // Transactions
    bookingRental: "Booking Rental",
    rentalSchedule: "Rental Schedule",
    digitalContract: "Digital Contract",
    vehicleHandover: "Vehicle Handover",
    vehicleReturn: "Vehicle Return",
    invoicePayment: "Invoice Payment",

    // Operations
    vehicleManagement: "Vehicle Management",
    maintenanceSchedule: "Maintenance Schedule",
    maintenanceHistory: "Maintenance History",
    driverCrew: "Driver Crew",
    driverAllowance: "Driver Allowance",
    fuelMonitoring: "Fuel Monitoring",

    // Reports
    transactionReports: "Transaction Reports",
    vehicleUsageReports: "Vehicle Usage Reports",
    financialReports: "Financial Reports",
    profitLossPerUnit: "Profit Loss Per Unit",
    fleetKpiStats: "Fleet KPI Stats",

    // Users
    userLevels: "User Levels",
    accessControl: "Access Control",
    userData: "User Data",

    // Settings
    rentalPricing: "Rental Pricing",
    accessRights: "Access Rights",
    whatsappSender: "WhatsApp Sender",
    remindersNotifications: "Reminders Notifications",
    contractTemplates: "Contract Templates",

    // Customers
    customerData: "Customer Data",
    customerLogin: "Customer Login",
    bookingHistory: "Booking History",
    couponsRewards: "Coupons Rewards",
    shareApp: "Share App",

    // Support
    manualBook: "Manual Book",
    faq: "FAQ",
    tutorialVideos: "Tutorial Videos",
    contactSupport: "Contact Support",
  },
  id: {
    // Navigation
    dashboard: "Dashboard",
    transactions: "Transaksi",
    operations: "Operasional",
    reports: "Laporan",
    masterData: "Master Data",
    users: "Pengguna",
    settings: "Pengaturan",
    customers: "Pelanggan",
    support: "Bantuan",

    // Transactions
    bookingRental: "Booking Rental",
    rentalSchedule: "Jadwal Rental",
    digitalContract: "Kontrak Digital",
    vehicleHandover: "Serah Terima Kendaraan",
    vehicleReturn: "Pengembalian Kendaraan",
    invoicePayment: "Invoice Pembayaran",

    // Operations
    vehicleManagement: "Manajemen Kendaraan",
    maintenanceSchedule: "Jadwal Maintenance",
    maintenanceHistory: "Riwayat Maintenance",
    driverCrew: "Driver Crew",
    driverAllowance: "Uang Jalan Driver",
    fuelMonitoring: "Monitoring BBM",

    // Reports
    transactionReports: "Laporan Transaksi",
    vehicleUsageReports: "Laporan Penggunaan Kendaraan",
    financialReports: "Laporan Keuangan",
    profitLossPerUnit: "Laba Rugi Per Unit",
    fleetKpiStats: "Statistik KPI Armada",

    // Users
    userLevels: "Level User",
    accessControl: "Kontrol Akses",
    userData: "Data User",

    // Settings
    rentalPricing: "Harga Rental",
    accessRights: "Hak Akses",
    whatsappSender: "WhatsApp Sender",
    remindersNotifications: "Pengingat Notifikasi",
    contractTemplates: "Template Kontrak",

    // Customers
    customerData: "Data Pelanggan",
    customerLogin: "Login Pelanggan",
    bookingHistory: "Riwayat Booking",
    couponsRewards: "Kupon Reward",
    shareApp: "Bagikan Aplikasi",

    // Support
    manualBook: "Buku Manual",
    faq: "FAQ",
    tutorialVideos: "Video Tutorial",
    contactSupport: "Hubungi Support",
  },
}

export type TranslationKey = keyof typeof translations.en

export function useTranslation(language: "en" | "id") {
  return {
    t: (key: TranslationKey) => translations[language][key] || key,
  }
}
