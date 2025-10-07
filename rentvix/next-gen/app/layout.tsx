import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { RootClientShell } from "@/components/layout/root-client-shell";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: "RentVix Pro - Vehicle Rental Management System",
    description:
        "Professional vehicle rental management system with PWA support",
    manifest: "/manifest.json",
    themeColor: "#3b82f6",
    viewport:
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "RentVix Pro",
    },
    generator: "v0.dev",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/icon-192x192.png" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <meta name="apple-mobile-web-app-title" content="RentVix Pro" />
                <meta name="mobile-web-app-capable" content="yes" />
            </head>
            <body className="font-sans antialiased">
                <Providers>
                    <RootClientShell>
                        {children}
                        <Toaster />
                    </RootClientShell>
                </Providers>
            </body>
        </html>
    );
}
