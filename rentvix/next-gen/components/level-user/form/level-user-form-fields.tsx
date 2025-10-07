"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LevelUserFormFields({
    formData,
    setFormData,
    mode,
}: {
    formData: Record<string, any>;
    setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    mode: "create" | "edit";
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
    <CardHeader>
        <CardTitle className="text-foreground">Daftar Level User</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
  <Label htmlFor="nama_level">Nama Level*</Label>
  <Input
    type="text"
    id="nama_level"
    placeholder="e.g., Super Admin"
    value={formData.nama_level || ""}
    onChange={(e) => setFormData((prev) => ({ ...prev, "nama_level": e.target.value }))}
  />
</div>

<div className="space-y-1">
  <Label htmlFor="deskripsi">Deskripsi*</Label>
  <textarea
    id="deskripsi"
    rows={4}
    placeholder="e.g., deskripsi"
    className="w-full border rounded px-3 py-2"
    value={formData.deskripsi || ""}
    onChange={(e) => setFormData((prev) => ({ ...prev, "deskripsi": e.target.value }))}
  />
</div>

<div className="space-y-1">
  <Label htmlFor="status">Status*</Label>
  <select
    id="status"
    value={formData.status || ""}
    onChange={(e) => setFormData((prev) => ({ ...prev, "status": e.target.value }))}
    className="w-full border rounded px-3 py-2"
  >
    <option value="">-- Pilih --</option>
    <option value="Aktif">Aktif</option>
    <option value="Tidak Aktif">Tidak Aktif</option>
  </select>
</div>


        </div>
    </CardContent>
</Card>


        </div>
    )
}