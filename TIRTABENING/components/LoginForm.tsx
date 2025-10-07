// components/LoginForm.tsx (opsional, bisa pakai yang kamu punya)
"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok || !data.ok)
                throw new Error(data.message || "Login gagal");

            // (opsional) localStorage untuk UI
            localStorage.setItem("tb_user", JSON.stringify(data.user));

            toast({
                title: "Login Berhasil",
                description: `Selamat datang, ${data.user.name}`,
            });

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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                        setFormData((p) => ({ ...p, username: e.target.value }))
                    }
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                        setFormData((p) => ({ ...p, password: e.target.value }))
                    }
                    required
                />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Memproses..." : "Masuk"}
            </Button>
        </form>
    );
}
