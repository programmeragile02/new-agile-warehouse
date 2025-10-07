"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DaftarKendaraanFormFields } from "./daftar-kendaraan-form-fields";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { createData, updateData } from "@/lib/api";

export function DaftarKendaraanForm({
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
      jenis: formData.jenis ?? undefined,
      warna: formData.warna ?? undefined,
        };
    if (formData.foto_depan instanceof File) payload.foto_depan = formData.foto_depan;
    if (formData.foto_samping instanceof File) payload.foto_samping = formData.foto_samping;
    return payload;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = buildPayload();
            
            if (mode === "create") {
                await createData("daftar-kendaraans", payload);
                toast({ title: "Success!", description: "Daftar Kendaraan created"})
            } else {
                await updateData("daftar-kendaraans", formData.id!, payload)
                toast({
                    title: "Success!",
                    description: "Daftar Kendaraan updated"
                })
            }
            router.push("/daftar-kendaraan");
        } catch (error: any) {
            toast({
                title: "Failed",
                description: error.message || "There Is An Error.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const CRUMBS = [{"title":"Data & Armada","route_path":null,"level":1,"type":"group"},{"title":"Kendaraan (Armada)","route_path":null,"level":2,"type":"module"},{"title":"Daftar Kendaraan","route_path":"/daftar-kendaraan","level":3,"type":"menu"}] as { title: string; route_path?: string|null; level: number; type: string }[];

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1 h-7 w-7 border border-white/20 text-black hover:bg-black/50 hover:text-white dark:border-white/30 dark:text-white dark:hover:bg-white/20 dark:hover:text-white" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {/* <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem> */}
                        {CRUMBS.map((c, i) => (
                            <React.Fragment key={i}>
                                {i < CRUMBS.length - 1 ? (
                                    <>
                                        <BreadcrumbItem className="md:block">
                                            {/* <BreadcrumbLink href={c.route_path || "#"} className="text-muted-foreground hover:text-foreground"> */}
                                                {c.title}
                                            {/* </BreadcrumbLink> */}
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="md:block" />
                                    </>
                                ) : (
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="text-foreground">
                                            {mode === "create" ? `Add ${c.title}` : `Edit ${c.title}`}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                )}
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        className="border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Daftar Kendaraan
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {mode === "create" ? "Tambah Daftar Kendaraan" : "Edit Daftar Kendaraan"}
                        </h1>
                        <p className="text-muted_foreground">
                            {mode === "create" ? "Tambah Informasi Untuk Daftar Kendaraan" : "Update Informasi Untuk Daftar Kendaraan"}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <fieldset disabled={isSubmitting} className="space-y-6">
                        <div>
                            <DaftarKendaraanFormFields mode={mode} formData={formData} setFormData={setFormData} />
                        </div>
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {mode === "create" ? "Menyimpan..." : "Mengupdate..."}
                                </>
                            ) : mode === "create" ? ( "Tambah Daftar Kendaraan" ) : ( "Edit Daftar Kendaraan" )}
                            </Button>
                        </div>
                    </fieldset>
                </form>
            </div>
        </>
    )
}