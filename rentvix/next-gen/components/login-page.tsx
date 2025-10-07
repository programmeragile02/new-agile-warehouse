"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, User, Mail, Lock, Shield, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react"
import Image from "next/image"

type LoginStep = "company" | "user"
type AuthMethod = "password" | "otp"

interface LoginPageProps {
  onLoginSuccess: () => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [currentStep, setCurrentStep] = useState<LoginStep>("company")
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [companyData, setCompanyData] = useState({
    email: "",
    password: "",
    otp: "",
  })
  const [userData, setUserData] = useState({
    identifier: "",
    password: "",
    otp: "",
  })
  const [companyInfo, setCompanyInfo] = useState<{
    name: string
    logo: string
  } | null>(null)

  const handleCompanyLogin = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock successful company verification
    setCompanyInfo({
      name: "PT Rental Kendaraan Sejahtera",
      logo: "/rentvix-logo.png",
    })
    setCurrentStep("user")
    setIsLoading(false)
  }

  const handleUserLogin = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock successful login - redirect to dashboard
    setIsLoading(false)
    onLoginSuccess()
  }

  const sendOTP = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    // Show success message
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_hsl(var(--primary)/0.05)_0%,_transparent_50%)] bg-[radial-gradient(circle_at_80%_20%,_hsl(var(--secondary)/0.05)_0%,_transparent_50%)]" />

      <div className="relative w-full max-w-md mx-auto">
        {/* Logo and Brand */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Image
                src="/rentvix-logo.png"
                alt="RentVix Pro"
                width={24}
                height={24}
                className="md:w-8 md:h-8 rounded-lg"
              />
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">RentVix Pro</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Sistem Manajemen Rental Kendaraan Profesional</p>
        </div>

        <Card className="w-full shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-4 p-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-3 md:space-x-4">
              <div
                className={`flex items-center space-x-2 ${currentStep === "company" ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep === "company"
                      ? "bg-primary text-primary-foreground"
                      : companyInfo
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {companyInfo ? "✓" : "1"}
                </div>
                <span className="text-xs md:text-sm font-medium hidden sm:inline">Perusahaan</span>
              </div>
              <div className="w-6 md:w-8 h-px bg-border" />
              <div
                className={`flex items-center space-x-2 ${currentStep === "user" ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
                <span className="text-xs md:text-sm font-medium hidden sm:inline">Pengguna</span>
              </div>
            </div>

            {/* Company Info Display */}
            {companyInfo && (
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs md:text-sm text-foreground truncate">{companyInfo.name}</p>
                    <p className="text-xs text-muted-foreground">Perusahaan Terverifikasi</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Aktif
                  </Badge>
                </div>
              </div>
            )}

            <div className="text-center">
              <CardTitle className="text-lg md:text-xl">
                {currentStep === "company" ? "Login Perusahaan" : "Login Pengguna"}
              </CardTitle>
              <CardDescription className="mt-2 text-xs md:text-sm">
                {currentStep === "company"
                  ? "Masukkan email perusahaan untuk melanjutkan"
                  : "Masukkan kredensial pengguna untuk mengakses aplikasi"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6 pt-0">
            {currentStep === "company" ? (
              // Company Login Form
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-email" className="text-xs md:text-sm font-medium">
                    Email Perusahaan / Company Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="company-email"
                      type="email"
                      placeholder="company@example.com"
                      value={companyData.email}
                      onChange={(e) => setCompanyData((prev) => ({ ...prev, email: e.target.value }))}
                      className="pl-10 bg-background border-border text-sm"
                    />
                  </div>
                </div>

                <Tabs value={authMethod} onValueChange={(value) => setAuthMethod(value as AuthMethod)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="password" className="text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      Password
                    </TabsTrigger>
                    <TabsTrigger value="otp" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      OTP
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="password" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-password" className="text-xs md:text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="company-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Masukkan password"
                          value={companyData.password}
                          onChange={(e) => setCompanyData((prev) => ({ ...prev, password: e.target.value }))}
                          className="pl-10 pr-10 bg-background border-border text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="otp" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-otp" className="text-xs md:text-sm font-medium">
                        Kode OTP
                      </Label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="company-otp"
                            type="text"
                            placeholder="Masukkan kode OTP"
                            value={companyData.otp}
                            onChange={(e) => setCompanyData((prev) => ({ ...prev, otp: e.target.value }))}
                            className="pl-10 bg-background border-border text-sm"
                            maxLength={6}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={sendOTP}
                          disabled={!companyData.email || isLoading}
                          className="px-3 md:px-4 bg-background border-border text-xs md:text-sm"
                        >
                          Kirim
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Kode OTP akan dikirim ke email perusahaan</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  onClick={handleCompanyLogin}
                  disabled={
                    isLoading ||
                    !companyData.email ||
                    (authMethod === "password" ? !companyData.password : !companyData.otp)
                  }
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Verifikasi Perusahaan</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              // User Login Form
              <div className="space-y-4">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentStep("company")
                    setCompanyInfo(null)
                  }}
                  className="self-start p-0 h-auto text-muted-foreground hover:text-foreground text-xs md:text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Kembali ke Login Perusahaan
                </Button>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="user-identifier" className="text-xs md:text-sm font-medium">
                    Username / Email / No. HP
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="user-identifier"
                      type="text"
                      placeholder="username, email@example.com, atau 08123456789"
                      value={userData.identifier}
                      onChange={(e) => setUserData((prev) => ({ ...prev, identifier: e.target.value }))}
                      className="pl-10 bg-background border-border text-sm"
                    />
                  </div>
                </div>

                <Tabs value={authMethod} onValueChange={(value) => setAuthMethod(value as AuthMethod)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="password" className="text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      Password
                    </TabsTrigger>
                    <TabsTrigger value="otp" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      OTP
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="password" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-password" className="text-xs md:text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="user-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Masukkan password"
                          value={userData.password}
                          onChange={(e) => setUserData((prev) => ({ ...prev, password: e.target.value }))}
                          className="pl-10 pr-10 bg-background border-border text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="otp" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-otp" className="text-xs md:text-sm font-medium">
                        Kode OTP
                      </Label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="user-otp"
                            type="text"
                            placeholder="Masukkan kode OTP"
                            value={userData.otp}
                            onChange={(e) => setUserData((prev) => ({ ...prev, otp: e.target.value }))}
                            className="pl-10 bg-background border-border text-sm"
                            maxLength={6}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={sendOTP}
                          disabled={!userData.identifier || isLoading}
                          className="px-3 md:px-4 bg-background border-border text-xs md:text-sm"
                        >
                          Kirim
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Kode OTP akan dikirim ke email/WhatsApp yang terdaftar
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  onClick={handleUserLogin}
                  disabled={
                    isLoading ||
                    !userData.identifier ||
                    (authMethod === "password" ? !userData.password : !userData.otp)
                  }
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Masuk ke Aplikasi...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Masuk ke Aplikasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </div>
            )}

            {/* Footer Links */}
            <div className="text-center space-y-2 pt-4 border-t border-border/50">
              <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                <button className="hover:text-primary transition-colors">Lupa Password?</button>
                <span>•</span>
                <button className="hover:text-primary transition-colors">Bantuan</button>
              </div>
              <p className="text-xs text-muted-foreground">© 2024 RentVix Pro. All rights reserved.</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-4 md:mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-full border border-border/50">
            <Shield className="w-3 h-3" />
            <span>Koneksi aman dengan enkripsi SSL</span>
          </div>
        </div>
      </div>
    </div>
  )
}
