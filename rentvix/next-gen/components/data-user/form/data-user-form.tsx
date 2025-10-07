"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DataUserFormFields } from "./data-user-form-fields";
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
import { createData, updateData } from "@/lib/api";

export function DataUserForm({
    mode,
    initialData,
}: {
    mode: "create" | "edit";
    initialData?: Record<string, any>;
}) {
    const router = useRouter();
    const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const buildPayload = () => {
        const payload: any = {
      nama: formData.nama ?? undefined,
      email: formData.email ?? undefined,
      no_hp: formData.no_hp ? Number(formData.no_hp) : undefined,
      password: formData.password ?? undefined,
        };

    return payload;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = buildPayload();
            
            if (mode === "create") {
                await createData("data-users", payload);
                toast({ title: "Berhasil!", description: "Data User berhasil dibuat"})
            } else {
                await updateData("data-users", formData.id!, payload)
                toast({
                    title: "Berhasil!",
                    description: "Data User berhasil diperbarui"
                })
            }
            router.push("/data-user");
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
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1 h-7 w-7 border border-white/20 text-white hover:bg-white/10 hover:text-white dark:border-white/30 dark:text-white dark:hover:bg-white/20 dark:hover:text-white" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/data-user" className="text-muted-foreground hover:text-foreground">
                                    Data User
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            {/* <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href={`/data-user/edit/(id)`} className="text-muted-foreground hover:text-foreground">
                                    nama kolom
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" /> */}
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-foreground">
                                    {mode === "create" ? "Add Data User" : "Edit Data User"}
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
                            Back to Data User
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {mode === "create" ? "Add New Data User" : "Edit Data User"}
                            </h1>
                            <p className="text-muted_foreground">
                                {mode === "create" ? "Add Information for Data User" : "Update Information for Data User"}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <DataUserFormFields mode={mode} formData={formData} setFormData={setFormData} />
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
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {mode === "create" ? "Add Data User" : "Update Data User"}
                            </Button>
                        </div>
                    </form>
                </div>
            </SidebarInset>
        </SidebarProvider>
            
        
    )
}