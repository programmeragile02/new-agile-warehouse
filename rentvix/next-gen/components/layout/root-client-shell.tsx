"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"; // ← import SidebarInset
import { AppSidebar, appSidebarMenuItems } from "@/components/app-sidebar";
import { MobileTabBar } from "@/components/navigation/mobile-tab-bar";
import { MobileMenuDrawer } from "@/components/navigation/mobile-menu-drawer";
import { usePathname } from "next/navigation";

export function RootClientShell({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    const pathname = usePathname();

    // halaman tidak perlu sidebar
    const hideSidebar = pathname?.startsWith("/login");

    if (hideSidebar) {
        return <div className="min-h-dvh w-full">{children}</div>;
    }

    return (
        <SidebarProvider defaultOpen>
            {/* Sidebar harus jadi saudara langsung dari SidebarInset */}
            <AppSidebar />

            {/* pakai SidebarInset sebagai SIBLING Sidebar */}
            <SidebarInset>{children}</SidebarInset>

            {/* Mobile bottom bar + drawer */}
            <MobileTabBar onOpenMenu={() => setOpen(true)} />
            <MobileMenuDrawer
                items={
                    Array.isArray(appSidebarMenuItems)
                        ? appSidebarMenuItems
                        : (appSidebarMenuItems as any)?.items ?? []
                }
                open={open}
                setOpen={setOpen}
            />
        </SidebarProvider>
    );
}
