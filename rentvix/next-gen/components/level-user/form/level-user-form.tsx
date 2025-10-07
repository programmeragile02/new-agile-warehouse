"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LevelUserFormFields } from "./level-user-form-fields";
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

export function LevelUserForm({
    mode,
    initialData,
}: {
    mode: "create" | "edit";
    initialData?: Record<string, any>;
}) {
    const router = useRouter();
    const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (mode === "create") {
                await createData("level_users", formData);
                toast({ title: "Berhasil!", description: "Level User berhasil dibuat"})
            } else {
                await updateData("level_users", formData.id!, formData)
                toast({
                    title: "Berhasil!",
                    description: "Level User berhasil diperbarui"
                })
            }
            router.push("/level-user");
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
                                <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/level-user" className="text-muted-foreground hover:text-foreground">
                                    Level User
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            {/* <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href={`/level-user/edit/(id)`} className="text-muted-foreground hover:text-foreground">
                                    nama kolom
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" /> */}
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-foreground">
                                    {mode === "create" ? "Add Level User" : "Edit Level User"}
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
                            Back to Level User
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {mode === "create" ? "Add New Level User" : "Edit Level User"}
                            </h1>
                            <p className="text-muted_foreground">
                                {mode === "create" ? "Add Information for Level User" : "Update Information for Level User"}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <LevelUserFormFields mode={mode} formData={formData} setFormData={setFormData} />
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
                                {mode === "create" ? "Add Level User" : "Update Level User"}
                            </Button>
                        </div>
                    </form>
                </div>
           </>
            
        
    )
}