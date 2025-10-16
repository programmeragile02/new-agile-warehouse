// "use client";

// import { useEffect, useState } from "react";
// import { useSWRConfig } from "swr";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Select,
//   SelectTrigger,
//   SelectContent,
//   SelectItem,
//   SelectValue,
// } from "@/components/ui/select";

// // ===== Types =====
// type ZonaData = {
//   nama: string;
//   kode: string;
//   deskripsi: string;
//   petugasId: string;
//   // NEW:
//   initialMeter: number;
//   tandonId: string;
// };

// type PetugasOption = { id: string; name: string; username?: string };
// type TandonOption = { id: string; kode: string; nama: string };

// // Helper generate kode otomatis (Z + timestamp)
// function genZonaCode() {
//   const ts = Date.now().toString().slice(-5);
//   return `Z${ts}`;
// }

// export function ZonaForm() {
//   const [formData, setFormData] = useState<ZonaData>({
//     nama: "",
//     kode: "",
//     deskripsi: "",
//     petugasId: "",
//     // NEW default:
//     initialMeter: 0,
//     tandonId: "",
//   });
//   const [isLoading, setIsLoading] = useState(false);

//   const [petugasList, setPetugasList] = useState<PetugasOption[]>([]);
//   const [loadingPetugas, setLoadingPetugas] = useState(false);

//   // NEW: tandon
//   const [tandonList, setTandonList] = useState<TandonOption[]>([]);
//   const [loadingTandon, setLoadingTandon] = useState(false);

//   const { toast } = useToast();
//   const { mutate } = useSWRConfig();

//   // Ambil daftar petugas (role=PETUGAS)
//   useEffect(() => {
//     let cancelled = false;
//     const run = async () => {
//       try {
//         setLoadingPetugas(true);
//         const res = await fetch("/api/users?role=PETUGAS", {
//           cache: "no-store",
//         });
//         const data = await res.json();
//         if (!res.ok || !data?.items)
//           throw new Error(data?.message || "Gagal memuat petugas");
//         if (!cancelled) setPetugasList(data.items as PetugasOption[]);
//       } catch {
//         // diam saja
//       } finally {
//         if (!cancelled) setLoadingPetugas(false);
//       }
//     };
//     run();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   // NEW: Ambil daftar tandon (mode ringan)
//   useEffect(() => {
//     let cancelled = false;
//     const run = async () => {
//       try {
//         setLoadingTandon(true);
//         // kamu bisa siapkan endpoint /api/tandon?lite=1 yang mengembalikan items: [{id,kode,nama}]
//         const res = await fetch("/api/tandon?lite=1", { cache: "no-store" });
//         const data = await res.json();
//         if (!res.ok || !data?.items)
//           throw new Error(data?.message || "Gagal memuat tandon");
//         if (!cancelled) setTandonList(data.items as TandonOption[]);
//       } catch {
//         // diam saja biar form tetap jalan (tandon opsional)
//       } finally {
//         if (!cancelled) setLoadingTandon(false);
//       }
//     };
//     run();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const set =
//     (field: keyof ZonaData) =>
//     (
//       e: React.ChangeEvent<
//         HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//       >
//     ) =>
//       setFormData((p) => ({ ...p, [field]: e.target.value }));

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (isLoading) return;
//     setIsLoading(true);

//     try {
//       if (!formData.petugasId) throw new Error("Petugas wajib dipilih");

//       const payload = {
//         nama: formData.nama.trim(),
//         kode: (formData.kode.trim() || genZonaCode()).toUpperCase(),
//         deskripsi: formData.deskripsi.trim() || null,
//         petugasId: formData.petugasId ? String(formData.petugasId) : null,
//         // NEW:
//         initialMeter: Number.isFinite(Number(formData.initialMeter))
//           ? Math.max(0, Math.floor(Number(formData.initialMeter)))
//           : 0,
//         tandonId: formData.tandonId ? String(formData.tandonId) : null,
//       };

//       const res = await fetch("/api/zona", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       if (!res.ok || !data?.ok)
//         throw new Error(data?.message || "Gagal menyimpan zona");

