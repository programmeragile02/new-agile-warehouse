"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, CalendarCheck, History, Menu } from "lucide-react";
import * as React from "react";

type Tab = { href: string; label: string; icon: React.ComponentType<any> };

export function MobileTabBar({
  onOpenMenu,
  tabs,
}: {
  onOpenMenu: () => void;
  tabs?: Partial<Record<"home" | "create" | "schedule" | "history", string>>;
}) {
  const pathname = usePathname();

  const routes: Record<string, Tab> = {
    menu: { href: "#", label: "Menu", icon: Menu },
    create: {
      href: tabs?.create ?? "/level-user/create",
      label: "Tambah Level",
      icon: PlusCircle,
    },
    home: { href: tabs?.home ?? "/", label: "Beranda", icon: Home },
    schedule: {
      href: tabs?.schedule ?? "/user-management",
      label: "Jadwal",
      icon: CalendarCheck,
    },
    history: {
      href: tabs?.history ?? "/history",
      label: "Histori",
      icon: History,
    },
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-50">
      {/* Container: make it pop on dark with card bg + solid border */}
      <div className="mx-4 mb-4 rounded-2xl border border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70 shadow-xl ring-1 ring-border">
        <div className="grid grid-cols-5 items-center text-muted-foreground">
          {/* Menu (drawer trigger) */}
          <button
            onClick={onOpenMenu}
            className="h-14 flex items-center justify-center hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
            aria-label="Buka menu"
          >
            <routes.menu.icon className="h-5 w-5" />
          </button>

          {/* Tambah */}
          <Link
            href={routes.create.href}
            className={`h-14 flex items-center justify-center rounded-2xl hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive(routes.create.href) ? "text-primary" : ""
            }`}
            aria-label={routes.create.label}
          >
            <routes.create.icon className="h-5 w-5" />
          </Link>

          {/* Beranda (floating) */}
          <Link
            href={routes.home.href}
            className="relative -mt-6 justify-self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
            aria-label={routes.home.label}
          >
            <div className="h-16 w-16 rounded-full bg-primary shadow-xl flex items-center justify-center ring-4 ring-card">
              <routes.home.icon className="h-6 w-6 text-white" />
            </div>
          </Link>

          {/* Jadwal */}
          <Link
            href={routes.schedule.href}
            className={`h-14 flex items-center justify-center rounded-2xl hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive(routes.schedule.href) ? "text-primary" : ""
            }`}
            aria-label={routes.schedule.label}
          >
            <routes.schedule.icon className="h-5 w-5" />
          </Link>

          {/* Histori */}
          <Link
            href={routes.history.href}
            className={`h-14 flex items-center justify-center rounded-2xl hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive(routes.history.href) ? "text-primary" : ""
            }`}
            aria-label={routes.history.label}
          >
            <routes.history.icon className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Safe-area padding so it never overlaps the device home bar */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
