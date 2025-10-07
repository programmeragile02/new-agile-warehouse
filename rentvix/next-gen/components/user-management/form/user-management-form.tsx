"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserManagementFormFields } from "./user-management-form-fields";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";
import { createData, updateData, fetchData } from "@/lib/api";

export function UserManagementForm({
    mode,
    initialData,
}: {
    mode: "create" | "edit";
    initialData?: Record<string, any>;
}) {
    const router = useRouter();
    const [formData, setFormData] = React.useState<Record<string, any>>(
        initialData || {}
    );
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // dropdown sources
    const [companies, setCompanies] = React.useState<Array<{ id: string }>>([]);
    const [levels, setLevels] = React.useState<
        Array<{ id: number | string; nama_level: string }>
    >([]);

    React.useEffect(() => {
        // Companies
        fetchData("companies")
            .then((rows) =>
                setCompanies(Array.isArray(rows) ? rows : rows?.data ?? [])
            )
            .catch(() => setCompanies([]));

        // Level Users (Role)
        fetchData("level_users")
            .then((rows) =>
                setLevels(Array.isArray(rows) ? rows : rows?.data ?? [])
            )
            .catch(() => setLevels([]));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (mode === "create") {
                await createData("user_managements", formData);
                toast({
                    title: "Berhasil!",
                    description: "User Management berhasil dibuat",
                });
            } else {
                await updateData("user_managements", formData.id!, formData);
                toast({
                    title: "Berhasil!",
                    description: "User Management berhasil diperbarui",
                });
            }
            router.push("/user-management");
        } catch (error: any) {
            toast({
                title: "Gagal",
                description: error.message || "Terjadi kesalahan.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1 h-7 w-7 border border-white/20 text-white hover:bg-white/10 hover:text-white dark:border-white/30 dark:text-white dark:hover:bg-white/20 dark:hover:text-white" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink
                                href="/"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink
                                href="/user-management"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                User Management
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-foreground">
                                {mode === "create"
                                    ? "Add User Management"
                                    : "Edit User Management"}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        className="border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to User Management
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {mode === "create"
                                ? "Add New User Management"
                                : "Edit User Management"}
                        </h1>
                        <p className="text-muted_foreground">
                            {mode === "create"
                                ? "Add Information for User Management"
                                : "Update Information for User Management"}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <UserManagementFormFields
                            mode={mode}
                            formData={formData}
                            setFormData={setFormData}
                            companies={companies}
                            levels={levels} // ← kirim list level untuk dropdown role
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {mode === "create"
                                ? "Add User Management"
                                : "Update User Management"}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