//       toast({
//         title: "Blok berhasil ditambahkan",
//         description: `Kode: ${payload.kode} • Petugas: ${
//           petugasList.find((p) => p.id === payload.petugasId)?.name ?? "-"
//         }${
//           payload.tandonId
//             ? ` • Tandon: ${
//                 tandonList.find((t) => t.id === payload.tandonId)?.nama ?? "-"
//               }`
//             : ""
//         } • Meter Awal: ${payload.initialMeter}`,
//       });

//       await mutate(
//         (key) => typeof key === "string" && key.startsWith("/api/zona")
//       );
//       setFormData({
//         nama: "",
//         kode: "",
//         deskripsi: "",
//         petugasId: "",
//         initialMeter: 0,
//         tandonId: "",
//       });
//     } catch (err) {
//       const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
//       toast({
//         title: "Gagal Menambahkan Blok",
//         description: msg,
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} id="zona-form" className="space-y-6">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="space-y-2">
//           <Label htmlFor="nama">Nama Blok *</Label>
//           <Input
//             id="nama"
//             value={formData.nama}
//             onChange={set("nama")}
//             required
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="kode">Kode Blok</Label>
//           <div className="flex gap-2">
//             <Input
//               id="kode"
//               value={formData.kode}
//               onChange={set("kode")}
//               placeholder="Auto generate jika kosong"
//             />
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() =>
//                 setFormData((p) => ({ ...p, kode: genZonaCode() }))
//               }
//             >
//               Generate
//             </Button>
//           </div>
//         </div>

//         {/* NEW: Meter Awal */}
//         <div className="space-y-2">
//           <Label htmlFor="initialMeter">Meter Awal</Label>
//           <Input
//             id="initialMeter"
//             type="number"
//             min={0}
//             value={formData.initialMeter}
//             onChange={(e) =>
//               setFormData((p) => ({
//                 ...p,
//                 initialMeter: Math.max(
//                   0,
//                   Math.floor(Number(e.target.value || 0))
//                 ),
//               }))
//             }
//             placeholder="0"
//           />
//         </div>

//         {/* NEW: Tandon */}
//         <div className="space-y-2">
//           <Label htmlFor="tandonId" className="text-base font-medium">
//             Tandon (opsional)
//           </Label>
//           <Select
//             value={formData.tandonId || ""}
//             onValueChange={(val) =>
//               setFormData((p) => ({ ...p, tandonId: val }))
//             }
//             disabled={loadingTandon}
//           >
//             <SelectTrigger
//               id="tandonId"
//               className="h-12 text-base bg-card/60 border-primary/30 focus-visible:ring-primary/20 focus-visible:ring-2 focus:border-primary"
//             >
//               <SelectValue
//                 placeholder={
//                   loadingTandon ? "Memuat tandon..." : "-- Pilih Tandon --"
//                 }
//               />
//             </SelectTrigger>
//             <SelectContent className="bg-card/95 backdrop-blur-md border-primary/20">
//               {tandonList.length === 0 && !loadingTandon ? (
//                 <div className="px-3 py-2 text-sm text-muted-foreground">
//                   Belum ada data tandon
//                 </div>
//               ) : (
//                 tandonList.map((t) => (
//                   <SelectItem key={t.id} value={t.id} className="text-sm">
//                     {t.nama}{" "}
//                     <span className="text-muted-foreground">({t.kode})</span>
//                   </SelectItem>
//                 ))
//               )}
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       <div className="space-y-2">
//         <Label htmlFor="deskripsi">Deskripsi</Label>
//         <Textarea
//           id="deskripsi"
//           value={formData.deskripsi}
//           onChange={set("deskripsi")}
//           placeholder="Keterangan tambahan"
//         />
//       </div>

