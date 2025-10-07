"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserManagementFormFields({
  formData,
  setFormData,
  mode,
  companies = [],
  levels = [], // ← daftar level untuk dropdown role
}: {
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  mode: "create" | "edit";
  companies?: Array<{ id: string }>;
  levels?: Array<{ id: number | string; nama_level: string }>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Company */}
            <div className="space-y-1">
              <Label htmlFor="company_id">Company*</Label>
              <select
                id="company_id"
                value={formData.company_id || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, company_id: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Pilih Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Nama */}
            <div className="space-y-1">
              <Label htmlFor="nama">Nama*</Label>
              <Input
                type="text"
                id="nama"
                placeholder="e.g., John Doe"
                value={formData.nama || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email*</Label>
              <Input
                type="email"
                id="email"
                placeholder="e.g., johndoe@example"
                value={formData.email || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            {/* Nomor Telepon */}
            <div className="space-y-1">
              <Label htmlFor="nomor_telp">Nomor Telepon*</Label>
              <Input
                type="tel"
                id="nomor_telp"
                placeholder="e.g., 087162..."
                value={formData.nomor_telp || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, nomor_telp: e.target.value }))}
              />
            </div>

            {/* Role sebagai dropdown (Level User) */}
            <div className="space-y-1">
              <Label htmlFor="role">Role*</Label>
              <select
                id="role"
                value={formData.role ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Pilih Level User --</option>
                {levels.map((lv) => (
                  <option key={lv.id} value={lv.id}>
                    {lv.nama_level}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label htmlFor="status">Status*</Label>
              <select
                id="status"
                value={formData.status || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Pilih --</option>
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>

            {/* Password (wajib saat create) */}
            <div className="space-y-1">
              <Label htmlFor="password">Password{mode === "create" ? "*" : " (opsional)"}</Label>
              <Input
                type="password"
                id="password"
                placeholder={mode === "create" ? "Minimal 8 karakter" : "Biarkan kosong jika tidak diubah"}
                value={formData.password || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1">
              <Label htmlFor="password_confirmation">Konfirmasi Password{mode === "create" ? "*" : ""}</Label>
              <Input
                type="password"
                id="password_confirmation"
                placeholder="Ulangi password"
                value={formData.password_confirmation || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, password_confirmation: e.target.value }))}
              />
            </div>

            {/* Foto */}
            <div className="space-y-1">
              <Label htmlFor="foto">Foto</Label>
              <Input
                type="file"
                id="foto"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData((prev) => ({
                      ...prev,
                      foto: file,
                      foto_preview: URL.createObjectURL(file),
                    }));
                  }
                }}
              />
              {(formData.foto_preview || formData.foto_url) && (
                <img
                  src={formData.foto_preview || formData.foto_url}
                  alt="Foto Preview"
                  className="mt-2 rounded border w-48"
                />
              )}
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
