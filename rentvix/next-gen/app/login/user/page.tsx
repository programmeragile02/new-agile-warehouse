"use client";

import { useEffect, useState } from "react";
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
    User,
    Lock,
    Shield,
    Eye,
    EyeOff,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";

import { API_URL, apiFetch } from "@/lib/api";
import {
    setUserToken,
    setPerms,
    authHeaders,
    getCompanyToken,
    getUserToken,
} from "@/lib/auth-tokens";

type AuthMethod = "password" | "otp";

export default function UserLoginPage() {
    const router = useRouter();
    const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [companyInfo, setCompanyInfo] = useState<{
        name: string;
        logo: string;
    } | null>(null);

    const [userData, setUserData] = useState({
        identifier: "", // username / email / hp
        password: "",
        otp: "",
    });

    // ⬇️ Guard halaman user: wajib punya company_token. Jika tidak ada, redirect ke /login/company
    useEffect(() => {
        const ct = getCompanyToken();
        if (!ct) {
            router.replace("/login/company");
            return;
        }
        // Jika user sudah login, langsung ke dashboard
        const ut = getUserToken?.();
        if (ut) {
            router.replace("/");
            return;
        }

        // Tampilkan badge perusahaan
        (async () => {
            try {
                const res = await fetch(`${API_URL}/auth/company/me`, {
                    headers: authHeaders("company"),
                });
                if (res.ok) {
                    const j = await res.json();
                    setCompanyInfo({
                        name: j.nama ?? j.name ?? "Perusahaan",
                        logo: "/rentvix-logo.png",
                    });
                }
            } catch {
                // jika token company invalid, paksa ulang login company
                router.replace("/login/company");
            }
        })();
    }, [router]);

    const handleUserLogin = async () => {
        setIsLoading(true);
        try {
            const body = {
                identifier: userData.identifier,
                method: authMethod,
                password: userData.password,
                otp: userData.otp,
            };

            // pakai token company di Authorization (apiFetch "company")
            const res = await apiFetch(
                "/auth/user/login",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                },
                "company"
            );

            // simpan token & perms
            setUserToken(res.user_token);
            setPerms(res.perms);

            // redirect ke dashboard
            router.replace("/");
        } catch (err: any) {
            console.error("Login gagal", err);
            alert(err?.message || "Login gagal");
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
                        {/* Step Indicator (User aktif) */}
                        <div className="flex items-center justify-center space-x-4">
                            <div className="flex items-center space-x-2 text-muted-foreground">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-muted text-muted-foreground">
                                    1
                                </div>
                                <span className="text-sm font-medium">
                                    Perusahaan
                                </span>
                            </div>
                            <div className="w-8 h-px bg-border" />
                            <div className="flex items-center space-x-2 text-primary">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-primary text-primary-foreground">
                                    2
                                </div>
                                <span className="text-sm font-medium">
                                    Pengguna
                                </span>
                            </div>
                        </div>

                        {/* Company Info (badge sama seperti sebelumnya) */}
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
                                Login Pengguna
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Masukkan kredensial pengguna untuk mengakses
                                aplikasi
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.replace("/login/company")}
                                className="self-start p-0 h-auto text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Kembali ke Login Perusahaan
                            </Button>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="user-identifier"
                                    className="text-sm font-medium"
                                >
                                    Username / Email / No. HP
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="user-identifier"
                                        type="text"
                                        placeholder="username, email@example.com, atau 08123456789"
                                        value={userData.identifier}
                                        onChange={(e) =>
                                            setUserData((prev) => ({
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
                                            htmlFor="user-password"
                                            className="text-sm font-medium"
                                        >
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="user-password"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Masukkan password"
                                                value={userData.password}
                                                onChange={(e) =>
                                                    setUserData((prev) => ({
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
                                            htmlFor="user-otp"
                                            className="text-sm font-medium"
                                        >
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
                                                    onChange={(e) =>
                                                        setUserData((prev) => ({
                                                            ...prev,
                                                            otp: e.target.value,
                                                        }))
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
                                                    !userData.identifier ||
                                                    isLoading
                                                }
                                                className="px-4 bg-transparent"
                                            >
                                                Kirim
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Kode OTP akan dikirim ke
                                            email/WhatsApp yang terdaftar
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <Button
                                onClick={handleUserLogin}
                                disabled={
                                    isLoading ||
                                    !userData.identifier ||
                                    (authMethod === "password"
                                        ? !userData.password
                                        : !userData.otp)
                                }
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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
