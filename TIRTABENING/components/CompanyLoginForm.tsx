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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, password, remember }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok)
        throw new Error(j.message ?? "COMPANY_LOGIN_FAILED");
      window.location.href = "/login";
    } catch (e: any) {
      setError(e.message ?? "Gagal login company");
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
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Company Password</Label>
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
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
