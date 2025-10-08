"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// ambil offering dari cookie/localStorage kalau ada
function getOfferingClient(): string {
    try {
        const c = document.cookie
            .split("; ")
            .find((x) => x.startsWith("tb_offering="));
        if (c) {
            const v = decodeURIComponent(c.split("=")[1] || "");
            if (v) return v;
        }
    } catch {}
    try {
        const v = localStorage.getItem("tb_offering");
        if (v) return v;
    } catch {}
    return "basic"; // fallback
}

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const router = useRouter();
    const { toast } = useToast();
    const params = useParams();

    // offering aktif dari client (bisa kamu ganti dari dropdown pilihan paket)
    const offering = getOfferingClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // KIRIM offering ke server!
                body: JSON.stringify({ ...formData, offering }),
            });

            const data = await res.json();
            if (!res.ok || !data.ok)
                throw new Error(data.message || "Login gagal");

            // simpan info ringan untuk UI (cookie JWT sudah diset httpOnly oleh server)
            localStorage.setItem("tb_user", JSON.stringify(data.user));

            // fallback: pastikan cookie offering ada di client juga
            try {
                document.cookie = `tb_offering=${encodeURIComponent(
                    data.offering || offering
                )}; Path=/; SameSite=Lax`;
                localStorage.setItem("tb_offering", data.offering || offering);
            } catch {}

            toast({
                title: "Login Berhasil",
                description: `Selamat datang, ${data.user.name}`,
            });

            // const next = params.get("next");
            // if (next) {
            //     router.replace(next);
            //     return;
            // }

            switch (data?.user?.role) {
                case "WARGA":
                    router.replace("/warga-dashboard");
                    break;
                case "PETUGAS":
                    router.replace("/jadwal-pencatatan");
                    break;
                case "ADMIN":
                    router.replace("/dashboard");
                    break;
                default:
                    router.replace("/dashboard");
            }
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Username / password salah";
            toast({
                title: "Login Gagal",
                description: message,
                variant: "destructive",
            });
            console.log(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="username" className="text-base font-medium">
                    Username
                </Label>
                <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={formData.username}
                    onChange={(e) =>
                        setFormData((p) => ({ ...p, username: e.target.value }))
                    }
                    className="h-12 text-base"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">
                    Password
                </Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={(e) =>
                        setFormData((p) => ({ ...p, password: e.target.value }))
                    }
                    className="h-12 text-base"
                    required
                />
            </div>

            <Button
                type="submit"
                className="w-full h-12 text-lg font-medium"
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Memproses...
                    </div>
                ) : (
                    "Masuk"
                )}
            </Button>
        </form>
    );
}
