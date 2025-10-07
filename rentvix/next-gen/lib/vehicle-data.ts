export interface Vehicle {
  id: string
  plateNumber: string
  brand: string
  model: string
  year: number
  color: string
  type: "Car" | "SUV" | "Van" | "Truck" | "Motorcycle"
  fuelType: "Gasoline" | "Diesel" | "Electric" | "Hybrid"
  transmission: "Manual" | "Automatic" | "CVT"
  seats: number
  dailyRate: number
  location: string
  status: "Available" | "Rented" | "Maintenance" | "Out of Service"
  mileage: number
  description?: string
  features: string[]
  images: string[]
  lastMaintenance?: string
  nextMaintenance?: string
  insurance?: {
    provider: string
    policyNumber: string
    expiryDate: string
  }
}

export const sampleVehicles: Vehicle[] = [
  {
    id: "1",
    plateNumber: "B 1234 ABC",
    brand: "Toyota",
    model: "Avanza",
    year: 2023,
    color: "White",
    type: "Car",
    fuelType: "Gasoline",
    transmission: "Manual",
    seats: 7,
    dailyRate: 300000,
    location: "Jakarta",
    status: "Available",
    mileage: 15000,
    description:
      "Well-maintained Toyota Avanza perfect for family trips. Clean interior, good air conditioning, and reliable performance.",
    features: ["Air Conditioning", "Power Steering", "Central Lock", "Audio System", "USB Port"],
    images: [
      "/placeholder.svg?height=300&width=400&text=Toyota+Avanza+Front",
      "/placeholder.svg?height=300&width=400&text=Toyota+Avanza+Side",
      "/placeholder.svg?height=300&width=400&text=Toyota+Avanza+Interior",
    ],
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-07-15",
    insurance: {
      provider: "Asuransi Sinar Mas",
      policyNumber: "SM-2024-001234",
      expiryDate: "2024-12-31",
    },
  },
  {
    id: "2",
    plateNumber: "B 5678 DEF",
    brand: "Honda",
    model: "Brio",
    year: 2022,
    color: "Red",
    type: "Car",
    fuelType: "Gasoline",
    transmission: "Automatic",
    seats: 5,
    dailyRate: 250000,
    location: "Jakarta",
    status: "Rented",
    mileage: 25000,
    description: "Compact and fuel-efficient Honda Brio with automatic transmission. Perfect for city driving.",
    features: ["Air Conditioning", "Automatic Transmission", "Power Steering", "Electric Windows"],
    images: [
      "/placeholder.svg?height=300&width=400&text=Honda+Brio+Front",
      "/placeholder.svg?height=300&width=400&text=Honda+Brio+Side",
    ],
    lastMaintenance: "2024-02-10",
    nextMaintenance: "2024-08-10",
    insurance: {
      provider: "Asuransi Allianz",
      policyNumber: "AL-2024-005678",
      expiryDate: "2024-11-30",
    },
  },
  {
    id: "3",
    plateNumber: "B 9012 GHI",
    brand: "Daihatsu",
    model: "Xenia",
    year: 2021,
    color: "Silver",
    type: "Car",
    fuelType: "Gasoline",
    transmission: "Manual",
    seats: 7,
    dailyRate: 280000,
    location: "Bandung",
    status: "Available",
    mileage: 35000,
    description: "Spacious Daihatsu Xenia suitable for group travel. Comfortable seating for 7 passengers.",
    features: ["Air Conditioning", "Power Steering", "Central Lock", "Roof Rack"],
    images: [
      "/placeholder.svg?height=300&width=400&text=Daihatsu+Xenia+Front",
      "/placeholder.svg?height=300&width=400&text=Daihatsu+Xenia+Interior",
    ],
    lastMaintenance: "2024-01-20",
    nextMaintenance: "2024-07-20",
  },
  {
    id: "4",
    plateNumber: "B 3456 JKL",
    brand: "Mitsubishi",
    model: "Pajero Sport",
    year: 2023,
    color: "Black",
    type: "SUV",
    fuelType: "Diesel",
    transmission: "Automatic",
    seats: 7,
    dailyRate: 500000,
    location: "Jakarta",
    status: "Maintenance",
    mileage: 8000,
    description: "Premium SUV with excellent off-road capabilities. Perfect for adventure trips and family outings.",
    features: ["4WD", "Leather Seats", "Sunroof", "Navigation System", "Reverse Camera", "Cruise Control"],
    images: [
      "/placeholder.svg?height=300&width=400&text=Mitsubishi+Pajero+Front",
      "/placeholder.svg?height=300&width=400&text=Mitsubishi+Pajero+Side",
      "/placeholder.svg?height=300&width=400&text=Mitsubishi+Pajero+Interior",
    ],
    lastMaintenance: "2024-03-01",
    nextMaintenance: "2024-09-01",
    insurance: {
      provider: "Asuransi ACA",
      policyNumber: "ACA-2024-003456",
      expiryDate: "2025-01-15",
    },
  },
  {
    id: "5",
    plateNumber: "B 7890 MNO",
    brand: "Suzuki",
    model: "Ertiga",
    year: 2022,
    color: "Blue",
    type: "Car",
    fuelType: "Gasoline",
    transmission: "Manual",
    seats: 7,
    dailyRate: 320000,
    location: "Surabaya",
    status: "Available",
    mileage: 22000,
    description: "Reliable family car with good fuel efficiency. Comfortable for long-distance travel.",
    features: ["Air Conditioning", "Power Steering", "Central Lock", "Audio System", "Fog Lights"],
    images: ["/placeholder.svg?height=300&width=400&text=Suzuki+Ertiga+Front"],
    lastMaintenance: "2024-02-15",
    nextMaintenance: "2024-08-15",
  },
  {
    id: "6",
    plateNumber: "B 2468 PQR",
    brand: "Isuzu",
    model: "D-Max",
    year: 2023,
    color: "White",
    type: "Truck",
    fuelType: "Diesel",
    transmission: "Manual",
    seats: 5,
    dailyRate: 450000,
    location: "Jakarta",
    status: "Available",
    mileage: 12000,
    description: "Heavy-duty pickup truck perfect for cargo transport and construction work.",
    features: ["4WD", "Cargo Bed", "Towing Capacity", "Power Steering", "Air Conditioning"],
    images: [
      "/placeholder.svg?height=300&width=400&text=Isuzu+D-Max+Front",
      "/placeholder.svg?height=300&width=400&text=Isuzu+D-Max+Cargo",
    ],
    lastMaintenance: "2024-01-10",
    nextMaintenance: "2024-07-10",
    insurance: {
      provider: "Asuransi Jasindo",
      policyNumber: "JS-2024-002468",
      expiryDate: "2024-12-20",
    },
  },
  {
    id: "7",
    plateNumber: "B 1357 STU",
    brand: "Honda",
    model: "CR-V",
    year: 2023,
    color: "Gray",
    type: "SUV",
    fuelType: "Gasoline",
    transmission: "CVT",
    seats: 5,
    dailyRate: 480000,
    location: "Bandung",
    status: "Available",
    mileage: 9500,
    description: "Modern SUV with advanced safety features and comfortable interior. Great for family adventures.",
    features: ["CVT Transmission", "Honda Sensing", "Sunroof", "Leather Seats", "Navigation", "Reverse Camera"],
    images: [
      "/placeholder.svg?height=300&width=400&text=Honda+CR-V+Front",
      "/placeholder.svg?height=300&width=400&text=Honda+CR-V+Interior",
    ],
    lastMaintenance: "2024-02-28",
    nextMaintenance: "2024-08-28",
  },
  {
    id: "8",
    plateNumber: "B 9753 VWX",
    brand: "Toyota",
    model: "Hiace",
    year: 2022,
    color: "White",
    type: "Van",
    fuelType: "Diesel",
    transmission: "Manual",
    seats: 15,
    dailyRate: 600000,
    location: "Jakarta",
    status: "Out of Service",
    mileage: 45000,
    description: "Large capacity van perfect for group transportation and tours. Currently undergoing major service.",
    features: ["15 Seater", "Air Conditioning", "Power Steering", "Large Cargo Space"],
    images: ["/placeholder.svg?height=300&width=400&text=Toyota+Hiace+Front"],
    lastMaintenance: "2024-03-15",
    nextMaintenance: "2024-09-15",
  },
]
