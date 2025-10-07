"use client";

import { useEffect, useState } from "react";
import { fetchActions, runAction } from "@/lib/actions";

type Props = {
  entity: string; // "vehicles"
  scope?: "toolbar" | "row" | "bulk" | "detail";
  selectedIds?: Array<number | string>;
  onDone?: () => void; // callback selesai (buat refetch)
};

export default function ActionBar({ entity, scope = "toolbar", selectedIds, onDone }: Props) {
  const [acts, setActs] = useState<Array<any>>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    fetchActions(entity, scope).then(setActs).catch(console.error);
  }, [entity, scope]);

  const click = async (key: string) => {
    try {
      setBusyKey(key);
      const payload = selectedIds?.length ? { ids: selectedIds } : undefined;
      const res = await runAction(entity, key, payload);
      alert(res?.message ?? "Action done"); // ganti dengan toast kalau mau
      onDone?.();
    } catch (e: any) {
      alert(e?.message || "Action failed");
    } finally {
      setBusyKey(null);
    }
  };

  if (!acts.length) return null;

  return (
    <div className="flex gap-2">
      {acts.map(a => (
        <button
          key={a.key}
          className="inline-flex items-center rounded-md border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
          onClick={() => click(a.key)}
          disabled={!!busyKey}
          title={a.key}
        >
          {busyKey === a.key ? "..." : a.label}
        </button>
      ))}
    </div>
  );
}
