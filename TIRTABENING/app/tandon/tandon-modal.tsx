// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import { RefreshCw, Save } from "lucide-react";

// type Props = {
//   open: boolean;
//   onClose: () => void;
//   onSaved?: () => void; // panggil mutate di parent
//   editItem?: {
//     id: string;
//     kode: string;
//     nama: string;
//     deskripsi?: string | null;
//   };
// };

// export function TandonModal({ open, onClose, onSaved, editItem }: Props) {
//   const { toast } = useToast();
//   const [kode, setKode] = useState("");
//   const [nama, setNama] = useState("");
//   const [deskripsi, setDeskripsi] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [genLoading, setGenLoading] = useState(false);

//   useEffect(() => {
//     if (!open) return;
//     if (editItem) {
//       setKode(editItem.kode);
//       setNama(editItem.nama);
//       setDeskripsi(editItem.deskripsi || "");
//     } else {
//       // tambah baru: kosongkan field
//       setKode("");
//       setNama("");
//       setDeskripsi("");
//     }
//   }, [open, editItem]);

//   async function handleGenerate() {
//     setGenLoading(true);
//     try {
//       const res = await fetch("/api/tandon/next-code", { cache: "no-store" });
//       const js = await res.json();
//       if (!res.ok || !js?.ok)
//         throw new Error(js?.message || "Gagal generate kode");
//       setKode(js.kode || "");
//     } catch (e: any) {
//       toast({
//         title: "Gagal generate",
//         description: e?.message ?? "Error",
//         variant: "destructive",
//       });
//     } finally {
//       setGenLoading(false);
//     }
//   }

//   async function handleSave() {
//     if (!nama.trim()) {
//       toast({ title: "Nama wajib diisi", variant: "destructive" });
//       return;
//     }
//     setSaving(true);
//     try {
//       const payload = {
//         // kirim kode bila ada; kalau kosong backend akan generate sendiri
//         ...(kode.trim() ? { kode: kode.trim().toUpperCase() } : {}),
//         nama: nama.trim(),
//         deskripsi: deskripsi.trim() || null,
//       };

//       const url = editItem ? `/api/tandon/${editItem.id}` : "/api/tandon";
//       const method = editItem ? "PUT" : "POST";

//       const res = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const js = await res.json();
//       if (!res.ok || !js?.ok) throw new Error(js?.message || "Gagal menyimpan");

//       toast({
//         title: "Tersimpan",
//         description: editItem ? "Tandon diperbarui" : "Tandon dibuat",
//       });
//       onSaved?.();
//       onClose();
//     } catch (e: any) {
//       toast({
//         title: "Gagal menyimpan",
//         description: e?.message ?? "Error",
//         variant: "destructive",
//       });
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
//       <DialogContent className="sm:max-w-lg">
//         <DialogHeader>
//           <DialogTitle>
//             {editItem ? "Edit Tandon" : "Tambah Tandon"}
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4">
//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <label className="text-sm font-medium">Kode</label>
//               <Button
//                 type="button"
//                 size="sm"
//                 variant="outline"
//                 className="gap-2"
//                 onClick={handleGenerate}
//                 disabled={genLoading}
//                 title="Generate Kode Otomatis"
//               >
//                 <RefreshCw
//                   className={`w-4 h-4 ${genLoading ? "animate-spin" : ""}`}
//                 />
//                 Generate
//               </Button>
//             </div>
//             <Input
//               value={kode}
//               onChange={(e) => setKode(e.target.value.toUpperCase())}
//               placeholder="Mis. TDN-001 (opsional, bisa klik Generate)"
//             />
//           </div>

//           <div className="space-y-2">
//             <label className="text-sm font-medium">Nama</label>
//             <Input
//               value={nama}
//               onChange={(e) => setNama(e.target.value)}
//               placeholder="Tandon Utama"
//             />
//           </div>

//           <div className="space-y-2">
//             <label className="text-sm font-medium">Deskripsi</label>
//             <Textarea
//               value={deskripsi}
//               onChange={(e) => setDeskripsi(e.target.value)}
//               placeholder="Opsional"
//             />
//           </div>
//         </div>

//         <DialogFooter className="gap-2">
//           <Button variant="outline" onClick={onClose}>
//             Batal
//           </Button>
//           <Button onClick={handleSave} disabled={saving} className="gap-2">
//             <Save className="w-4 h-4" />
//             Simpan
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// tandon/tandon-modal.tsx
"use client";

import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Save } from "lucide-react";

