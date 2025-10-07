"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DataKendaraanForm } from "@/components/data-kendaraan/form/data-kendaraan-form";
import { getDataById } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditDataKendaraanPage() {
    const params = useParams();
    const id = params?.id as string;

    const [data, setData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getDataById("data-kendaraans", id);
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
    <DataKendaraanForm mode="edit" initialData={data} />
  )
}