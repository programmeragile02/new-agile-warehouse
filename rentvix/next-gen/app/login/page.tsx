// app/login/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCompanyToken, getUserToken } from "@/lib/auth-tokens";

export default function LoginRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        const ct = getCompanyToken();
        const ut = getUserToken();

        if (ut) {
            router.replace("/"); // sudah login user → dashboard
            return;
        }
        if (ct) {
            router.replace("/login/user"); // sudah login company → ke login user
            return;
        }
        router.replace("/login/company"); // belum apa2 → login company dulu
    }, [router]);

    return null;
}