type Props = {
    open: boolean;
    onClose: () => void;
    onSaved?: () => void; // panggil mutate di parent bila perlu
    editItem?: {
        id: string;
        kode: string;
        nama: string;
        deskripsi?: string | null;
        initialMeter?: number;
    };
};

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function TandonModal({ open, onClose, onSaved, editItem }: Props) {
    const { toast } = useToast();
    const { mutate } = useSWRConfig();

    const [kode, setKode] = useState("");
    const [nama, setNama] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [initialMeter, setInitialMeter] = useState<string>("0");
    const [saving, setSaving] = useState(false);
    const [genLoading, setGenLoading] = useState(false);

    // ambil quota (dipakai untuk tahu apakah boleh menambah)
    const { data: quotaResp, mutate: mutateQuota } = useSWR<{
        ok: boolean;
        quota: { used: number; max: number; remaining: number };
    }>(open ? "/api/tandon?quota=1" : null, fetcher, {
        revalidateOnFocus: false,
    });
    const remaining = quotaResp?.quota?.remaining ?? Infinity;
    const quotaHabis = Number.isFinite(remaining) && remaining <= 0;

    useEffect(() => {
        if (!open) return;
        if (editItem) {
            setKode(editItem.kode ?? "");
            setNama(editItem.nama ?? "");
            setDeskripsi(editItem.deskripsi ?? "");
            setInitialMeter(String(editItem.initialMeter ?? 0));
        } else {
            // new item: kosongkan dan auto-generate kode
            setKode("");
            setNama("");
            setDeskripsi("");
            setInitialMeter("0");
            // trigger generate otomatis (non-blocking)
            handleGenerate().catch(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editItem]);

    async function handleGenerate() {
        setGenLoading(true);
        try {
            // gunakan endpoint action=next-code yang sesuai route
            const res = await fetch("/api/tandon?action=next-code", {
                cache: "no-store",
            });
            const js = await res.json();
            if (!res.ok || !js?.ok)
                throw new Error(js?.message || "Gagal generate kode");
            setKode(js.kode || "");
        } catch (e: any) {
            toast({
                title: "Gagal generate",
                description: e?.message ?? "Error",
                variant: "destructive",
            });
        } finally {
            setGenLoading(false);
        }
    }

    async function handleSave() {
        if (!nama.trim()) {
            toast({ title: "Nama wajib diisi", variant: "destructive" });
            return;
        }

        // client-side guard: bila kuota habis dan ini CREATE (bukan edit) -> blok
        if (!editItem && quotaHabis) {
            toast({
                title: "Kuota tandon habis",
                description:
                    "Tidak dapat menambah tandon karena kuota paket sudah penuh.",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            const payload: any = {
                nama: nama.trim(),
                deskripsi: deskripsi.trim() || null,
                initialMeter: Math.max(0, Number(initialMeter) || 0),
            };
            if (kode.trim()) payload.kode = kode.trim().toUpperCase();

            // gunakan POST /api/tandon untuk create, PUT /api/tandon untuk update (route kamu)
            let res: Response;
            if (editItem) {
                const body = { ...payload, id: editItem.id };
                res = await fetch("/api/tandon", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                res = await fetch("/api/tandon", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            const js = await res.json();

            if (!res.ok || !js?.ok) {
                // jika server memberi kode khusus QUOTA_EXCEEDED atau pesan
                if (
                    js?.code === "QUOTA_EXCEEDED" ||
                    /quota/i.test(js?.message || "")
                ) {
                    throw new Error(js?.message || "Kuota tandon habis");
                }
                throw new Error(js?.message || "Gagal menyimpan");
            }

            toast({
                title: "Tersimpan",
                description: editItem ? "Tandon diperbarui" : "Tandon dibuat",
            });

            // refresh daftar tandon & quota di parent
            await mutate("/api/tandon");
            await mutateQuota?.();
            await mutate("/api/tandon?quota=1");
            onSaved?.();
            onClose();
        } catch (e: any) {
            toast({
                title: "Gagal menyimpan",
                description: e?.message ?? "Error",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {editItem ? "Edit Tandon" : "Tambah Tandon"}
                    </DialogTitle>
                </DialogHeader>

                {/* Banner kuota di modal (jika habis dan sedang tambah baru) */}
                {!editItem && quotaHabis && (
                    <div className="mb-3 p-3 border border-amber-300 bg-amber-50 text-amber-900 rounded-md">
                        <div className="font-medium">Kuota tandon habis</div>
                        <div className="text-sm">
                            Paket kamu sudah mencapai maksimum tandon. Hapus
                            tandon yang tidak digunakan atau{" "}
                            <a href="/upgrade" className="underline">
                                upgrade paket
                            </a>{" "}
                            untuk menambah kuota.
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Kode</label>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={handleGenerate}
                                disabled={genLoading}
                                title="Generate Kode Otomatis"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${
                                        genLoading ? "animate-spin" : ""
                                    }`}
                                />
                                Generate
                            </Button>
                        </div>
                        <Input
                            value={kode}
                            onChange={(e) =>
                                setKode(e.target.value.toUpperCase())
                            }
                            placeholder="Mis. TDN-001 (opsional, bisa klik Generate)"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nama</label>
                        <Input
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                            placeholder="Tandon Utama"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Deskripsi</label>
                        <Textarea
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                            placeholder="Opsional"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Meter Awal (pertama kali)
                        </label>
                        <Input
                            type="number"
                            min={0}
                            value={initialMeter}
                            onChange={(e) => setInitialMeter(e.target.value)}
                            placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground">
                            Hanya dipakai pada periode pertama. Periode
                            berikutnya akan memakai meter akhir bulan
                            sebelumnya.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || (!editItem && quotaHabis)}
                        className="gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
