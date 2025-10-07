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
import { useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

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

export function AccessControlMatrixFormFields({
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
        <CardTitle className="text-foreground">General</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
  <Label htmlFor="user_level_id" className="text-foreground">User Level*</Label>
  <Input
    type="number"
    id="user_level_id"
    placeholder="User level"
    value={formData.user_level_id || ""}
    onChange={(e) => setFormData((prev) => ({ ...prev, "user_level_id": e.target.value }))}
    className="text-foreground placeholder:text-muted-foreground"
  />
</div>

<div className="space-y-1">
  <Label htmlFor="menu_id" className="text-foreground">Menu*</Label>
  <Input
    type="text"
    id="menu_id"
    placeholder="Menu"
    value={formData.menu_id || ""}
    onChange={(e) => setFormData((prev) => ({ ...prev, "menu_id": e.target.value }))}
    className="text-foreground placeholder:text-muted-foreground"
  />
</div>

<div className="flex items-center gap-2">
  <Input
    id="view"
    type="checkbox"
    checked={!!formData.view}
    onChange={(e) =>
      setFormData((prev) => ({ ...prev, "view": e.target.checked }))
    }
  />
  <Label htmlFor="view">View*</Label>
</div>

<div className="flex items-center gap-2">
  <Input
    id="add"
    type="checkbox"
    checked={!!formData.add}
    onChange={(e) =>
      setFormData((prev) => ({ ...prev, "add": e.target.checked }))
    }
  />
  <Label htmlFor="add">Add*</Label>
</div>

<div className="flex items-center gap-2">
  <Input
    id="edit"
    type="checkbox"
    checked={!!formData.edit}
    onChange={(e) =>
      setFormData((prev) => ({ ...prev, "edit": e.target.checked }))
    }
  />
  <Label htmlFor="edit">Edit*</Label>
</div>

<div className="flex items-center gap-2">
  <Input
    id="delete"
    type="checkbox"
    checked={!!formData.delete}
    onChange={(e) =>
      setFormData((prev) => ({ ...prev, "delete": e.target.checked }))
    }
  />
  <Label htmlFor="delete">Delete*</Label>
</div>

<div className="flex items-center gap-2">
  <Input
    id="approve"
    type="checkbox"
    checked={!!formData.approve}
    onChange={(e) =>
      setFormData((prev) => ({ ...prev, "approve": e.target.checked }))
    }
  />
  <Label htmlFor="approve">Approve*</Label>
</div>


        </div>
    </CardContent>
</Card>


        </div>
    )
}