//       <div className="space-y-2">
//         <Label htmlFor="petugasId" className="text-base font-medium">
//           Petugas Penanggung Jawab *
//         </Label>
//         <Select
//           value={formData.petugasId || ""}
//           onValueChange={(val) =>
//             setFormData((p) => ({ ...p, petugasId: val }))
//           }
//           disabled={loadingPetugas}
//         >
//           <SelectTrigger
//             id="petugasId"
//             className="h-12 text-base bg-card/60 border-primary/30 focus-visible:ring-primary/20 focus-visible:ring-2 focus:border-primary"
//           >
//             <SelectValue
//               placeholder={
//                 loadingPetugas ? "Memuat petugas..." : "-- Pilih Petugas --"
//               }
//             />
//           </SelectTrigger>
//           <SelectContent className="bg-card/95 backdrop-blur-md border-primary/20">
//             {petugasList.length === 0 && !loadingPetugas ? (
//               <div className="px-3 py-2 text-sm text-muted-foreground">
//                 Belum ada data petugas
//               </div>
//             ) : (
//               petugasList.map((u) => (
//                 <SelectItem key={u.id} value={u.id} className="text-sm">
//                   {u.name}{" "}
//                   <span className="text-muted-foreground">({u.username})</span>
//                 </SelectItem>
//               ))
//             )}
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="flex justify-end">
//         <Button type="submit" disabled={isLoading}>
//           {isLoading ? "Menyimpan..." : "Simpan Blok"}
//         </Button>
//       </div>
//     </form>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

/* ===================== Types ===================== */
type ZonaData = {
    nama: string;
    kode: string;
    deskripsi: string;
    petugasId: string;
    initialMeter: number;
    tandonId: string;
};

type PetugasOption = { id: string; name: string; username?: string };
type TandonOption = { id: string; kode: string; nama: string };

/* ===================== Helpers ===================== */
const fetcher = (url: string) => fetch(url).then((r) => r.json());
function genZonaCode() {
    const ts = Date.now().toString().slice(-5);
    return `Z${ts}`;
}

