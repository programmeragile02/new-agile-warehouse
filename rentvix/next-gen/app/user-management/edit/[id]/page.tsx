"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserManagementForm } from "@/components/user-management/form/user-management-form";
import { getDataById } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditUserManagementPage() {
    const params = useParams();
    const id = params?.id as string;

    const [data, setData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getDataById("user_managements", id);
        setData(result);
      } catch (err: any) {
        toast({
          title: "Gagal memuat data",
          description: err.message || "Terjadi kesalahan.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="p-4 text-muted-foreground">Data tidak ditemukan.</p>;
  }

  return (
    <UserManagementForm mode="edit" initialData={data} />
  )
}