"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { AppHeader } from "@/components/app-header";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Save, Shield, UserCog, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ZonaLite = { id: string; kode: string; nama: string };
type Profil = {
    id: string;
    username: string;
    name: string;
    phone: string | null;
    role: "ADMIN" | "PETUGAS" | "WARGA";
    createdAt: string;
    zonas: ZonaLite[];
};

export default function ProfilPetugasPage() {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPass, setSavingPass] = useState(false);

    const [data, setData] = useState<Profil | null>(null);
    const [form, setForm] = useState({ name: "", phone: "" });
    const [pwd, setPwd] = useState({
        oldPassword: "",
        newPassword: "",
        confirm: "",
    });

    const [show, setShow] = useState({ old: false, nw: false, conf: false });

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch("/api/petugas/profil", {
                    cache: "no-store",
                });
                const j = await r.json().catch(() => null);
                if (r.ok && j?.ok) {
                    setData(j.data);
                    setForm({
                        name: j.data.name ?? "",
                        phone: j.data.phone ?? "",
                    });
                } else {
                    toast({
                        variant: "destructive",
                        description: j?.message || "Gagal memuat profil",
                    });
                }
            } catch {
                toast({
                    variant: "destructive",
                    description: "Gagal memuat profil",
                });
            } finally {
                setLoading(false);
            }
        })();
    }, [toast]);

    async function onSave() {
        if (!form.name.trim()) {
            toast({ description: "Nama wajib diisi" });
            return;
        }
        setSaving(true);
        try {
            const r = await fetch("/api/petugas/profil", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    phone: form.phone.trim() || null,
                }),
            });
            const j = await r.json().catch(() => null);
            if (r.status === 200 && j?.ok) {
                toast({ description: "Data berhasil disimpan" });
                setData((d) =>
                    d
                        ? {
                              ...d,
                              name: form.name.trim(),
                              phone: form.phone.trim() || null,
                          }
                        : d
                );
            } else if (r.status === 401) {
                toast({
                    variant: "destructive",
                    description: j?.message || "Sesi berakhir, login ulang",
                });
            } else {
                toast({
                    variant: "destructive",
                    description: j?.message || "Gagal menyimpan",
                });
            }
        } catch {
            toast({ variant: "destructive", description: "Gagal menyimpan" });
        } finally {
            setSaving(false);
        }
    }

    async function onChangePassword() {
        const oldPassword = pwd.oldPassword.trim();
        const newPassword = pwd.newPassword.trim();
        const confirm = pwd.confirm.trim();

        if (!oldPassword || !newPassword) {
            toast({ description: "Isi sandi lama & baru" });
            return;
        }
        if (newPassword.length < 6) {
            toast({ description: "Sandi baru minimal 6 karakter" });
            return;
        }
        if (newPassword !== confirm) {
            toast({ description: "Konfirmasi sandi tidak sama" });
            return;
        }

        setSavingPass(true);
        try {
            const r = await fetch("/api/petugas/profil", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword, newPassword }),
            });
            const j = await r.json().catch(() => null);

            if (process.env.NODE_ENV !== "production") {
                // bantu debugging cepat: lihat reason & prefix hash di console
                // (akan muncul kalau server mengirimkannya)
                // eslint-disable-next-line no-console
                console.log("Change password resp:", j);
            }

            if (r.status === 200 && j?.ok) {
                toast({ description: "Sandi berhasil diubah" });
                setPwd({ oldPassword: "", newPassword: "", confirm: "" });
            } else if (r.status === 409) {
                toast({
                    variant: "destructive",
                    description:
                        j?.message ||
                        "Akun masih memakai format sandi lama (scrypt). Minta admin migrasi via panel admin.",
                });
            } else if (r.status === 401) {
                toast({
                    variant: "destructive",
                    description: j?.message || "Sesi berakhir, login ulang",
                });
            } else if (r.status === 502) {
                toast({
                    variant: "destructive",
                    description:
                        j?.message ||
                        "Sandi tidak tersinkron ke server pusat. Coba ulangi.",
                });
            } else if (r.status === 400) {
                toast({
                    variant: "destructive",
                    description: j?.message || "Sandi lama salah",
                });
            } else {
                toast({
                    variant: "destructive",
                    description: j?.message || "Gagal mengubah sandi",
                });
            }
        } catch {
            toast({
                variant: "destructive",
                description: "Terjadi kesalahan jaringan",
            });
        } finally {
            setSavingPass(false);
        }
    }

    return (
        <AuthGuard requiredRole="PETUGAS">
            <AppShell>
                <div className="max-w-6xl mx-auto space-y-6">
                    <AppHeader title="Profil Petugas" />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="text-muted-foreground">
                            Kelola informasi akun petugas catat meter.
                        </p>
                    </div>

                    {/* Kartu Profil Dasar */}
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <UserCog className="w-5 h-5 text-emerald-700" />
                            <h2 className="text-xl font-semibold">
                                Informasi Akun
                            </h2>
                        </div>

                        {loading ? (
                            <div className="text-sm text-muted-foreground">
                                Memuat…
                            </div>
                        ) : !data ? (
                            <div className="text-sm text-muted-foreground">
                                Data tidak tersedia
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Username
                                        </label>
                                        <Input value={data.username} disabled />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Role
                                        </label>
                                        <Input value={data.role} disabled />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Nama
                                        </label>
                                        <Input
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    name: e.target.value,
                                                }))
                                            }
                                            placeholder="Nama lengkap"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                            No. WhatsApp
                                        </label>
                                        <Input
                                            value={form.phone}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    phone: e.target.value,
                                                }))
                                            }
                                            placeholder="Masukkan Nomer Whatsapp"
                                        />
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    Dibuat:{" "}
                                    {new Date(
                                        data.createdAt
                                    ).toLocaleDateString("id-ID", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={onSave}
                                        disabled={saving}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving
                                            ? "Menyimpan…"
                                            : "Simpan Perubahan"}
                                    </Button>
                                </div>

                                <Separator />

                                {/* Zona yang dipegang */}
                                <div className="space-y-2">
                                    <div className="font-medium">
                                        Blok yang Dipegang
                                    </div>
                                    {data.zonas?.length ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {data.zonas.map((z) => (
                                                <div
                                                    key={z.id}
                                                    className="rounded-lg border px-3 py-2 text-sm bg-muted/40"
                                                >
                                                    <div className="font-medium">
                                                        {z.nama}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {z.kode}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">
                                            Belum ada blok yang ditugaskan.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    {/* Kartu Ubah Password */}
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-emerald-700" />
                            <h2 className="text-xl font-semibold">
                                Keamanan Akun
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="relative">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Sandi Lama
                                </label>
                                <Input
                                    type={show.old ? "text" : "password"}
                                    value={pwd.oldPassword}
                                    onChange={(e) =>
                                        setPwd((p) => ({
                                            ...p,
                                            oldPassword: e.target.value,
                                        }))
                                    }
                                    placeholder="Masukkan sandi lama"
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-7 p-1 rounded hover:bg-muted"
                                    onClick={() =>
                                        setShow((s) => ({ ...s, old: !s.old }))
                                    }
                                    aria-label={
                                        show.old
                                            ? "Sembunyikan sandi lama"
                                            : "Tampilkan sandi lama"
                                    }
                                >
                                    {show.old ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            <div className="relative">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Sandi Baru
                                </label>
                                <Input
                                    type={show.nw ? "text" : "password"}
                                    value={pwd.newPassword}
                                    onChange={(e) =>
                                        setPwd((p) => ({
                                            ...p,
                                            newPassword: e.target.value,
                                        }))
                                    }
                                    placeholder="Minimal 6 karakter"
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-7 p-1 rounded hover:bg-muted"
                                    onClick={() =>
                                        setShow((s) => ({ ...s, nw: !s.nw }))
                                    }
                                    aria-label={
                                        show.nw
                                            ? "Sembunyikan sandi baru"
                                            : "Tampilkan sandi baru"
                                    }
                                >
                                    {show.nw ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            <div className="relative">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Konfirmasi Sandi Baru
                                </label>
                                <Input
                                    type={show.conf ? "text" : "password"}
                                    value={pwd.confirm}
                                    onChange={(e) =>
                                        setPwd((p) => ({
                                            ...p,
                                            confirm: e.target.value,
                                        }))
                                    }
                                    placeholder="Ulangi sandi baru"
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-7 p-1 rounded hover:bg-muted"
                                    onClick={() =>
                                        setShow((s) => ({
                                            ...s,
                                            conf: !s.conf,
                                        }))
                                    }
                                    aria-label={
                                        show.conf
                                            ? "Sembunyikan konfirmasi sandi"
                                            : "Tampilkan konfirmasi sandi"
                                    }
                                >
                                    {show.conf ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={onChangePassword}
                                disabled={savingPass}
                                variant="outline"
                                className="bg-transparent"
                            >
                                {savingPass ? "Menyimpan…" : "Ubah Sandi"}
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            </AppShell>
        </AuthGuard>
    );
}
