// app/zona/page.tsx

// import { AuthGuard } from "@/components/auth-guard";
// import { AppShell } from "@/components/app-shell";
// import { GlassCard } from "@/components/glass-card";
// import { AppHeader } from "@/components/app-header";
// import { Button } from "@/components/ui/button";
// import { Plus } from "lucide-react";

// // ⬇️ Nanti kamu buat di Step 2 & 3
// import { ZonaForm } from "@/components/zona-form";
// import { ZonaList } from "@/components/zona-list";
// export default function ZonaPage() {
//   return (
//     <AuthGuard>
//       <AppShell>
//         <div className="max-w-6xl mx-auto space-y-6">
//           <AppHeader title="Kelola Blok" />

//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//             <p className="text-muted-foreground">
//               Manajemen data blok & penanggung jawab (petugas).
//             </p>
//             <Button className="flex items-center gap-2" form="zona-form">
//               <Plus className="w-4 h-4" />
//               Tambah Blok
//             </Button>
//           </div>

//           <GlassCard className="p-6">
//             <h2 className="text-xl font-semibold text-foreground mb-4">
//               Tambah Blok Baru
//             </h2>
//             <ZonaForm />
//           </GlassCard>

//           <ZonaList />
//         </div>
//       </AppShell>
//     </AuthGuard>
//   );
// }
// app/zona/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { AuthGuard } from "@/components/auth-guard";
// import { AppShell } from "@/components/app-shell";
// import { GlassCard } from "@/components/glass-card";
// import { AppHeader } from "@/components/app-header";
// import { Button } from "@/components/ui/button";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Plus, Info } from "lucide-react";

// import { ZonaForm } from "@/components/zona-form";
// import { ZonaList } from "@/components/zona-list";

// export default function ZonaPage() {
//   const [isTouch, setIsTouch] = useState(false);

//   useEffect(() => {
//     // Deteksi perangkat sentuh
//     const touch =
//       typeof window !== "undefined" &&
//       ("ontouchstart" in window ||
//         (navigator as any).maxTouchPoints > 0 ||
//         (navigator as any).msMaxTouchPoints > 0);
//     setIsTouch(!!touch);
//   }, []);

//   const tipContent = (
//     <div className="text-sm">
//       <strong>Blok</strong> adalah area/kelompok rumah yang berdekatan, misalnya
//       satu <em>gang</em> atau satu ruas <em>jalan</em>. Contoh: “Gang A–Gang B”
//       atau “Jalan Melati 1–3”. Gunakan Blok untuk mengelompokkan pelanggan
//       berdasarkan lokasi.
//     </div>
//   );

//   const titleExtra = isTouch ? (
//     // MOBILE: gunakan Popover (tap untuk buka)
//     <Popover>
//       <PopoverTrigger asChild>
//         <button
//           type="button"
//           aria-label="Apa itu Blok?"
//           className="inline-flex items-center justify-center rounded-full p-1 hover:bg-muted/50"
//         >
//           <Info className="h-4 w-4 opacity-70" />
//         </button>
//       </PopoverTrigger>
//       <PopoverContent
//         align="start"
//         side="top"
//         sideOffset={10}
//         collisionPadding={16}
//         className="z-[9999] max-w-md break-words p-3 shadow-lg"
//       >
//         {tipContent}
//       </PopoverContent>
//     </Popover>
//   ) : (
//     // DESKTOP: gunakan Tooltip (hover/focus)
//     <TooltipProvider delayDuration={150}>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <button
//             type="button"
//             aria-label="Apa itu Blok?"
//             className="inline-flex items-center justify-center rounded-full p-1 hover:bg-muted/50"
//           >
//             <Info className="h-4 w-4 opacity-70" />
//           </button>
//         </TooltipTrigger>
//         <TooltipContent
//           side="top"
//           align="start"
//           sideOffset={10}
//           collisionPadding={16}
//           className="z-[9999] max-w-md break-words p-3 shadow-lg"
//         >
//           {tipContent}
//         </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   );

//   return (
//     <AuthGuard>
//       <AppShell>
//         <div className="max-w-6xl mx-auto space-y-6">
//           <AppHeader title="Kelola Blok" titleExtra={titleExtra} />

//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//             <div className="text-muted-foreground inline-flex items-center gap-2">
//               <span>Manajemen data blok &amp; penanggung jawab (petugas).</span>
//             </div>

//             <Button className="flex items-center gap-2" form="zona-form">
//               <Plus className="w-4 h-4" />
//               Tambah Blok
//             </Button>
//           </div>

//           <GlassCard className="p-6">
//             <h2 className="text-xl font-semibold text-foreground mb-4">
//               Tambah Blok Baru
//             </h2>
//             <ZonaForm />
//           </GlassCard>