/* ===================== Component ===================== */
export function ZonaForm() {
    const [formData, setFormData] = useState<ZonaData>({
        nama: "",
        kode: "",
        deskripsi: "",
        petugasId: "",
        initialMeter: 0,
        tandonId: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const [petugasList, setPetugasList] = useState<PetugasOption[]>([]);
    const [loadingPetugas, setLoadingPetugas] = useState(false);

    const [tandonList, setTandonList] = useState<TandonOption[]>([]);
    const [loadingTandon, setLoadingTandon] = useState(false);

    const { toast } = useToast();
    const { mutate } = useSWRConfig();

    /* ====== QUOTA: ambil sisa kuota blok ======
     endpoint: GET /api/zona?quota=1  -> { ok: true, quota: { used, max, remaining } }
  */
    const { data: quotaResp, error: quotaError } = useSWR<{
        ok: boolean;
        quota: { used: number; max: number; remaining: number };
    }>("/api/zona?quota=1", fetcher, { revalidateOnFocus: true });

    const used = quotaResp?.quota?.used ?? 0;
    const max = quotaResp?.quota?.max ?? Infinity;
    const remaining = quotaResp?.quota?.remaining ?? Infinity;
    const quotaHabis = Number.isFinite(remaining) && remaining <= 0;

    /* ====== Data petugas ====== */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoadingPetugas(true);
                const res = await fetch("/api/users?role=PETUGAS", {
                    cache: "no-store",
                });
                const data = await res.json();
                if (!res.ok || !data?.items)
                    throw new Error(data?.message || "Gagal memuat petugas");
                if (!cancelled) {
                    // Normalize: pastikan items punya id,name,username
                    const items = (data.items as any[]).map((it) => ({
                        id: it.id ?? it.user_id ?? it.uuid ?? "",
                        name: it.name ?? it.nama ?? it.fullname ?? "",
                        username: it.username ?? it.user_name ?? undefined,
                    }));
                    setPetugasList(items.filter((i) => i.id));
                }
            } catch {
                /* ignore */
            } finally {
                if (!cancelled) setLoadingPetugas(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    /* ====== Data tandon (opsional) ====== */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoadingTandon(true);
                const res = await fetch("/api/tandon?lite=1", {
                    cache: "no-store",
                });
                const data = await res.json();
                if (!res.ok || !data?.items)
                    throw new Error(data?.message || "Gagal memuat tandon");
                if (!cancelled) {
                    const items = (data.items as any[]).map((it) => ({
                        id: it.id ?? it.tandon_id ?? "",
                        kode: it.kode ?? it.code ?? "",
                        nama: it.nama ?? it.name ?? "",
                    }));
                    setTandonList(items.filter((i) => i.id));
                }
            } catch {
                /* ignore */
            } finally {
                if (!cancelled) setLoadingTandon(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const set =
        (field: keyof ZonaData) =>
        (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >
        ) =>
            setFormData((p) => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Guard kuota habis (FE)
        if (quotaHabis) {
            toast({
                title: "Kuota blok habis",
                description: `Paket sudah mencapai maksimum blok (${used} / ${
                    Number.isFinite(max) ? max : "∞"
                }). Hapus blok yang tidak dipakai atau upgrade paket.`,
                variant: "destructive",
            });
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        try {
            if (
                !formData.petugasId ||
                String(formData.petugasId).trim() === ""
            ) {
                throw new Error("Petugas wajib dipilih");
            }

            const payload = {
                nama: formData.nama.trim(),
                kode: (formData.kode.trim() || genZonaCode()).toUpperCase(),
                deskripsi: formData.deskripsi.trim() || null,
                petugasId: formData.petugasId
                    ? String(formData.petugasId)
                    : null,
                initialMeter: Number.isFinite(Number(formData.initialMeter))
                    ? Math.max(0, Math.floor(Number(formData.initialMeter)))
                    : 0,
                tandonId: formData.tandonId ? String(formData.tandonId) : null,
            };

            const res = await fetch("/api/zona", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok || !data?.ok) {
                // handle quota error specially
                if (res.status === 403 && data?.code === "QUOTA_EXCEEDED") {
                    const meta = data?.meta ?? {};
                    toast({
                        title: "Kuota blok habis",
                        description:
                            data?.message ??
                            `Kuota blok habis (${meta.used ?? used} / ${
                                meta.max ?? max
                            }). Upgrade paket untuk menambah kuota.`,
                        variant: "destructive",
                    });
                    // refresh quota
                    await mutate("/api/zona?quota=1");
                    throw new Error("QUOTA_EXCEEDED");
                }

                const msg =
                    data?.message ||
                    (res.status === 403
                        ? "Kuota blok habis. Upgrade paket untuk menambah kuota."
                        : "Gagal menyimpan zona");
                throw new Error(msg);
            }

            toast({
                title: "Blok berhasil ditambahkan",
                description: `Kode: ${payload.kode} • Petugas: ${
                    petugasList.find((p) => p.id === payload.petugasId)?.name ??
                    "-"
                }${
                    payload.tandonId
                        ? ` • Tandon: ${
                              tandonList.find((t) => t.id === payload.tandonId)
                                  ?.nama ?? "-"
                          }`
                        : ""
                } • Meter Awal: ${payload.initialMeter}`,
            });

            // refresh list & quota
            await mutate(
                (key) => typeof key === "string" && key.startsWith("/api/zona")
            );
            await mutate("/api/zona?quota=1");

            setFormData({
                nama: "",
                kode: "",
                deskripsi: "",
                petugasId: "",
                initialMeter: 0,
                tandonId: "",
            });
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Terjadi kesalahan";
            // If it's QUOTA_EXCEEDED we already showed toast; avoid duplicate destructive toast
            if (String(msg) !== "QUOTA_EXCEEDED") {
                toast({
                    title: "Gagal Menambahkan Blok",
                    description: msg,
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} id="zona-form" className="space-y-6">
            {/* Banner kuota (lebih informatif) */}
            {quotaHabis ? (
                <div className="p-4 border border-amber-300 bg-amber-50 text-amber-900 rounded-md">
                    <div className="font-medium">Kuota blok habis</div>
                    <div className="text-sm">
                        Paket kamu sudah mencapai maksimum blok.
                        <div className="mt-1">
                            <strong>{used}</strong> terpakai dari{" "}
                            <strong>{Number.isFinite(max) ? max : "∞"}</strong>.
                            <span className="ml-2">
                                Sisa:{" "}
                                {Math.max(
                                    0,
                                    Number.isFinite(max) ? max - used : 0
                                )}
                            </span>
                        </div>
                        <div className="mt-2">
                            Hapus blok yang tidak dipakai atau{" "}
                            <a href="/upgrade" className="underline">
                                upgrade paket
                            </a>{" "}
                            untuk menambah kuota.
                        </div>
                        {quotaError ? (
                            <div className="mt-2 text-xs text-destructive">
                                Gagal memeriksa kuota. Silakan muat ulang
                                halaman.
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : (
                // optional small info when quota near limit
                Number.isFinite(max) &&
                max - used <= 3 && ( // tunjukkan peringatan kalau tinggal sedikit
                    <div className="p-3 border border-amber-200 bg-amber-50 text-amber-900 rounded-md">
                        <div className="text-sm">
                            Kuota blok: <strong>{used}</strong>/
                            <strong>{max}</strong> — sisa{" "}
                            <strong>{Math.max(0, max - used)}</strong>.
                        </div>
                    </div>
                )
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="nama">Nama Blok *</Label>
                    <Input
                        id="nama"
                        value={formData.nama}
                        onChange={set("nama")}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="kode">Kode Blok</Label>
                    <div className="flex gap-2">
                        <Input
                            id="kode"
                            value={formData.kode}
                            onChange={set("kode")}
                            placeholder="Auto generate jika kosong"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setFormData((p) => ({
                                    ...p,
                                    kode: genZonaCode(),
                                }))
                            }
                        >
                            Generate
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="initialMeter">Meter Awal</Label>
                    <Input
                        id="initialMeter"
                        type="number"
                        min={0}
                        value={formData.initialMeter}
                        onChange={(e) =>
                            setFormData((p) => ({
                                ...p,
                                initialMeter: Math.max(
                                    0,
                                    Math.floor(Number(e.target.value || 0))
                                ),
                            }))
                        }
                        placeholder="0"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="tandonId" className="text-base font-medium">
                        Tandon (opsional)
                    </Label>
                    <Select
                        value={formData.tandonId || ""}
                        onValueChange={(val) =>
                            setFormData((p) => ({ ...p, tandonId: val }))
                        }
                        disabled={loadingTandon}
                    >
                        <SelectTrigger
                            id="tandonId"
                            className="h-12 text-base bg-card/60 border-primary/30 focus-visible:ring-primary/20 focus-visible:ring-2 focus:border-primary"
                        >
                            <SelectValue
                                placeholder={
                                    loadingTandon
                                        ? "Memuat tandon..."
                                        : "-- Pilih Tandon --"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent className="bg-card/95 backdrop-blur-md border-primary/20">
                            {tandonList.length === 0 && !loadingTandon ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                    Belum ada data tandon
                                </div>
                            ) : (
                                tandonList.map((t) => (
                                    <SelectItem
                                        key={t.id}
                                        value={t.id}
                                        className="text-sm"
                                    >
                                        {t.nama}{" "}
                                        <span className="text-muted-foreground">
                                            ({t.kode})
                                        </span>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                    id="deskripsi"
                    value={formData.deskripsi}
                    onChange={set("deskripsi")}
                    placeholder="Keterangan tambahan"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="petugasId" className="text-base font-medium">
                    Petugas Penanggung Jawab *
                </Label>
                <Select
                    value={formData.petugasId || ""}
                    onValueChange={(val) =>
                        setFormData((p) => ({ ...p, petugasId: val }))
                    }
                    disabled={loadingPetugas}
                >
                    <SelectTrigger
                        id="petugasId"
                        className="h-12 text-base bg-card/60 border-primary/30 focus-visible:ring-primary/20 focus-visible:ring-2 focus:border-primary"
                    >
                        <SelectValue
                            placeholder={
                                loadingPetugas
                                    ? "Memuat petugas..."
                                    : "-- Pilih Petugas --"
                            }
                        />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-md border-primary/20">
                        {petugasList.length === 0 && !loadingPetugas ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                Belum ada data petugas
                            </div>
                        ) : (
                            petugasList.map((u) => (
                                <SelectItem
                                    key={u.id}
                                    value={u.id}
                                    className="text-sm"
                                >
                                    {u.name}{" "}
                                    <span className="text-muted-foreground">
                                        ({u.username})
                                    </span>
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading || quotaHabis}>
                    {isLoading ? "Menyimpan..." : "Simpan Blok"}
                </Button>
            </div>
        </form>
    );
}
