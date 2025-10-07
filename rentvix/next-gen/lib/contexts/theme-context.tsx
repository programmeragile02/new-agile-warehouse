"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { themes, type Theme } from "@/lib/themes"

type ThemeMode = "light" | "dark"

interface ThemeContextType {
  themeMode: ThemeMode
  currentTheme: Theme
  setThemeMode: (mode: ThemeMode) => void
  setCurrentTheme: (theme: Theme) => void
  applyTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light")
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0])

  const applyTheme = (theme: Theme) => {
    setCurrentTheme(theme)

    // Remove existing theme classes
    document.documentElement.classList.remove("theme-powerful", "theme-ceria", "theme-run", "theme-calm")

    // Add new theme class
    document.documentElement.classList.add(`theme-${theme.id}`)

    // Apply theme colors to CSS variables
    const root = document.documentElement

    // Apply theme-specific primary colors
    root.style.setProperty("--primary", theme.colors.primary)
    root.style.setProperty("--secondary", theme.colors.secondary)
    root.style.setProperty("--accent", theme.colors.accent)

    // Update chart colors
    root.style.setProperty("--chart-1", theme.colors.primary)
    root.style.setProperty("--chart-2", theme.colors.secondary)
    root.style.setProperty("--chart-3", theme.colors.accent)

    // Update sidebar colors
    root.style.setProperty("--sidebar-primary", theme.colors.primary)
    root.style.setProperty("--sidebar-accent", theme.colors.accent)

    // Apply mode-specific colors
    if (document.documentElement.classList.contains("dark")) {
      // Dark mode colors
      root.style.setProperty("--background", "222.2 84% 4.9%")
      root.style.setProperty("--foreground", "210 40% 98%")
      root.style.setProperty("--card", "222.2 84% 4.9%")
      root.style.setProperty("--card-foreground", "210 40% 98%")
      root.style.setProperty("--muted", "217.2 32.6% 17.5%")
      root.style.setProperty("--muted-foreground", "215 20.2% 65.1%")
      root.style.setProperty("--border", "217.2 32.6% 17.5%")
      root.style.setProperty("--input", "217.2 32.6% 17.5%")
    } else {
      // Light mode colors
      root.style.setProperty("--background", "0 0% 100%")
      root.style.setProperty("--foreground", "222.2 84% 4.9%")
      root.style.setProperty("--card", "0 0% 100%")
      root.style.setProperty("--card-foreground", "222.2 84% 4.9%")
      root.style.setProperty("--muted", "210 40% 96%")
      root.style.setProperty("--muted-foreground", "215.4 16.3% 46.9%")
      root.style.setProperty("--border", "214.3 31.8% 91.4%")
      root.style.setProperty("--input", "214.3 31.8% 91.4%")
    }

    // Save to localStorage
    localStorage.setItem("rentvix-current-theme", theme.id)

    console.log(`Theme "${theme.name}" applied successfully!`)
  }

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode)
    localStorage.setItem("rentvix-theme-mode", mode)

    if (mode === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Reapply current theme with new mode
    applyTheme(currentTheme)
  }

  useEffect(() => {
    // Load saved theme on mount
    const savedThemeId = localStorage.getItem("rentvix-current-theme")
    const savedThemeMode = localStorage.getItem("rentvix-theme-mode") as ThemeMode

    if (savedThemeMode) {
      handleSetThemeMode(savedThemeMode)
    }

    if (savedThemeId) {
      const savedTheme = themes.find((t) => t.id === savedThemeId)
      if (savedTheme) {
        applyTheme(savedTheme)
      }
    }
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        currentTheme,
        setThemeMode: handleSetThemeMode,
        setCurrentTheme,
        applyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
