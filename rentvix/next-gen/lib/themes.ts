export interface Theme {
  id: string
  name: string
  nameId: string
  description: string
  descriptionId: string
  colors: {
    primary: string
    secondary: string
    accent: string
    muted: string
    background: string
    foreground: string
    card: string
    border: string
  }
  gradient: string
  preview: {
    primary: string
    secondary: string
    accent: string
  }
}

export const themes: Theme[] = [
  {
    id: "powerful",
    name: "Powerful",
    nameId: "Powerful",
    description: "Bold electric theme with neon cyan and blue",
    descriptionId: "Tema elektrik bold dengan cyan dan biru neon",
    colors: {
      primary: "195 100% 55%", // Bright neon cyan
      secondary: "217 91% 65%", // Bright electric blue
      accent: "195 100% 65%", // Light neon cyan
      muted: "210 40% 95%",
      background: "222 84% 5%", // Dark slate
      foreground: "195 100% 90%", // Light cyan
      card: "222 84% 8%",
      border: "195 50% 25%",
    },
    gradient: "from-cyan-400 via-blue-500 to-indigo-500",
    preview: {
      primary: "#00e5ff", // Neon cyan
      secondary: "#4f8fff", // Electric blue
      accent: "#33f0ff", // Light neon cyan
    },
  },
  {
    id: "ceria",
    name: "Ceria",
    nameId: "Ceria",
    description: "Vibrant neon theme with electric lime and golden yellow",
    descriptionId: "Tema cerah neon dengan lime elektrik dan kuning emas",
    colors: {
      primary: "84 100% 55%", // Bright neon lime
      secondary: "45 100% 60%", // Bright golden yellow
      accent: "84 100% 65%", // Light neon lime
      muted: "60 9% 98%",
      background: "222 84% 5%", // Dark slate
      foreground: "84 100% 90%", // Light lime
      card: "222 84% 8%",
      border: "84 60% 30%",
    },
    gradient: "from-lime-400 via-yellow-400 to-green-400",
    preview: {
      primary: "#84ff00", // Neon lime
      secondary: "#ffdd00", // Golden yellow
      accent: "#a3ff33", // Light neon lime
    },
  },
  {
    id: "run",
    name: "Run",
    nameId: "Run",
    description: "Dynamic neon theme with blazing orange and electric red",
    descriptionId: "Tema dinamis neon dengan oranye berapi dan merah elektrik",
    colors: {
      primary: "24 100% 60%", // Bright neon orange
      secondary: "0 100% 65%", // Bright electric red
      accent: "24 100% 70%", // Light neon orange
      muted: "24 100% 97%",
      background: "222 84% 5%", // Dark slate
      foreground: "24 100% 90%", // Light orange
      card: "222 84% 8%",
      border: "24 60% 30%",
    },
    gradient: "from-orange-400 via-red-500 to-pink-500",
    preview: {
      primary: "#ff6600", // Neon orange
      secondary: "#ff3333", // Electric red
      accent: "#ff8533", // Light neon orange
    },
  },
  {
    id: "calm",
    name: "Calm",
    nameId: "Calm",
    description: "Serene neon theme with electric blue and mystical teal",
    descriptionId: "Tema tenang neon dengan biru elektrik dan teal mistis",
    colors: {
      primary: "200 100% 60%", // Bright neon blue
      secondary: "180 100% 55%", // Bright teal
      accent: "200 100% 70%", // Light neon blue
      muted: "210 40% 98%",
      background: "222 84% 5%", // Dark slate
      foreground: "200 100% 90%", // Light blue
      card: "222 84% 8%",
      border: "200 60% 30%",
    },
    gradient: "from-blue-400 via-cyan-400 to-teal-400",
    preview: {
      primary: "#0099ff", // Neon blue
      secondary: "#00dddd", // Bright teal
      accent: "#33aaff", // Light neon blue
    },
  },
]
