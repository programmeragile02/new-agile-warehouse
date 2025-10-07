// components/top-navbar.tsx
"use client";

import {
    Search,
    Globe,
    Sun,
    Moon,
    User as UserIcon,
    PanelLeftClose,
    PanelLeftOpen,
    Zap,
    Palette,
    Check,
    Menu,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useLanguage } from "@/lib/contexts/language-context";
import { useTheme } from "@/lib/contexts/theme-context";
import { EarlyWarningReminder } from "@/components/early-warning-reminder";
import { themes } from "@/lib/themes";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/api";
import {
    clearUserAuth,
    clearAllAuth,
    getUserToken,
    getCompanyToken,
} from "@/lib/auth-tokens";

type Props = {
    onLogout?: () => void; // opsional: jika parent ingin override
};

export function TopNavbar({ onLogout }: Props) {
    const { language, setLanguage, t } = useLanguage();
    const { themeMode, setThemeMode, currentTheme, applyTheme } = useTheme();
    const { state, toggleSidebar } = useSidebar();
    const [isApplyingTheme, setIsApplyingTheme] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();

    const internalLogout = async () => {
        try {
            const userTok = getUserToken?.();
            const companyTok = getCompanyToken?.();

            if (userTok) {
                try {
                    await apiFetch(
                        "/auth/logout/user",
                        { method: "POST" },
                        "user"
                    );
                } catch {}
                clearUserAuth(); // hanya hapus user + perms
                setIsMobileMenuOpen(false);
                router.replace("/login/user"); // tetap di user login
                return;
            }

            if (companyTok) {
                try {
                    await apiFetch(
                        "/auth/logout/company",
                        { method: "POST" },
                        "company"
                    );
                } catch {}
                clearAllAuth(); // ganti perusahaan → bersihkan semua
                setIsMobileMenuOpen(false);
                router.replace("/login/company");
                return;
            }

            setIsMobileMenuOpen(false);
            router.replace("/login/company");
        } catch {
            setIsMobileMenuOpen(false);
            router.replace("/login/company");
        }
    };

    const handleLogout = onLogout ?? internalLogout;

    const handleThemeSelect = async (themeId: string) => {
        const theme = themes.find((t) => t.id === themeId);
        if (!theme || currentTheme.id === themeId) return;

        setIsApplyingTheme(themeId);
        await new Promise((r) => setTimeout(r, 300));
        applyTheme(theme);
        setIsApplyingTheme(null);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
            <div className="flex h-16 items-center gap-4 px-4">
                {/* Mobile Sidebar Trigger */}
                <SidebarTrigger className="md:hidden text-foreground hover:text-primary hover:bg-accent" />

                {/* Desktop Sidebar Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="hidden md:flex h-9 w-9 text-foreground hover:text-primary hover:bg-accent border border-border hover:border-primary/30 transition-all duration-300"
                >
                    {state === "expanded" ? (
                        <PanelLeftClose className="h-4 w-4" />
                    ) : (
                        <PanelLeftOpen className="h-4 w-4" />
                    )}
                </Button>

                {/* AI Badge */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary font-space-grotesk">
                        AI-Powered
                    </span>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-none mx-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t("search")}
                            className="w-full pl-12 pr-4 h-11 bg-muted/50 border-border focus-visible:ring-primary/50 focus-visible:border-primary/50 font-manrope placeholder:font-manrope placeholder:text-muted-foreground text-foreground text-base rounded-xl transition-all duration-300"
                        />
                    </div>
                </div>

                {/* Desktop Right */}
                <div className="hidden md:flex items-center gap-1">
                    {/* Theme Picker */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-foreground hover:text-primary hover:bg-accent border border-foreground/20 hover:border-primary/30"
                            >
                                <Palette className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-48 bg-popover border-border"
                        >
                            <DropdownMenuLabel className="font-manrope flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                {language === "id"
                                    ? "Pilih Theme"
                                    : "Select Theme"}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            {themes.map((theme) => (
                                <DropdownMenuItem
                                    key={theme.id}
                                    onClick={() => handleThemeSelect(theme.id)}
                                    disabled={isApplyingTheme === theme.id}
                                    className="font-manrope flex items-center gap-3"
                                >
                                    {isApplyingTheme === theme.id ? (
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    ) : currentTheme.id === theme.id ? (
                                        <Check className="h-3 w-3 text-primary" />
                                    ) : (
                                        <div
                                            className="w-3 h-3 rounded-full border border-border"
                                            style={{
                                                backgroundColor:
                                                    theme.preview.primary,
                                            }}
                                        />
                                    )}
                                    <span
                                        className={
                                            currentTheme.id === theme.id
                                                ? "text-primary font-medium"
                                                : ""
                                        }
                                    >
                                        {language === "id"
                                            ? theme.nameId
                                            : theme.name}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Early Warning */}
                    <EarlyWarningReminder />

                    {/* Language */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-foreground hover:text-primary hover:bg-accent border border-foreground/20 hover:border-primary/30"
                            >
                                <Globe className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="dropdown-content font-manrope"
                        >
                            <DropdownMenuItem onClick={() => setLanguage("en")}>
                                <span
                                    className={
                                        language === "en"
                                            ? "font-medium text-primary"
                                            : ""
                                    }
                                >
                                    English
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage("id")}>
                                <span
                                    className={
                                        language === "id"
                                            ? "font-medium text-primary"
                                            : ""
                                    }
                                >
                                    Bahasa Indonesia
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            setThemeMode(
                                themeMode === "light" ? "dark" : "light"
                            )
                        }
                        className="h-9 w-9 text-foreground hover:text-primary hover:bg-accent border border-foreground/20 hover:border-primary/30"
                    >
                        {themeMode === "light" ? (
                            <Moon className="h-4 w-4" />
                        ) : (
                            <Sun className="h-4 w-4" />
                        )}
                    </Button>

                    {/* Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-9 w-9 rounded-full text-foreground hover:text-primary hover:bg-accent border border-foreground/20 hover:border-primary/30"
                            >
                                <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                                    <AvatarImage
                                        src="/admin-avatar.png"
                                        alt="Admin User"
                                    />
                                    <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                                        AD
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="dropdown-content w-56 font-manrope"
                        >
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">
                                        Admin User
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        admin@rentvix.com
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <UserIcon className="mr-2 h-4 w-4" />
                                {t("Profile")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <span>{t("settings")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                            >
                                {t("Logout")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Mobile Right */}
                <div className="md:hidden flex items-center gap-2">
                    <EarlyWarningReminder />
                    <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                        <AvatarImage src="/admin-avatar.png" alt="Admin User" />
                        <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                            AD
                        </AvatarFallback>
                    </Avatar>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="h-9 w-9 text-foreground hover:text-primary hover:bg-accent"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-4 w-4" />
                        ) : (
                            <Menu className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
                    <div className="p-4 space-y-3">
                        {/* Theme selector mobile */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                {language === "id"
                                    ? "Pilih Theme"
                                    : "Select Theme"}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {themes.map((theme) => (
                                    <Button
                                        key={theme.id}
                                        variant={
                                            currentTheme.id === theme.id
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        className="gap-2 font-manrope transition-all duration-300"
                                        onClick={() =>
                                            handleThemeSelect(theme.id)
                                        }
                                        disabled={isApplyingTheme === theme.id}
                                    >
                                        {isApplyingTheme === theme.id ? (
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        ) : currentTheme.id === theme.id ? (
                                            <Check className="h-3 w-3" />
                                        ) : (
                                            <div
                                                className="w-3 h-3 rounded-full border border-current"
                                                style={{
                                                    backgroundColor:
                                                        theme.preview.primary,
                                                }}
                                            />
                                        )}
                                        <span className="text-xs">
                                            {language === "id"
                                                ? theme.nameId
                                                : theme.name}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-transparent flex items-center justify-center"
                                onClick={() =>
                                    setLanguage(language === "en" ? "id" : "en")
                                }
                            >
                                <Globe className="h-4 w-4" />
                                <span className="text-xs">
                                    {language === "en" ? "ID" : "EN"}
                                </span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-transparent flex items-center justify-center"
                                onClick={() =>
                                    setThemeMode(
                                        themeMode === "light" ? "dark" : "light"
                                    )
                                }
                            >
                                {themeMode === "light" ? (
                                    <Moon className="h-4 w-4" />
                                ) : (
                                    <Sun className="h-4 w-4" />
                                )}
                                <span className="text-xs">
                                    {themeMode === "light" ? "Dark" : "Light"}
                                </span>
                            </Button>
                        </div>

                        {/* Profile mobile */}
                        <div className="pt-2 border-t border-border">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                                    <AvatarImage
                                        src="/admin-avatar.png"
                                        alt="Admin User"
                                    />
                                    <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                                        AD
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                        Admin User
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        admin@rentvix.com
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="text-destructive hover:bg-destructive/10"
                                >
                                    {t("Logout")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
