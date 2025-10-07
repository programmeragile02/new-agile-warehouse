export interface Template {
  id: string
  name: string
  nameId: string
  description: string
  descriptionId: string
  category: "theme"
  preview: string
  features: string[]
  featuresId: string[]
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  gradient: string
  selected?: boolean
}

export const templates: Template[] = [
  {
    id: "powerful",
    name: "Powerful",
    nameId: "Powerful",
    description: "Bold and professional theme with electric blue and dark accents",
    descriptionId: "Tema bold dan profesional dengan biru elektrik dan aksen gelap",
    category: "theme",
    preview: "/placeholder.svg?height=400&width=600&text=Powerful+Theme",
    features: [
      "Electric blue primary color",
      "Dark gray professional accents",
      "High contrast design",
      "Corporate-friendly appearance",
      "Bold typography emphasis",
    ],
    featuresId: [
      "Warna utama biru elektrik",
      "Aksen profesional abu-abu gelap",
      "Desain kontras tinggi",
      "Tampilan ramah korporat",
      "Penekanan tipografi tebal",
    ],
    colors: {
      primary: "hsl(217, 91%, 60%)",
      secondary: "hsl(215, 25%, 27%)",
      accent: "hsl(217, 91%, 70%)",
      background: "hsl(0, 0%, 100%)",
    },
    gradient: "from-blue-600 via-blue-500 to-indigo-600",
  },
  {
    id: "ceria",
    name: "Ceria",
    nameId: "Ceria",
    description: "Vibrant and energetic theme with bright lime and yellow colors",
    descriptionId: "Tema cerah dan energik dengan warna lime dan kuning terang",
    category: "theme",
    preview: "/placeholder.svg?height=400&width=600&text=Ceria+Theme",
    features: [
      "Bright lime green primary",
      "Cheerful yellow accents",
      "Energetic and vibrant feel",
      "Optimistic color palette",
      "Friendly user experience",
    ],
    featuresId: [
      "Hijau lime terang utama",
      "Aksen kuning ceria",
      "Nuansa energik dan cerah",
      "Palet warna optimis",
      "Pengalaman pengguna ramah",
    ],
    colors: {
      primary: "hsl(84, 81%, 44%)",
      secondary: "hsl(45, 93%, 47%)",
      accent: "hsl(84, 81%, 54%)",
      background: "hsl(0, 0%, 100%)",
    },
    gradient: "from-lime-500 via-yellow-400 to-green-500",
  },
  {
    id: "run",
    name: "Run",
    nameId: "Run",
    description: "Dynamic and active theme with orange and red energy colors",
    descriptionId: "Tema dinamis dan aktif dengan warna energi oranye dan merah",
    category: "theme",
    preview: "/placeholder.svg?height=400&width=600&text=Run+Theme",
    features: [
      "Dynamic orange primary",
      "Energetic red accents",
      "Action-oriented design",
      "High-energy color scheme",
      "Movement-inspired interface",
    ],
    featuresId: [
      "Oranye dinamis utama",
      "Aksen merah energik",
      "Desain berorientasi aksi",
      "Skema warna berenergi tinggi",
      "Interface terinspirasi gerakan",
    ],
    colors: {
      primary: "hsl(24, 95%, 53%)",
      secondary: "hsl(0, 84%, 60%)",
      accent: "hsl(24, 95%, 63%)",
      background: "hsl(0, 0%, 100%)",
    },
    gradient: "from-orange-500 via-red-500 to-pink-500",
  },
  {
    id: "calm",
    name: "Calm",
    nameId: "Calm",
    description: "Peaceful and serene theme with soft blues and gentle grays",
    descriptionId: "Tema damai dan tenang dengan biru lembut dan abu-abu halus",
    category: "theme",
    preview: "/placeholder.svg?height=400&width=600&text=Calm+Theme",
    features: [
      "Soft blue primary color",
      "Gentle gray accents",
      "Peaceful and relaxing",
      "Minimal distractions",
      "Zen-like user experience",
    ],
    featuresId: [
      "Warna utama biru lembut",
      "Aksen abu-abu halus",
      "Damai dan menenangkan",
      "Gangguan minimal",
      "Pengalaman pengguna seperti zen",
    ],
    colors: {
      primary: "hsl(200, 50%, 60%)",
      secondary: "hsl(210, 20%, 65%)",
      accent: "hsl(200, 50%, 70%)",
      background: "hsl(0, 0%, 100%)",
    },
    gradient: "from-blue-400 via-cyan-300 to-teal-400",
  },
]
