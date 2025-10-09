"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Droplets,
    Settings,
    CalendarClock,
    UserPlus,
    Users,
    Container,
    Grid3x3,
    CheckCircle2,
    ChevronRight,
} from "lucide-react";

/** kunci langkah agar konsisten dengan backend */
export type StepKey =
    | "tarif"
    | "pengaturan"
    | "jadwal"
    | "user"
    | "pelanggan"
    | "tandon"
    | "blok";

type Step = {
    key: StepKey;
    title: string;
    desc: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

export default function OnboardingGetStarted(props: {
    completedKeys?: StepKey[];
    loading?: boolean;
}) {
    const completed = new Set(props.completedKeys ?? []);
    const steps: Step[] = useMemo(
        () => [
            {
                key: "tarif",
                title: "Atur Tarif Air",
                desc: "Isi tarif per m³ dan/atau abonemen supaya perhitungan tagihan otomatis.",
                href: "/pengaturan",
                icon: Droplets,
            },
            {
                key: "pengaturan",
                title: "Pengaturan Sistem",
                desc: "Lengkapi identitas perusahaan, logo, kontak, dan preferensi penagihan.",
                href: "/pengaturan",
                icon: Settings,
            },
            {
                key: "jadwal",
                title: "Pengaturan Jadwal",
                desc: "Buat jadwal/periode pencatatan untuk bulan berjalan atau berikutnya.",
                href: "/pengaturan",
                icon: CalendarClock,
            },
            {
                key: "user",
                title: "Tambah User (Petugas)",
                desc: "Buat akun petugas lapangan.",
                href: "/pengaturan",
                icon: UserPlus,
            },
            {
                key: "pelanggan",
                title: "Master Pelanggan",
                desc: "Daftarkan pelanggan dan hubungkan ke zona (blok) serta golongan tarif.",
                href: "/pelanggan",
                icon: Users,
            },
            {
                key: "tandon",
                title: "Master Tandon",
                desc: "Catat tandon/sumber air untuk monitoring distribusi & analisis.",
                href: "/tandon",
                icon: Container,
            },
            {
                key: "blok",
                title: "Master Blok (Zona)",
                desc: "Buat blok/cluster rute pencatatan",
                href: "/zona",
                icon: Grid3x3,
            },
        ],
        []
    );

    const totalDone = steps.filter((s) => completed.has(s.key)).length;
    const progress = Math.round((totalDone / steps.length) * 100);

    return (
        <GlassCard className="p-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">
                        Mulai Pakai Aplikasi
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Lengkapi beberapa langkah singkat supaya Tirta Bening
                        siap.
                    </p>
                </div>
                <Badge variant="secondary" className="self-start sm:self-auto">
                    {props.loading
                        ? "Memuat…"
                        : `${totalDone}/${steps.length} selesai`}
                </Badge>
            </div>

            {/* Progress */}
            <div className="mt-4">
                <Progress value={props.loading ? 0 : progress} />
                <div className="mt-1 text-xs text-muted-foreground">
                    {props.loading
                        ? "Menghitung progres…"
                        : `${progress}% selesai`}
                </div>
            </div>

            {/* Steps grid */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {steps.map((s, i) => {
                    const Icon = s.icon;
                    const isDone = completed.has(s.key);

                    return (
                        <div
                            key={s.key}
                            className="rounded-xl border border-border/40 bg-muted/20 p-4 hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl border border-border/40 bg-background p-2">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="truncate font-medium text-foreground">
                                            {s.title}
                                        </h4>
                                        {isDone && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Selesai
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                        {s.desc}
                                    </p>

                                    <div className="mt-3 flex items-center gap-2">
                                        <Button
                                            asChild
                                            size="sm"
                                            className="h-8"
                                        >
                                            <Link href={s.href}>
                                                {isDone ? "Lihat" : "Mulai"}
                                                <ChevronRight className="ml-1 h-4 w-4" />
                                            </Link>
                                        </Button>

                                        {!isDone && (
                                            <Badge
                                                variant="outline"
                                                className="text-[11px]"
                                            >
                                                Langkah {i + 1}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </GlassCard>
    );
}
