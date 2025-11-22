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

// import { create } from "zustand";
// import { persist } from "zustand/middleware";
// export interface Permission {
//   id: string;
//   name: string;
//   description: string;
//   category: string;
// }

// export interface RolePermission {
//   roleId: string;
//   permissionId: string;
//   canView: boolean;
//   canAdd: boolean;
//   canEdit: boolean;
//   canDelete: boolean;
// }

// export interface Role {
//   id: string;
//   name: string;
//   description: string;
//   isActive: boolean;
//   createdAt: string;
// }

// interface PermissionStore {
//   permissions: Permission[];
//   roles: Role[];
//   rolePermissions: RolePermission[];

//   // Permission actions
//   addPermission: (permission: Omit<Permission, "id">) => void;
//   updatePermission: (id: string, permission: Partial<Permission>) => void;
//   deletePermission: (id: string) => void;

//   // Role actions
//   addRole: (role: Omit<Role, "id" | "createdAt">) => void;
//   updateRole: (id: string, role: Partial<Role>) => void;
//   deleteRole: (id: string) => void;
//   toggleRoleStatus: (id: string) => void;

//   // Role Permission actions
//   updateRolePermission: (
//     roleId: string,
//     permissionId: string,
//     permissions: Partial<Omit<RolePermission, "roleId" | "permissionId">>
//   ) => void;
//   getRolePermissions: (roleId: string) => RolePermission[];
//   hasPermission: (
//     roleId: string,
//     permissionId: string,
//     action: "view" | "add" | "edit" | "delete"
//   ) => boolean;
// }

// export const usePermissionStore = create<PermissionStore>()(
//   persist(
//     (set, get) => ({
//       permissions: [
//         {
//           id: "dashboard",
//           name: "Dashboard",
//           description: "Akses ke halaman dashboard utama",
//           category: "Umum",
//         },
//         {
//           id: "pelanggan",
//           name: "Manajemen Pelanggan",
//           description: "Kelola data pelanggan",
//           category: "Pelanggan",
//         },
//         {
//           id: "catat-meter",
//           name: "Catat Meter",
//           description: "Input pembacaan meter air",
//           category: "Operasional",
//         },
//         {
//           id: "pelunasan",
//           name: "Pelunasan",
//           description: "Proses pembayaran tagihan",
//           category: "Keuangan",
//         },
//         {
//           id: "laporan",
//           name: "Laporan",
//           description: "Akses laporan dan analitik",
//           category: "Laporan",
//         },
//         {
//           id: "kendala",
//           name: "Kendala Air",
//           description: "Manajemen kendala dan masalah air",
//           category: "Operasional",
//         },
//         {
//           id: "pengaturan",
//           name: "Pengaturan",
//           description: "Konfigurasi sistem dan tarif",
//           category: "Sistem",
//         },
//         {
//           id: "user-management",
//           name: "Manajemen User",
//           description: "Kelola pengguna sistem",
//           category: "Sistem",
//         },
//       ],

//       roles: [
//         {
//           id: "admin",
//           name: "Administrator",
//           description: "Akses penuh ke semua fitur sistem",
//           isActive: true,
//           createdAt: "2024-01-01",
//         },
//         {
//           id: "petugas",
//           name: "Petugas Lapangan",
//           description: "Akses untuk operasional lapangan",
//           isActive: true,
//           createdAt: "2024-01-01",
//         },
//         {
//           id: "warga",
//           name: "Warga/Pelanggan",
//           description: "Akses terbatas untuk pelanggan",
//           isActive: true,
//           createdAt: "2024-01-01",
//         },
//         {
//           id: "supervisor",
//           name: "Supervisor",
//           description: "Akses supervisi dan monitoring",
//           isActive: true,
//           createdAt: "2024-01-01",
//         },
//         {
//           id: "keuangan",
//           name: "Staff Keuangan",
//           description: "Akses khusus untuk bagian keuangan",
//           isActive: true,
//           createdAt: "2024-01-01",
//         },
//       ],

//       rolePermissions: [
//         // Admin - Full access
//         {
//           roleId: "admin",
//           permissionId: "dashboard",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: true,
//         },
//         {
//           roleId: "admin",
//           permissionId: "pelanggan",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: true,
//         },
//         {
//           roleId: "admin",
//           permissionId: "catat-meter",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: true,
//         },
//         {
//           roleId: "admin",
//           permissionId: "pelunasan",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: true,
//         },
//         {
//           roleId: "admin",
//           permissionId: "laporan",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: true,
//         },
//         {
//           roleId: "admin",
//           permissionId: "kendala",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: true,
//         },
//         {
//           roleId: "admin",
//           permissionId: "pengaturan",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: true,
//         },
//         {
//           roleId: "admin",
//           permissionId: "user-management",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: true,
//         },

//         // Petugas - Operational access
//         {
//           roleId: "petugas",
//           permissionId: "dashboard",
//           canView: true,
//           canAdd: false,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "petugas",
//           permissionId: "pelanggan",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: false,
//         },
//         {
//           roleId: "petugas",
//           permissionId: "catat-meter",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: false,
//         },
//         {
//           roleId: "petugas",
//           permissionId: "pelunasan",
//           canView: true,
//           canAdd: true,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "petugas",
//           permissionId: "laporan",
//           canView: true,
//           canAdd: false,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "petugas",
//           permissionId: "kendala",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: false,
//         },

