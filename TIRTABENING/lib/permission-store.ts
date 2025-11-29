// lib/permission-store.ts
import { create } from "zustand";

export type UIRole = {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    isSystem?: boolean; // kalau sudah ditambah di schema (opsional)
    createdAt?: string;
};

export type UIPermission = {
    id: string;
    menuId: string; // stringified BigInt
    menuTitle: string;
    category?: string | null;
    productCode?: string | null;
    isActive: boolean;
};

export type UIRolePermission = {
    id: string;
    roleId: string;
    permissionId: string;
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
};

async function j<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    const ct = res.headers.get("content-type") || "";
    let body: any = null;
    try {
        body = ct.includes("application/json")
            ? await res.json()
            : await res.text();
    } catch {}
    if (!res.ok) {
        const msg =
            typeof body === "object" && body?.error
                ? body.error
                : res.statusText;
        throw new Error(`Request ${url} failed: ${res.status} ${msg}`);
    }
    return body as T;
}

type Action = "view" | "add" | "edit" | "delete" | "all";

export const usePermissionStore = create<{
    roles: UIRole[];
    permissions: UIPermission[];
    rolePermissions: UIRolePermission[];

    fetchAll: () => Promise<void>;
    addRole: (payload: {
        name: string;
        description?: string;
        isActive?: boolean;
    }) => Promise<void>;
    updateRole: (id: string, payload: Partial<UIRole>) => Promise<void>;
    deleteRole: (id: string) => Promise<void>;
    toggleRoleStatus: (id: string) => Promise<void>;
    updateRolePermission: (
        roleId: string,
        permissionId: string,
        patch: Partial<
            Pick<
                UIRolePermission,
                "canView" | "canAdd" | "canEdit" | "canDelete"
            >
        >
    ) => Promise<void>;

    // ===== BULK =====
    bulkSetRoleAction: (
        roleId: string,
        action: Action,
        value: boolean,
        opts?: { category?: string | null; permissionIds?: string[] }
    ) => Promise<void>;
    bulkSetAllRolesAll: (value: boolean) => Promise<void>;
    bulkSetRoleAll: (roleId: string, value: boolean) => Promise<void>;
    bulkSetRoleActionForCategory: (
        roleId: string,
        action: Action,
        value: boolean,
        category: string
    ) => Promise<void>;

    hasPermission: (
        roleId: string,
        permissionId: string,
        action: "view" | "add" | "edit" | "delete"
    ) => boolean;
}>(() => ({
    roles: [],
    permissions: [],
    rolePermissions: [],

    fetchAll: async () => {
        const [permJ, roleJ, linkJ] = await Promise.all([
            j<{ ok: boolean; data: UIPermission[] }>("/api/permissions"),
            j<{ ok: boolean; data: UIRole[] }>("/api/roles"),
            j<{ ok: boolean; data: UIRolePermission[] }>(
                "/api/role-permissions"
            ),
        ]);
        usePermissionStore.setState({
            permissions: permJ.data,
            roles: roleJ.data,
            rolePermissions: linkJ.data,
        });
    },

    addRole: async (payload) => {
        await j("/api/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        await usePermissionStore.getState().fetchAll();
    },

    updateRole: async (id, payload) => {
        await j(`/api/roles/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        await usePermissionStore.getState().fetchAll();
    },

    deleteRole: async (id) => {
        await j(`/api/roles/${id}`, { method: "DELETE" });
        usePermissionStore.setState((s) => ({
            roles: s.roles.filter((r) => r.id !== id),
            rolePermissions: s.rolePermissions.filter((rp) => rp.roleId !== id),
        }));
    },

    toggleRoleStatus: async (id) => {
        const role = usePermissionStore
            .getState()
            .roles.find((r) => r.id === id);
        if (!role) return;
        await j(`/api/roles/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !role.isActive }),
        });
        await usePermissionStore.getState().fetchAll();
    },

    updateRolePermission: async (roleId, permissionId, patch) => {
        await j("/api/role-permissions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roleId, permissionId, ...patch }),
        });

        // Optimistic cache kecil
        usePermissionStore.setState((s) => {
            const idx = s.rolePermissions.findIndex(
                (x) => x.roleId === roleId && x.permissionId === permissionId
            );
            if (idx >= 0) {
                const next = [...s.rolePermissions];
                next[idx] = { ...next[idx], ...patch };
                return { rolePermissions: next } as any;
            }
            return {
                rolePermissions: [
                    ...s.rolePermissions,
                    {
                        id: "temp",
                        roleId,
                        permissionId,
                        canView: false,
                        canAdd: false,
                        canEdit: false,
                        canDelete: false,
                        ...patch,
                    },
                ],
            } as any;
        });
    },

    // ===== BULK IMPLEMENTATION =====
    bulkSetRoleAction: async (roleId, action, value, opts) => {
        await j("/api/role-permissions/bulk", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                roleId,
                action,
                value,
                ...(opts?.category ? { category: opts.category } : {}),
                ...(opts?.permissionIds
                    ? { permissionIds: opts.permissionIds }
                    : {}),
            }),
        });
        await usePermissionStore.getState().fetchAll();
    },

    bulkSetAllRolesAll: async (value) => {
        const s = usePermissionStore.getState();
        const activeRoles = s.roles.filter((r) => r.isActive);
        for (const role of activeRoles) {
            await usePermissionStore
                .getState()
                .bulkSetRoleAction(role.id, "all", value);
        }
    },

    bulkSetRoleAll: async (roleId, value) => {
        await usePermissionStore
            .getState()
            .bulkSetRoleAction(roleId, "all", value);
    },

    bulkSetRoleActionForCategory: async (roleId, action, value, category) => {
        await usePermissionStore
            .getState()
            .bulkSetRoleAction(roleId, action, value, { category });
    },

    hasPermission: (roleId, permissionId, action) => {
        const m = usePermissionStore
            .getState()
            .rolePermissions.find(
                (x) => x.roleId === roleId && x.permissionId === permissionId
            );
        if (!m) return false;
        switch (action) {
            case "view":
                return !!m.canView;
            case "add":
                return !!m.canAdd;
            case "edit":
                return !!m.canEdit;
            case "delete":
                return !!m.canDelete;
        }
    },
}));