//           <ZonaList />
//         </div>
//       </AppShell>
//     </AuthGuard>
//   );
// }

// app/zona/page.tsx
"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/glass-card";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Info } from "lucide-react";

import { ZonaForm } from "@/components/zona-form";
import { ZonaList } from "@/components/zona-list";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ZonaPage() {
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        // Deteksi perangkat sentuh
        const touch =
            typeof window !== "undefined" &&
            ("ontouchstart" in window ||
                (navigator as any).maxTouchPoints > 0 ||
                (navigator as any).msMaxTouchPoints > 0);
        setIsTouch(!!touch);
    }, []);

    // ====== ambil quota untuk zona (UI) ======
    // endpoint expected: GET /api/zona?quota=1 -> { ok:true, quota: { used, max, remaining } }
    const { data: quotaResp, error: quotaErr } = useSWR<{
        ok: boolean;
        quota: { used: number; max: number; remaining: number };
    }>("/api/zona?quota=1", fetcher, { revalidateOnFocus: true });

    const remaining = quotaResp?.quota?.remaining;
    const max = quotaResp?.quota?.max;
    const used = quotaResp?.quota?.used;
    const quotaHabis = typeof remaining === "number" ? remaining <= 0 : false;

    const tipContent = (
        <div className="text-sm">
            <strong>Blok</strong> adalah area/kelompok rumah yang berdekatan,
            misalnya satu <em>gang</em> atau satu ruas <em>jalan</em>. Contoh:
            “Gang A–Gang B” atau “Jalan Melati 1–3”. Gunakan Blok untuk
            mengelompokkan pelanggan berdasarkan lokasi.
        </div>
    );

    const titleExtra = isTouch ? (
        // MOBILE: gunakan Popover (tap untuk buka)
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label="Apa itu Blok?"
                    className="inline-flex items-center justify-center rounded-full p-1 hover:bg-muted/50"
                >
                    <Info className="h-4 w-4 opacity-70" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                side="top"
                sideOffset={10}
                collisionPadding={16}
                className="z-[9999] max-w-md break-words p-3 shadow-lg"
            >
                {tipContent}
            </PopoverContent>
        </Popover>
    ) : (
        // DESKTOP: gunakan Tooltip (hover/focus)
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        aria-label="Apa itu Blok?"
                        className="inline-flex items-center justify-center rounded-full p-1 hover:bg-muted/50"
                    >
                        <Info className="h-4 w-4 opacity-70" />
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="start"
                    sideOffset={10}
                    collisionPadding={16}
                    className="z-[9999] max-w-md break-words p-3 shadow-lg"
                >
                    {tipContent}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <AuthGuard>
            <AppShell>
                <div className="max-w-6xl mx-auto space-y-6">
                    <AppHeader title="Kelola Blok" titleExtra={titleExtra} />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="text-muted-foreground inline-flex items-center gap-2">
                            <span>
                                Manajemen data blok &amp; penanggung jawab
                                (petugas).
                            </span>
                        </div>

                        {/* Jika quota habis, disable tombol tambah */}
                        <Button
                            className="flex items-center gap-2"
                            form="zona-form"
                            disabled={quotaHabis}
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Blok
                        </Button>
                    </div>

                    <GlassCard className="p-6">
                        <h2 className="text-xl font-semibold text-foreground mb-4">
                            Tambah Blok Baru
                        </h2>

                        {/* Banner kuota (tampilkan bila quota habis atau bila berhasil fetch dan remaining tersedia) */}
                        {quotaResp &&
                            typeof remaining === "number" &&
                            remaining <= 0 && (
                                <div className="mb-4 p-4 border border-amber-300 bg-amber-50 text-amber-900 rounded-md">
                                    <div className="font-medium">
                                        Kuota blok habis
                                    </div>
                                    <div className="text-sm">
                                        Paket kamu sudah mencapai maksimum blok
                                        {typeof max === "number"
                                            ? ` (${max} blok)`
                                            : ""}
                                        . Hapus blok yang tidak dipakai atau{" "}
                                        <a
                                            href="/upgrade"
                                            className="underline"
                                        >
                                            upgrade paket
                                        </a>{" "}
                                        untuk menambah kuota.
                                    </div>
                                </div>
                            )}

                        {/* Jika terjadi error saat fetch quota, tampilkan banner kecil (opsional) */}
                        {quotaErr && (
                            <div className="mb-4 p-3 border border-slate-200 bg-slate-50 text-slate-800 rounded-md">
                                <div className="text-sm">
                                    Gagal memeriksa kuota blok.
                                </div>
                            </div>
                        )}

                        <ZonaForm />
                    </GlassCard>

                    <ZonaList />
                </div>
            </AppShell>
        </AuthGuard>
    );
}
