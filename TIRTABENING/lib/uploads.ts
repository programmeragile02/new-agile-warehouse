// import fs from "node:fs/promises";
// import path from "node:path";
// const DEFAULT_UPLOAD_DIR = ".uploads"; // ganti via env UPLOAD_DIR kalau mau

// /** pastikan directory ada */
// async function ensureDir(dir: string) {
//   await fs.mkdir(dir, { recursive: true });
// }

// /** join path aman (hindari path traversal) */
// function safeJoin(root: string, ...segments: string[]) {
//   const joined = path.join(root, ...segments);
//   const rel = path.relative(root, joined);
//   if (rel.startsWith("..") || path.isAbsolute(rel)) {
//     throw new Error("Path traversal detected");
//   }
//   return joined;
// }

// /** Simpan file (FormData) ke disk dan kembalikan URL API untuk akses */
// export async function saveUploadFile(
//   file: File,
//   subdir = ""
// ): Promise<{
//   absPath: string;
//   relPath: string;
//   publicUrl: string;
//   filename: string;
// }> {
//   const uploadRoot = process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR;
//   const buff = Buffer.from(await file.arrayBuffer());
//   const ext = (file.name.split(".").pop() || "dat").toLowerCase();
//   const filename = `${Date.now()}-${Math.random()
//     .toString(36)
//     .slice(2)}.${ext}`;

//   const relPath = subdir ? `${subdir}/${filename}` : filename;
//   const absDir = safeJoin(process.cwd(), uploadRoot, subdir || "");
//   await ensureDir(absDir);

//   const absPath = safeJoin(process.cwd(), uploadRoot, relPath);
//   await fs.writeFile(absPath, buff);

//   // URL publik via API route
//   const publicUrl = `/api/file/${relPath}`;
//   return { absPath, relPath, publicUrl, filename };
// }

// /** Resolve absolute path dari potongan relatif */
// export function resolveUploadPath(...rel: string[]) {
//   const uploadRoot = process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR;
//   const base = path.join(process.cwd(), uploadRoot);
//   return safeJoin(base, ...rel);
// }

// /** MIME sederhana */
// export function guessMimeByExt(filename: string) {
//   const ext = filename.split(".").pop()?.toLowerCase();
//   switch (ext) {
//     case "jpg":
//     case "jpeg":
//       return "image/jpeg";
//     case "png":
//       return "image/png";
//     case "gif":
//       return "image/gif";
//     case "pdf":
//       return "application/pdf";
//     case "webp":
//       return "image/webp";
//     default:
//       return "application/octet-stream";
//   }
// }

// lib/uploads.ts
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DEFAULT_UPLOAD_DIR = ".uploads"; // bisa override via env UPLOAD_DIR

/** pastikan directory ada */
async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

/** join path aman (hindari path traversal) */
function safeJoin(root: string, ...segments: string[]) {
    const joined = path.join(root, ...segments);
    const rel = path.relative(root, joined);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
        throw new Error("Path traversal detected");
    }
    return joined;
}

/** sanitize nama company / companyId untuk path (hanya huruf, angka, underscore, dash) */
export function sanitizeCompanyId(raw?: string | null) {
    if (!raw) return "unknown";
    let s = String(raw).trim();
    // beberapa cookie tb_company sering ada karakter aneh → ganti jadi underscore
    s = s.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_\-\.]/g, "_");
    if (s.length > 60) s = s.slice(0, 60);
    return s || "unknown";
}

/**
 * Simpan file (File objek) ke disk dan kembalikan URL API untuk akses.
 *
 * @param file File (Web File)
 * @param subdir optional subdir relatif di dalam folder company (contoh: "payment/bukti-bayar")
 * @param companyId optional company identifier (jika diberikan, file disimpan di .uploads/<companyId>/<subdir>/<filename>)
 */
export async function saveUploadFile(
    file: File,
    subdir = "",
    companyId?: string | null
): Promise<{
    absPath: string;
    relPath: string;
    publicUrl: string;
    filename: string;
}> {
    const uploadRoot = process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR;
    const buff = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "dat").toLowerCase();

    // buat filename unik
    const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

    // sanitize company
    const safeCompany = companyId ? sanitizeCompanyId(companyId) : "";

    // relPath: jika company diberikan → <company>/<subdir?>/<filename>
    const relPath = safeCompany
        ? subdir
            ? `${safeCompany}/${subdir}/${filename}`
            : `${safeCompany}/${filename}`
        : subdir
        ? `${subdir}/${filename}`
        : filename;

    // buat absDir (folder tempat menaruh file)
    const absDir = safeCompany
        ? safeJoin(process.cwd(), uploadRoot, safeCompany, subdir || "")
        : safeJoin(process.cwd(), uploadRoot, subdir || "");

    await ensureDir(absDir);

    const absPath = safeJoin(process.cwd(), uploadRoot, relPath);
    await fs.writeFile(absPath, buff);

    // public URL via API route (pastikan Anda punya route /api/file/[...path])
    const publicUrl = `/api/file/${relPath}`;
    return { absPath, relPath, publicUrl, filename };
}

/** Resolve absolute path dari potongan relatif */
export function resolveUploadPath(...rel: string[]) {
    const uploadRoot = process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR;
    const base = path.join(process.cwd(), uploadRoot);
    return safeJoin(base, ...rel);
}

/** MIME sederhana */
export function guessMimeByExt(filename: string) {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "png":
            return "image/png";
        case "gif":
            return "image/gif";
        case "pdf":
            return "application/pdf";
        case "webp":
            return "image/webp";
        default:
            return "application/octet-stream";
    }
}
