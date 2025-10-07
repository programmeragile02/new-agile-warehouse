"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Mail,
    Lock,
    Shield,
    Eye,
    EyeOff,
    ArrowRight,
} from "lucide-react";

import { API_URL } from "@/lib/api";
import { setCompanyToken, authHeaders } from "@/lib/auth-tokens";

type AuthMethod = "password" | "otp";

export default function CompanyLoginPage() {
    const router = useRouter();
    const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // ⬇️ tetap pakai identifier (UUID) seperti versi sebelumnya
    const [companyData, setCompanyData] = useState({
        identifier: "",
        password: "",
        otp: "",
    });

    const [companyInfo, setCompanyInfo] = useState<{
        name: string;
        logo: string;
    } | null>(null);

    const handleCompanyLogin = async () => {
        setIsLoading(true);
        try {
            const body: any = { identifier: companyData.identifier };
            if (authMethod === "password") body.password = companyData.password;
            if (authMethod === "otp") body.otp = companyData.otp;

            const res = await fetch(`${API_URL}/auth/company/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(await res.text());
            const j = await res.json();

            // simpan token perusahaan
            setCompanyToken(j.company_token);

            // tampilkan info perusahaan (opsional badge sama seperti sebelumnya)
            const meRes = await fetch(`${API_URL}/auth/company/me`, {
                headers: authHeaders("company"),
            });
            const company = await meRes.json();
            setCompanyInfo({
                name:
                    company.nama ??
                    company.name ??
                    j.company_id ??
                    "Perusahaan",
                logo: "/rentvix-logo.png",
            });

            // lanjut ke halaman login user
            router.replace("/login/user");
        } catch (e: any) {
            alert(e?.message || "Gagal verifikasi perusahaan");
        } finally {
            setIsLoading(false);
        }
    };

    const sendOTP = async () => {
        setIsLoading(true);
        try {
            // Integrasikan endpoint OTP milikmu di sini
            alert(
                "OTP dikirim (mock). Integrasikan endpoint OTP kalau tersedia."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_hsl(var(--primary)/0.05)_0%,_transparent_50%)] bg-[radial-gradient(circle_at_80%_20%,_hsl(var(--secondary)/0.05)_0%,_transparent_50%)]" />

            <div className="relative w-full max-w-md mx-auto">
                {/* Logo and Brand */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                            <Image
                                src="/rentvix-logo.png"
                                alt="RentVix Pro"
                                width={32}
                                height={32}
                                className="rounded-lg"
                            />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        RentVix Pro
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Sistem Manajemen Rental Kendaraan Profesional
                    </p>
                </div>

                <Card className="w-full shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
                    <CardHeader className="space-y-4">
                        {/* Step Indicator (Company saja aktif) */}
                        <div className="flex items-center justify-center space-x-4">
                            <div className="flex items-center space-x-2 text-primary">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-primary text-primary-foreground">
                                    1
                                </div>
                                <span className="text-sm font-medium">
                                    Perusahaan
                                </span>
                            </div>
                            <div className="w-8 h-px bg-border" />
                            <div className="flex items-center space-x-2 text-muted-foreground">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-muted text-muted-foreground">
                                    2
                                </div>
                                <span className="text-sm font-medium">
                                    Pengguna
                                </span>
                            </div>
                        </div>

                        {/* Company Info (opsional jika ingin tampil sesaat setelah login) */}
                        {companyInfo && (
                            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-foreground">
                                            {companyInfo.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Perusahaan Terverifikasi
                                        </p>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Aktif
                                    </Badge>
                                </div>
                            </div>
                        )}

                        <div className="text-center">
                            <CardTitle className="text-xl">
                                Login Perusahaan
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Masukkan ID Perusahaan (UUID) untuk melanjutkan
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="company-id"
                                    className="text-sm font-medium"
                                >
                                    ID Perusahaan (UUID)
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="company-id"
                                        type="text"
                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                        value={companyData.identifier}
                                        onChange={(e) =>
                                            setCompanyData((prev) => ({
                                                ...prev,
                                                identifier: e.target.value,
                                            }))
                                        }
                                        className="pl-10 bg-background border-border"
                                    />
                                </div>
                            </div>

                            <Tabs
                                value={authMethod}
                                onValueChange={(v) =>
                                    setAuthMethod(v as AuthMethod)
                                }
                            >
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger
                                        value="password"
                                        className="text-xs"
                                    >
                                        <Lock className="w-3 h-3 mr-1" />
                                        Password
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="otp"
                                        className="text-xs"
                                    >
                                        <Shield className="w-3 h-3 mr-1" />
                                        OTP
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent
                                    value="password"
                                    className="space-y-4 mt-4"
                                >
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="company-password"
                                            className="text-sm font-medium"
                                        >
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="company-password"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Masukkan password"
                                                value={companyData.password}
                                                onChange={(e) =>
                                                    setCompanyData((prev) => ({
                                                        ...prev,
                                                        password:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="pl-10 pr-10 bg-background border-border"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
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

                                <TabsContent
                                    value="otp"
                                    className="space-y-4 mt-4"
                                >
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="company-otp"
                                            className="text-sm font-medium"
                                        >
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
                                                    onChange={(e) =>
                                                        setCompanyData(
                                                            (prev) => ({
                                                                ...prev,
                                                                otp: e.target
                                                                    .value,
                                                            })
                                                        )
                                                    }
                                                    className="pl-10 bg-background border-border"
                                                    maxLength={6}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={sendOTP}
                                                disabled={
                                                    !companyData.identifier ||
                                                    isLoading
                                                }
                                                className="px-4 bg-transparent"
                                            >
                                                Kirim
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Kode OTP akan dikirim ke kontak
                                            perusahaan
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <Button
                                onClick={handleCompanyLogin}
                                disabled={
                                    isLoading ||
                                    !companyData.identifier ||
                                    (authMethod === "password"
                                        ? !companyData.password
                                        : !companyData.otp)
                                }
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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

                        <div className="text-center space-y-2 pt-4 border-t border-border/50">
                            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                                <button className="hover:text-primary transition-colors">
                                    Lupa Password?
                                </button>
                                <span>•</span>
                                <button className="hover:text-primary transition-colors">
                                    Bantuan
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                © 2024 RentVix Pro. All rights reserved.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center">
                    <div className="inline-flex items-center space-x-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-full border border-border/50">
                        <Shield className="w-3 h-3" />
                        <span>Koneksi aman dengan enkripsi SSL</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
