"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Users,
    Plus,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";

type RoleStr = string;

type AppRoleRow = {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
};

type UserRow = {
    id: string;
    username: string;
    name: string;
    phone: string | null;
    role: RoleStr | null;
    appRoleId?: string | null;
    appRole?: {
        id: string;
        name: string;
    } | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export function UserManagement() {
    const { toast } = useToast();

    const [users, setUsers] = useState<UserRow[]>([]);
    const [roles, setRoles] = useState<AppRoleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        role: "WARGA" as RoleStr, // label / name
        appRoleId: "" as string | "",
        name: "",
        phone: "",
    });

    // ==== Fetch AppRole list ====
    const fetchRoles = async () => {
        setRolesLoading(true);
        try {
            const res = await fetch("/api/app-roles", { cache: "no-store" });
            const json = await res.json().catch(() => ({} as any));

            const list: AppRoleRow[] = Array.isArray(json?.items)
                ? json.items
                : Array.isArray(json)
                ? json
                : [];

            setRoles(list);
        } catch (e) {
            setRoles([]);
            toast({
                title: "Gagal memuat daftar role",
                variant: "destructive",
            });
        } finally {
            setRolesLoading(false);
        }
    };

    // ==== Fetch Users ====
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users", { cache: "no-store" });
            const json = await res.json();

            const list: UserRow[] = Array.isArray(json)
                ? json
                : Array.isArray(json?.items)
                ? json.items
                : [];

            setUsers(list);
        } catch (e) {
            setUsers([]);
            toast({ title: "Gagal memuat user", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // muat roles dulu, user menyusul (bisa juga Promise.all)
        fetchRoles();
        fetchUsers();
    }, []);

    const resetForm = () =>
        setFormData({
            username: "",
            password: "",
            role: "WARGA",
            appRoleId: "",
            name: "",
            phone: "",
        });

    const getDefaultRoleForForm = () => {
        // cari role "WARGA" dulu, kalau ngga ada pakai ADMIN, kalau ngga ada lagi pakai pertama
        if (!roles || roles.length === 0) return { name: "WARGA", id: "" };

        const warga = roles.find(
            (r) => r.isActive && r.name.toUpperCase() === "WARGA"
        );
        if (warga) return { name: warga.name, id: warga.id };

        const admin = roles.find(
            (r) => r.isActive && r.name.toUpperCase() === "ADMIN"
        );
        if (admin) return { name: admin.name, id: admin.id };

        const firstActive = roles.find((r) => r.isActive) ?? roles[0];
        return { name: firstActive.name, id: firstActive.id };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                username: formData.username,
                password: formData.password, // boleh kosong saat update
                name: formData.name,
                role: formData.role, // label (nama role)
                phone: formData.phone || null,
                appRoleId: formData.appRoleId || undefined,
            };

            const url = editingUser
                ? `/api/users/${editingUser.id}`
                : "/api/users";
            const method = editingUser ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({} as any));

            if (!res.ok) {
                const message = data?.message || data?.error || `Coba lagi.`;
                toast({
                    title: "Operasi gagal",
                    description: message,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title:
                    data?.message ??
                    (editingUser ? "User diperbarui" : "User ditambahkan"),
            });

            if (editingUser) {
                setEditingUser(null);
            } else {
                setIsAddDialogOpen(false);
            }
            resetForm();
            await fetchUsers();
        } catch (err: any) {
            console.error("handleSubmit error", err);
            toast({
                title: "Operasi gagal",
                description:
                    err?.message ?? "Terjadi kesalahan jaringan atau server.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (u: UserRow) => {
        const currentRoleName = u.appRole?.name || u.role || "WARGA";
        setEditingUser(u);
        setFormData({
            username: u.username,
            password: "",
            role: currentRoleName,
            appRoleId: u.appRoleId || "",
            name: u.name,
            phone: u.phone ?? "",
        });
    };

    const handleDelete = async (id: string) => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            toast({ title: "User dihapus" });
            await fetchUsers();
        } catch {
            toast({ title: "Gagal menghapus", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (id: string, current: boolean) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle", isActive: !current }),
            });
            if (!res.ok) throw new Error();
            await fetchUsers();
        } catch {
            toast({ title: "Gagal ubah status", variant: "destructive" });
        }
    };

    const getRoleLabel = (u: UserRow) => {
        const roleFromApp = u.appRole?.name;
        const r = (roleFromApp || u.role || "").toUpperCase();

        if (!r) return "Tanpa Role";
        if (r === "ADMIN") return "Administrator";
        if (r === "PETUGAS") return "Petugas Lapangan";
        if (r === "WARGA") return "Warga";
        return roleFromApp || u.role || r;
    };

    const fmtDate = (iso: string) => iso?.slice(0, 10);

    // list untuk dropdown (hanya role aktif)
    const activeRoles = roles.filter((r) => r.isActive);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">
                        Manajemen User
                    </h2>
                </div>

                <Dialog
                    open={isAddDialogOpen}
                    onOpenChange={(open) => {
                        setIsAddDialogOpen(open);
                        if (open) {
                            // saat buka form tambah, set default role dari AppRole
                            const def = getDefaultRoleForForm();
                            setFormData((p) => ({
                                ...p,
                                password: "",
                                role: def.name,
                                appRoleId: def.id,
                            }));
                        } else {
                            resetForm();
                        }
                    }}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white/95 backdrop-blur-md border-white/20">
                        <DialogHeader>
                            <DialogTitle>Tambah User Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="username">Email</Label>
                                <Input
                                    id="username"
                                    type="email"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            username: e.target.value,
                                        }))
                                    }
                                    required
                                    placeholder="Masukkan Email"
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            name: e.target.value,
                                        }))
                                    }
                                    required
                                    placeholder="Masukkan Nama Lengkap"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">
                                    Telepon/WA (opsional)
                                </Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            phone: e.target.value,
                                        }))
                                    }
                                    placeholder="Masukkan Nomor Telepon"
                                />
                            </div>
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            password: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    value={formData.appRoleId}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        const r = roles.find(
                                            (x) => x.id === selectedId
                                        );
                                        setFormData((p) => ({
                                            ...p,
                                            appRoleId: selectedId,
                                            role: r?.name ?? p.role,
                                        }));
                                    }}
                                    className="w-full px-3 py-2 border rounded-md"
                                    disabled={
                                        rolesLoading || activeRoles.length === 0
                                    }
                                >
                                    {rolesLoading && (
                                        <option value="">Memuat role...</option>
                                    )}
                                    {!rolesLoading &&
                                        activeRoles.length === 0 && (
                                            <option value="">
                                                Role belum tersedia
                                            </option>
                                        )}
                                    {!rolesLoading &&
                                        activeRoles.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                                {r.description
                                                    ? ` — ${r.description}`
                                                    : ""}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={submitting}
                            >
                                {submitting ? "Memproses…" : "Tambah User"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-sm text-muted-foreground">Memuat…</div>
            ) : (
                <div className="space-y-2">
                    <h3 className="font-medium">
                        Daftar User ({users.length})
                    </h3>
                    <div className="space-y-2">
                        {users.map((u) => (
                            <div
                                key={u.id}
                                className="flex items-center justify-between p-4 bg-muted/20 rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{u.name}</p>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${
                                                u.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {u.isActive ? "Aktif" : "Nonaktif"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        @{u.username} • {getRoleLabel(u)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Dibuat: {fmtDate(u.createdAt)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleToggleStatus(u.id, u.isActive)
                                        }
                                        className="p-2"
                                    >
                                        {u.isActive ? (
                                            <ToggleRight className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                                        )}
                                    </Button>

                                    <Dialog
                                        open={editingUser?.id === u.id}
                                        onOpenChange={(open) =>
                                            !open && setEditingUser(null)
                                        }
                                    >
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(u)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-white/95 backdrop-blur-md border-white/20">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Edit User
                                                </DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={handleSubmit}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <Label htmlFor="e-username">
                                                        Email / Username
                                                    </Label>
                                                    <Input
                                                        id="e-username"
                                                        value={
                                                            formData.username
                                                        }
                                                        onChange={(e) =>
                                                            setFormData(
                                                                (p) => ({
                                                                    ...p,
                                                                    username:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        required
                                                        disabled
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="e-name">
                                                        Nama Lengkap
                                                    </Label>
                                                    <Input
                                                        id="e-name"
                                                        value={formData.name}
                                                        onChange={(e) =>
                                                            setFormData(
                                                                (p) => ({
                                                                    ...p,
                                                                    name: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="e-phone">
                                                        Telepon/WA
                                                    </Label>
                                                    <Input
                                                        id="e-phone"
                                                        value={formData.phone}
                                                        onChange={(e) =>
                                                            setFormData(
                                                                (p) => ({
                                                                    ...p,
                                                                    phone: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="e-password">
                                                        Password (biarkan kosong
                                                        jika tidak ganti)
                                                    </Label>
                                                    <Input
                                                        id="e-password"
                                                        type="password"
                                                        value={
                                                            formData.password
                                                        }
                                                        onChange={(e) =>
                                                            setFormData(
                                                                (p) => ({
                                                                    ...p,
                                                                    password:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="e-role">
                                                        Role
                                                    </Label>
                                                    <select
                                                        id="e-role"
                                                        value={
                                                            formData.appRoleId
                                                        }
                                                        onChange={(e) => {
                                                            const selectedId =
                                                                e.target.value;
                                                            const r =
                                                                roles.find(
                                                                    (x) =>
                                                                        x.id ===
                                                                        selectedId
                                                                );
                                                            setFormData(
                                                                (p) => ({
                                                                    ...p,
                                                                    appRoleId:
                                                                        selectedId,
                                                                    role:
                                                                        r?.name ??
                                                                        p.role,
                                                                })
                                                            );
                                                        }}
                                                        className="w-full px-3 py-2 border rounded-md"
                                                        disabled={
                                                            rolesLoading ||
                                                            activeRoles.length ===
                                                                0
                                                        }
                                                    >
                                                        {rolesLoading && (
                                                            <option value="">
                                                                Memuat role...
                                                            </option>
                                                        )}
                                                        {!rolesLoading &&
                                                            activeRoles.length ===
                                                                0 && (
                                                                <option value="">
                                                                    Role belum
                                                                    tersedia
                                                                </option>
                                                            )}
                                                        {!rolesLoading &&
                                                            activeRoles.map(
                                                                (r) => (
                                                                    <option
                                                                        key={
                                                                            r.id
                                                                        }
                                                                        value={
                                                                            r.id
                                                                        }
                                                                    >
                                                                        {r.name}
                                                                        {r.description
                                                                            ? ` — ${r.description}`
                                                                            : ""}
                                                                    </option>
                                                                )
                                                            )}
                                                    </select>
                                                </div>
                                                <Button
                                                    type="submit"
                                                    className="w-full"
                                                    disabled={submitting}
                                                >
                                                    {submitting
                                                        ? "Menyimpan…"
                                                        : "Simpan Perubahan"}
                                                </Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>

                                    {u.username !== "admin" && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-white/95 backdrop-blur-md border-white/20">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Hapus User
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Apakah Anda yakin ingin
                                                        menghapus user “{u.name}
                                                        ”? Tindakan ini tidak
                                                        dapat dibatalkan.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                        Batal
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() =>
                                                            handleDelete(u.id)
                                                        }
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        Hapus
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
