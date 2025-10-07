"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ImageUploadValue = File | string | undefined;

type ImageUploadProps = {
  title: string;
  description?: string;
  /** Preview/current image URL (blob/url) yang dikontrol parent */
  image?: string;
  /** Defaultnya kirim File ke parent (match stub Anda). Bisa "url" bila mau kirim string. */
  returnType?: "file" | "url";
  onImageChange: (value: ImageUploadValue) => void;
  accept?: string;
  maxSizeMB?: number;
};

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

export function ImageUpload({
  title,
  description,
  image,
  onImageChange,
  returnType = "file",
  accept = "image/*",
  maxSizeMB = 5,
}: ImageUploadProps) {
  const inputId = useMemo(() => `upload-${slugify(title)}`, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      // Anda bisa ganti dengan toast
      alert(`File terlalu besar. Maks ${maxSizeMB}MB`);
      return;
    }

    if (returnType === "file") {
      // Kirim File ke parent (rekomendasi untuk stub Anda)
      onImageChange(file);
    } else {
      // Opsi: kirim URL (misal blob url)
      const url = URL.createObjectURL(file);
      onImageChange(url);
    }
  };

  const handleRemoveImage = () => onImageChange(undefined);

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-foreground font-medium">
        {title}
      </Label>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}

      {image ? (
        <div className="relative">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            width={300}
            height={200}
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Label htmlFor={inputId} className="cursor-pointer block">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              Click to upload {title.toLowerCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports: JPG, PNG, WebP (Max {maxSizeMB}MB)
            </p>
          </div>
          <Input
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </Label>
      )}
    </div>
  );
}

export function DaftarKendaraanFormFields({
    formData,
    setFormData,
    mode,
}: {
    formData: Record<string, any>;
    setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    mode: "create" | "edit";
}) {
    const [newTags, setNewTags] = useState("");

    const parseJSON = (s: any) => {
      if (typeof s !== "string") return s;
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    };

    const toArray = (v: any): any[] => {
      const p = parseJSON(v);
      return Array.isArray(p) ? p : [];
    };

    // Ambil label dari berbagai bentuk objek
    const toTag = (item: any): string => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return String(
          item.label ?? item.text ?? item.name ?? item.value ?? ""
        ).trim();
      }
      return "";
    };

    // Fungsinya: apa pun bentuk `formData.features`, hasil akhirnya array<string> rapi
    const normalizeTags = (v: any): string[] =>
      toArray(v).map(toTag).filter(Boolean);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
    <CardHeader>
        <CardTitle className="text-foreground">Informasi Umum</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
  <Label htmlFor="jenis" className="text-foreground">Jenis</Label>
  <Input
    type="text"
    id="jenis"
    placeholder="Jenis Kendaraan.."
    value={formData.jenis || ""}
    onChange={(e) => setFormData((prev) => ({ ...prev, "jenis": e.target.value }))}
    className="text-foreground placeholder:text-muted-foreground"
    required
  />
</div>

<div className="space-y-1">
  <Label htmlFor="warna" className="text-foreground">Warna</Label>
  <Input
    type="text"
    id="warna"
    placeholder="Warna Kendaraan..."
    value={formData.warna || ""}
    onChange={(e) => setFormData((prev) => ({ ...prev, "warna": e.target.value }))}
    className="text-foreground placeholder:text-muted-foreground"
    required
  />
</div>


        </div>
    </CardContent>
</Card>

<Card>
    <CardHeader>
        <CardTitle className="text-foreground">Foto Kendaraan</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageUpload
  title="Foto Depan"
  description="Upload Foto Depan"
  image={formData.foto_depan_preview || formData.foto_depan_url}
  // returnType default "file" → val akan berupa File
  onImageChange={(val) => {
    if (val instanceof File) {
      // Simpan File + preview (match pola stub lama Anda)
      const preview = URL.createObjectURL(val);
      setFormData((prev) => ({
        ...prev,
        "foto_depan": val,
        "foto_depan_preview": preview,
        // reset url kalau sebelumnya pakai url
        "foto_depan_url": undefined,
      }));
    } else {
      // Kalau suatu saat Anda ingin kirim URL string (mis. hasil upload)
      setFormData((prev) => ({
        ...prev,
        "foto_depan": undefined,
        "foto_depan_preview": undefined,
        "foto_depan_url": val,
      }));
    }
  }}
/>

<ImageUpload
  title="Foto Samping"
  description="Upload Foto Samping"
  image={formData.foto_samping_preview || formData.foto_samping_url}
  // returnType default "file" → val akan berupa File
  onImageChange={(val) => {
    if (val instanceof File) {
      // Simpan File + preview (match pola stub lama Anda)
      const preview = URL.createObjectURL(val);
      setFormData((prev) => ({
        ...prev,
        "foto_samping": val,
        "foto_samping_preview": preview,
        // reset url kalau sebelumnya pakai url
        "foto_samping_url": undefined,
      }));
    } else {
      // Kalau suatu saat Anda ingin kirim URL string (mis. hasil upload)
      setFormData((prev) => ({
        ...prev,
        "foto_samping": undefined,
        "foto_samping_preview": undefined,
        "foto_samping_url": val,
      }));
    }
  }}
/>


        </div>
    </CardContent>
</Card>


        </div>
    )
}