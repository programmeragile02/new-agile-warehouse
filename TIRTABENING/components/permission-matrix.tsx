"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { usePermissionStore } from "@/lib/permission-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Users,
    Settings,
    CheckSquare,
    XSquare,
    ToggleRight,
} from "lucide-react";

export function PermissionMatrix() {
    const {
        permissions,
        roles,
        addRole,
        updateRole,
        deleteRole,
        toggleRoleStatus,
        updateRolePermission,
        hasPermission,
        fetchAll,

        // ===== bulk store methods =====
        bulkSetAllRolesAll,
        bulkSetRoleAll,
        bulkSetRoleAction,
        bulkSetRoleActionForCategory,
    } = usePermissionStore();

    const { toast } = useToast();
    const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [roleForm, setRoleForm] = useState({ name: "", description: "" });

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const handleSubmitRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRole) {
            updateRole(editingRole.id, roleForm);
            toast({
                title: "Berhasil",
                description: "Role berhasil diperbarui",
            });
            setEditingRole(null);
        } else {
            addRole({ ...roleForm, isActive: true });
            toast({
                title: "Berhasil",
                description: "Role berhasil ditambahkan",
            });
            setIsAddRoleOpen(false);
        }
        setRoleForm({ name: "", description: "" });
    };

    const handlePermissionChange = (
        roleId: string,
        permissionId: string,
        action: string,
        checked: boolean
    ) => {
        const key = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as
            | "canView"
            | "canAdd"
            | "canEdit"
            | "canDelete";
        updateRolePermission(roleId, permissionId, { [key]: checked });
    };

    const groupedPermissions = permissions.reduce((acc, permission) => {
        const key = permission.category ?? "—";
        if (!acc[key]) acc[key] = [];
        acc[key].push(permission);
        return acc;
    }, {} as Record<string, typeof permissions>);

    const activeRoles = roles.filter((r) => r.isActive);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">
                        Hak Akses User
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bulkSetAllRolesAll(true)}
                    >
                        <CheckSquare className="w-4 h-4 mr-2" /> Centang Semua
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bulkSetAllRolesAll(false)}
                    >
                        <XSquare className="w-4 h-4 mr-2" /> Hapus Semua
                    </Button> */}

                    <Dialog
                        open={isAddRoleOpen}
                        onOpenChange={setIsAddRoleOpen}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Role
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white/95 backdrop-blur-md border-white/20">
                            <DialogHeader>
                                <DialogTitle>Tambah Role Baru</DialogTitle>
                            </DialogHeader>
                            <form
                                onSubmit={handleSubmitRole}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="role-name">Nama Role</Label>
                                    <Input
                                        id="role-name"
                                        value={roleForm.name}
                                        onChange={(e) =>
                                            setRoleForm((p) => ({
                                                ...p,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder="Masukkan nama role"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role-description">
                                        Deskripsi
                                    </Label>
                                    <Input
                                        id="role-description"
                                        value={roleForm.description}
                                        onChange={(e) =>
                                            setRoleForm((p) => ({
                                                ...p,
                                                description: e.target.value,
                                            }))
                                        }
                                        placeholder="Masukkan deskripsi role"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Tambah Role
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Role Management */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" /> Manajemen Role ({roles.length}
                    )
                </h3>

                <div className="grid gap-3">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className="flex items-center justify-between p-4 bg-muted/20 rounded-lg"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{role.name}</h4>
                                    <Badge
                                        variant={
                                            role.isActive
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {role.isActive ? "Aktif" : "Nonaktif"}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {role.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Dibuat: {role.createdAt}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    hidden={role.name === "ADMIN" || role.name === "PETUGAS" || role.name === "WARGA"}
                                    onClick={() => toggleRoleStatus(role.id)}
                                >
                                    <ToggleRight className="w-4 h-4" />
                                </Button>

                                <Dialog
                                    open={editingRole?.id === role.id}
                                    onOpenChange={(open) =>
                                        !open && setEditingRole(null)
                                    }
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            hidden={role.name === "ADMIN" || role.name === "PETUGAS" || role.name === "WARGA"}
                                            onClick={() => {
                                                setEditingRole(role);
                                                setRoleForm({
                                                    name: role.name,
                                                    description:
                                                        role.description || "",
                                                });
                                            }}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white/95 backdrop-blur-md border-white/20">
                                        <DialogHeader>
                                            <DialogTitle>Edit Role</DialogTitle>
                                        </DialogHeader>
                                        <form
                                            onSubmit={handleSubmitRole}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <Label htmlFor="edit-role-name">
                                                    Nama Role
                                                </Label>
                                                <Input
                                                    id="edit-role-name"
                                                    value={roleForm.name}
                                                    onChange={(e) =>
                                                        setRoleForm((p) => ({
                                                            ...p,
                                                            name: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    required
                                                    disabled={
                                                        role.isSystem === true
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-role-description">
                                                    Deskripsi
                                                </Label>
                                                <Input
                                                    id="edit-role-description"
                                                    value={roleForm.description}
                                                    onChange={(e) =>
                                                        setRoleForm((p) => ({
                                                            ...p,
                                                            description:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    required
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                            >
                                                Simpan Perubahan
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                {!["admin", "petugas", "warga"].includes(
                                    role.name.toLowerCase()
                                ) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            deleteRole(role.id);
                                            toast({
                                                title: "Berhasil",
                                                description:
                                                    "Role berhasil dihapus",
                                            });
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Permission Matrix */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Hak Akses</h3>

                <div className="overflow-x-auto">
                    <div className="min-w-full">
                        {Object.entries(groupedPermissions).map(
                            ([category, categoryPermissions]) => (
                                <div key={category} className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-md font-medium text-primary">
                                            {category || "—"}
                                        </h4>
                                        {/* Bulk pada kategori ini untuk semua role aktif */}
                                        {/* <div className="flex gap-2">
                                            {activeRoles.map((role) => (
                                                <div
                                                    key={role.id}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span className="text-xs text-muted-foreground">
                                                        {role.name}:
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            bulkSetRoleActionForCategory(
                                                                role.id,
                                                                "all",
                                                                true,
                                                                category
                                                            )
                                                        }
                                                    >
                                                        All
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            bulkSetRoleActionForCategory(
                                                                role.id,
                                                                "all",
                                                                false,
                                                                category
                                                            )
                                                        }
                                                    >
                                                        None
                                                    </Button>
                                                </div>
                                            ))}
                                        </div> */}
                                    </div>

                                    <div className="bg-white/50 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-muted/30">
                                                        <th className="text-left p-3 font-medium min-w-[240px]">
                                                            Menu
                                                        </th>
                                                        {activeRoles.map(
                                                            (role) => (
                                                                <th
                                                                    key={
                                                                        role.id
                                                                    }
                                                                    className="text-center p-3 font-medium min-w-[160px]"
                                                                >
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <span className="text-sm">
                                                                            {
                                                                                role.name
                                                                            }
                                                                        </span>
                                                                        {/* Baris kontrol bulk per-role */}
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    bulkSetRoleAll(
                                                                                        role.id,
                                                                                        true
                                                                                    )
                                                                                }
                                                                            >
                                                                                Ctg Semua
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                disabled={role.name === "ADMIN"}
                                                                                onClick={() =>
                                                                                    bulkSetRoleAll(
                                                                                        role.id,
                                                                                        false
                                                                                    )
                                                                                }
                                                                            >
                                                                                Hapus Semua Ctg
                                                                            </Button>
                                                                        </div>
                                                                        {/* Toggle per-aksi untuk role ini */}
                                                                        <div className="grid grid-cols-4 gap-2 text-xs mt-2 items-center">
                                                                            {(
                                                                                [
                                                                                    "view",
                                                                                    "add",
                                                                                    "edit",
                                                                                    "delete",
                                                                                ] as const
                                                                            ).map(
                                                                                (
                                                                                    act
                                                                                ) => (
                                                                                    <Checkbox
                                                                                        key={
                                                                                            act
                                                                                        }
                                                                                        // Indeterminate state tidak kita tampilkan; ini tombol aksi massal
                                                                                        onCheckedChange={(
                                                                                            checked
                                                                                        ) =>
                                                                                            bulkSetRoleAction(
                                                                                                role.id,
                                                                                                act,
                                                                                                !!checked
                                                                                            )
                                                                                        }
                                                                                        className="w-4 h-4"
                                                                                    />
                                                                                )
                                                                            )}
                                                                            <div className="col-span-4 grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
                                                                                <span>
                                                                                    V
                                                                                </span>
                                                                                <span>
                                                                                    A
                                                                                </span>
                                                                                <span>
                                                                                    E
                                                                                </span>
                                                                                <span>
                                                                                    D
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </th>
                                                            )
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {categoryPermissions.map(
                                                        (permission) => (
                                                            <tr
                                                                key={
                                                                    permission.id
                                                                }
                                                                className="border-t border-white/10"
                                                            >
                                                                <td className="p-3">
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {
                                                                                permission.menuTitle
                                                                            }
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {permission.productCode ??
                                                                                ""}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                {activeRoles.map(
                                                                    (role) => (
                                                                        <td
                                                                            key={
                                                                                role.id
                                                                            }
                                                                            className="p-3"
                                                                        >
                                                                            <div className="grid grid-cols-4 gap-2 justify-items-center">
                                                                                {[
                                                                                    "view",
                                                                                    "add",
                                                                                    "edit",
                                                                                    "delete",
                                                                                ].map(
                                                                                    (
                                                                                        action
                                                                                    ) => (
                                                                                        <Checkbox
                                                                                            key={
                                                                                                action
                                                                                            }
                                                                                            checked={hasPermission(
                                                                                                role.id,
                                                                                                permission.id,
                                                                                                action as any
                                                                                            )}
                                                                                            onCheckedChange={(
                                                                                                checked
                                                                                            ) =>
                                                                                                handlePermissionChange(
                                                                                                    role.id,
                                                                                                    permission.id,
                                                                                                    action,
                                                                                                    checked as boolean
                                                                                                )
                                                                                            }
                                                                                            className="w-4 h-4"
                                                                                        />
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    )
                                                                )}
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Keterangan:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                        <strong>V:</strong> View (Lihat)
                    </div>
                    <div>
                        <strong>A:</strong> Add (Tambah)
                    </div>
                    <div>
                        <strong>E:</strong> Edit (Ubah)
                    </div>
                    <div>
                        <strong>D:</strong> Delete (Hapus)
                    </div>
                </div>
            </div>
        </div>
    );
}