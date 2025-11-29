import { create } from "zustand";

export interface WaterIssue {
    id: string;
    issue: string;
    description: string;
    status: "unresolved" | "solved";
    date: string; // YYYY-MM-DD
    reporter: string;
    phone: string;
    address: string;
    priority: "high" | "medium" | "low";
    solvedDate?: string | null;
    solution?: string | null;
    customerId?: string | null;
    source: "meter_reading" | "meter_reading_blok" | "manual_report";
}

interface WaterIssuesStore {
    issues: WaterIssue[];

    /** Replace penuh dari API */
    setIssues: (items: WaterIssue[]) => void;

    /** Upsert 1 issue (misal hasil POST/PATCH) */
    upsertIssue: (item: WaterIssue) => void;

    /** Upsert banyak issue (misal hasil GET) */
    upsertMany: (items: WaterIssue[]) => void;

    deleteIssue: (id: string) => void;

    getIssuesByStatus: (status: "unresolved" | "solved") => WaterIssue[];
    getIssuesByCustomer: (customerId: string) => WaterIssue[];
    clear: () => void;
}

export const useWaterIssuesStore = create<WaterIssuesStore>()((set, get) => ({
    issues: [],

    setIssues: (items) => set({ issues: items }),

    upsertIssue: (item) =>
        set((state) => {
            const idx = state.issues.findIndex((i) => i.id === item.id);
            if (idx === -1) {
                return { issues: [item, ...state.issues] };
            }
            const next = state.issues.slice();
            next[idx] = { ...next[idx], ...item };
            return { issues: next };
        }),

    upsertMany: (items) =>
        set((state) => {
            const map = new Map<string, WaterIssue>();
            for (const i of state.issues) map.set(i.id, i);
            for (const it of items) {
                map.set(it.id, { ...(map.get(it.id) ?? ({} as any)), ...it });
            }
            return { issues: Array.from(map.values()) };
        }),

    deleteIssue: (id) =>
        set((state) => ({
            issues: state.issues.filter((issue) => issue.id !== id),
        })),

    getIssuesByStatus: (status) =>
        get().issues.filter((issue) => issue.status === status),

    getIssuesByCustomer: (customerId) =>
        get().issues.filter((issue) => issue.customerId === customerId),

    clear: () => set({ issues: [] }),
}));
