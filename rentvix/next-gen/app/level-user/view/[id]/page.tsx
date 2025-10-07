"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDataById, deleteData } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

import { LevelUserView } from "@/components/level-user/level-user-view-detail";

export default function LevelUserViewPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [data, setData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await getDataById("level_users", id);
                setData(result);
            } catch (err: any) {
                toast({
                    title: "Gagal Memuat Data",
                    description: "Data tidak ditemukan",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
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

    return <LevelUserView loading={loading} data={data} />;
}