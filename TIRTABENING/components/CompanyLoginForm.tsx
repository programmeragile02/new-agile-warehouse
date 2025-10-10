"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CompanyLoginForm() {
  const [companyId, setCompanyId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      // pakai endpoint kamu: /api/auth/company atau /api/company-login (sesuaikan)
      const res = await fetch("/api/auth/company", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          companyId: companyId,
          companyPassword: password,        // <— penting: key baru
          remember,                         // <— opsional utk atur cookie maxAge di server
        }),
      });

      const j = await res.json().catch(() => ({} as any));

      if (!res.ok || !j?.ok) {
        // mapping pesan umum
        const msg =
          j?.message ||
          (res.status === 401
            ? "Company ID atau Password salah"
            : res.status === 404
            ? "Company tidak ditemukan / tidak aktif"
            : "Gagal login company");
        throw new Error(msg);
      }

      // sukses → lanjut ke tahap login user
      window.location.href = "/login";
    } catch (e: any) {
      setError(e?.message ?? "Gagal login company");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Company ID</Label>
        <Input
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          autoComplete="organization"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Company Password</Label>
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Remember this device
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Memeriksa..." : "Masuk Company"}
      </Button>
    </form>
  );
}