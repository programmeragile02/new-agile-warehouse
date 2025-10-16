// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { useRouter } from "next/navigation";

// export default function SingleLoginForm() {
//     const [loading, setLoading] = useState(false);
//     const [companyId, setCompanyId] = useState("");
//     const [username, setUsername] = useState("");
//     const [password, setPassword] = useState("");
//     const { toast } = useToast();
//     const router = useRouter();

//     useEffect(() => {
//         try {
//             const raw = document.cookie
//                 .split("; ")
//                 .find((x) => x.startsWith("tb_company="));
//             if (raw) {
//                 const v = decodeURIComponent(raw.split("=")[1] || "");
//                 if (v) setCompanyId(v);
//             }
//         } catch {}
//     }, []);

//     async function onSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         if (loading) return;
//         setLoading(true);

//         try {
//             const res = await fetch("/api/auth/login", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Accept: "application/json",
//                 },
//                 body: JSON.stringify({ companyId, username, password }),
//             });

//             const j = await res.json().catch(() => ({} as any));
//             if (!res.ok || !j?.ok) throw new Error(j?.message || "Login gagal");

//             if (j.requirePasswordChange) {
//                 window.location.href = "/first-login";
//             } else {
//                 window.location.href = "/dashboard";
//             }

//             // redirect per-role (server sudah set cookies tb_tenant + tb_session)
//             switch (j?.user?.role) {
//                 case "WARGA":
//                     router.replace("/warga-dashboard");
//                     break;
//                 case "PETUGAS":
//                     router.replace("/jadwal-pencatatan");
//                     break;
//                 case "ADMIN":
//                 default:
//                     router.replace("/dashboard");
//             }

//             toast({
//                 title: "Login Berhasil",
//                 description: `Selamat datang, ${j?.user?.name || ""}`,
//             });
//         } catch (err: any) {
//             toast({
//                 title: "Login Gagal",
//                 description:
//                     err?.message || "Account ID/username/password salah",
//                 variant: "destructive",
//             });
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <form onSubmit={onSubmit} className="space-y-4">
//             <div className="space-y-2">
//                 <Label htmlFor="companyId" className="text-base font-medium">
//                     Account ID
//                 </Label>
//                 <Input
//                     id="companyId"
//                     value={companyId}
//                     onChange={(e) => setCompanyId(e.target.value)}
//                     autoComplete="organization"
//                     className="h-12 text-base"
//                     required
//                 />
//             </div>

//             <div className="space-y-2">
//                 <Label htmlFor="username" className="text-base font-medium">
//                     Username
//                 </Label>
//                 <Input
//                     id="username"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                     autoComplete="username"
//                     className="h-12 text-base"
//                     required
//                 />
//             </div>

//             <div className="space-y-2">
//                 <Label htmlFor="password" className="text-base font-medium">
//                     Password
//                 </Label>
//                 <Input
//                     id="password"
//                     type="password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     autoComplete="current-password"
//                     className="h-12 text-base"
//                     required
//                 />
//             </div>

//             <Button
//                 type="submit"
//                 className="w-full h-12 text-lg font-medium"
//                 disabled={loading}
//             >
//                 {loading ? "Memproses..." : "Masuk"}
//             </Button>
//         </form>
//     );
// }

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function SingleLoginForm() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { toast } = useToast();
    const router = useRouter();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const j = await res.json().catch(() => ({} as any));
            if (!res.ok || !j?.ok) throw new Error(j?.message || "Login gagal");

            if (j.requirePasswordChange) {
                window.location.href = "/first-login";
                return;
            }

            switch (j?.user?.role) {
                case "WARGA":
                    router.replace("/warga-dashboard");
                    break;
                case "PETUGAS":
                    router.replace("/jadwal-pencatatan");
                    break;
                case "ADMIN":
                default:
                    router.replace("/dashboard");
            }

            toast({
                title: "Login Berhasil",
                description: `Selamat datang, ${j?.user?.name || ""}`,
            });
        } catch (err: any) {
            toast({
                title: "Login Gagal",
                description: err?.message || "Email/password salah",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">
                    Email / Username
                </Label>
                <Input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    // inputMode="email"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-12 text-base"
                    required
                />
            </div>

            <Button
                type="submit"
                className="w-full h-12 text-lg font-medium"
                disabled={loading}
            >
                {loading ? "Memproses..." : "Masuk"}
            </Button>
        </form>
    );
}
