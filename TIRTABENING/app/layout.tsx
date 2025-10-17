import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SiteFooter } from "@/components/site-footer";
import { EntitlementsProvider } from "@/components/entitlements-provider";

export const metadata: Metadata = {
    title: "Nata Banyu - Water Billing Management",
    description: "Progressive Web App for water billing management system",
    generator: "v0.app",
    manifest: "/manifest.json",
    keywords: ["water billing", "management", "PWA", "nata banyu"],
    authors: [{ name: "Nata Banyu Team" }],
    creator: "Nata Banyu",
    publisher: "Nata Banyu",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL("https://nata-banyu.vercel.app"),
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "Nata Banyu - Water Billing Management",
        description: "Progressive Web App for water billing management system",
        url: "https://nata-banyu.vercel.app",
        siteName: "Nata Banyu",
        locale: "id_ID",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Nata Banyu - Water Billing Management",
        description: "Progressive Web App for water billing management system",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Nata Banyu",
    },
    other: {
        "mobile-web-app-capable": "yes",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
                />
                <meta name="theme-color" content="#009688" />
                <link rel="icon" href="/icon-192x192.png" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
                <link
                    rel="preload"
                    href="/_next/static/media/geist-sans.woff2"
                    as="font"
                    type="font/woff2"
                    crossOrigin="anonymous"
                />
                <link
                    rel="preload"
                    href="/_next/static/media/geist-mono.woff2"
                    as="font"
                    type="font/woff2"
                    crossOrigin="anonymous"
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
                    }}
                />
            </head>
            <body
                className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}
            >
                <Suspense fallback={null}>
                    <EntitlementsProvider>{children}</EntitlementsProvider>
                </Suspense>
                <Analytics />
                <Toaster />
            </body>
        </html>
    );
}