//         // Warga - Limited access
//         {
//           roleId: "warga",
//           permissionId: "dashboard",
//           canView: true,
//           canAdd: false,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "warga",
//           permissionId: "pelunasan",
//           canView: true,
//           canAdd: false,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "warga",
//           permissionId: "kendala",
//           canView: true,
//           canAdd: true,
//           canEdit: false,
//           canDelete: false,
//         },

//         // Supervisor - Monitoring access
//         {
//           roleId: "supervisor",
//           permissionId: "dashboard",
//           canView: true,
//           canAdd: false,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "supervisor",
//           permissionId: "pelanggan",
//           canView: true,
//           canAdd: false,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "supervisor",
//           permissionId: "catat-meter",
//           canView: true,
//           canAdd: false,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "supervisor",
//           permissionId: "pelunasan",
//           canView: true,
//           canAdd: false,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "supervisor",
//           permissionId: "laporan",
//           canView: true,
//           canAdd: true,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "supervisor",
//           permissionId: "kendala",
//           canView: true,
//           canAdd: false,
//           canEdit: true,
//           canDelete: false,
//         },

//         // Keuangan - Financial access
//         {
//           roleId: "keuangan",
//           permissionId: "dashboard",
//           canView: true,
//           canAdd: false,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "keuangan",
//           permissionId: "pelanggan",
//           canView: true,
//           canAdd: false,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           roleId: "keuangan",
//           permissionId: "pelunasan",
//           canView: true,
//           canAdd: true,
//           canEdit: true,
//           canDelete: false,
//         },
//         {
//           roleId: "keuangan",
//           permissionId: "laporan",
//           canView: true,
//           canAdd: true,
//           canEdit: false,
//           canDelete: false,
//         },
//       ],

//       addPermission: (permissionData) =>
//         set((state) => ({
//           permissions: [
//             ...state.permissions,
//             {
//               ...permissionData,
//               id: Date.now().toString(),
//             },
//           ],
//         })),

//       updatePermission: (id, permissionData) =>
//         set((state) => ({
//           permissions: state.permissions.map((permission) =>
//             permission.id === id
//               ? { ...permission, ...permissionData }
//               : permission
//           ),
//         })),

//       deletePermission: (id) =>
//         set((state) => ({
//           permissions: state.permissions.filter(
//             (permission) => permission.id !== id
//           ),
//           rolePermissions: state.rolePermissions.filter(
//             (rp) => rp.permissionId !== id
//           ),
//         })),

//       addRole: (roleData) =>
//         set((state) => ({
//           roles: [
//             ...state.roles,
//             {
//               ...roleData,
//               id: Date.now().toString(),
//               createdAt: new Date().toISOString().split("T")[0],
//             },
//           ],
//         })),

//       updateRole: (id, roleData) =>
//         set((state) => ({
//           roles: state.roles.map((role) =>
//             role.id === id ? { ...role, ...roleData } : role
//           ),
//         })),

//       deleteRole: (id) =>
//         set((state) => ({
//           roles: state.roles.filter((role) => role.id !== id),
//           rolePermissions: state.rolePermissions.filter(
//             (rp) => rp.roleId !== id
//           ),
//         })),

//       toggleRoleStatus: (id) =>
//         set((state) => ({
//           roles: state.roles.map((role) =>
//             role.id === id ? { ...role, isActive: !role.isActive } : role
//           ),
//         })),

//       updateRolePermission: (roleId, permissionId, permissions) =>
//         set((state) => {
//           const existingIndex = state.rolePermissions.findIndex(
//             (rp) => rp.roleId === roleId && rp.permissionId === permissionId
//           );

//           if (existingIndex >= 0) {
//             const updated = [...state.rolePermissions];
//             updated[existingIndex] = {
//               ...updated[existingIndex],
//               ...permissions,
//             };
//             return { rolePermissions: updated };
//           } else {
//             return {
//               rolePermissions: [
//                 ...state.rolePermissions,
//                 {
//                   roleId,
//                   permissionId,
//                   canView: false,
//                   canAdd: false,
//                   canEdit: false,
//                   canDelete: false,
//                   ...permissions,
//                 },
//               ],
//             };
//           }
//         }),

//       getRolePermissions: (roleId) => {
//         const state = get();
//         return state.rolePermissions.filter((rp) => rp.roleId === roleId);
//       },

//       hasPermission: (roleId, permissionId, action) => {
//         const state = get();
//         const rolePermission = state.rolePermissions.find(
//           (rp) => rp.roleId === roleId && rp.permissionId === permissionId
//         );

//         if (!rolePermission) return false;

//         switch (action) {
//           case "view":
//             return rolePermission.canView;
//           case "add":
//             return rolePermission.canAdd;
//           case "edit":
//             return rolePermission.canEdit;
//           case "delete":
//             return rolePermission.canDelete;
//           default:
//             return false;
//         }
//       },
//     }),
//     {
//       name: "tirta-bening-permissions",
//     }
//   )
// );
