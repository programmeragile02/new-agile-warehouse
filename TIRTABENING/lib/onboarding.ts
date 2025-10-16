import "server-only";
import { db } from "./db";

export type StepKey =
    | "tarif"
    | "pengaturan"
    | "jadwal"
    | "user"
    | "tandon"
    | "blok"
    | "pelanggan"
    | "jadwal-catat";

function filled(v: unknown) {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim().length > 0;
    return true;
}

export async function getOnboardingState(): Promise<{
    completedKeys: StepKey[];
    progressPct: number;
}> {
    const prisma = await db();

    const done = new Set<StepKey>();

    // 1) Setting (tarif + profil)
    // Jika Setting per-tenant 1 baris (id=1), ini oke karena DB sudah scoped per-tenant.
    const setting = await prisma.setting.findUnique({ where: { id: 1 } });

    // 1a. Tarif: minimal salah satu numerik > 0
    if (
        setting &&
        ((typeof setting.tarifPerM3 === "number" && setting.tarifPerM3 > 0) ||
            (typeof setting.abonemen === "number" && setting.abonemen > 0))
    ) {
        done.add("tarif");
    }

    // 1b. Pengaturan Sistem: minimal identitas terisi
    if (
        setting &&
        (filled(setting.namaPerusahaan) ||
            filled(setting.logoUrl) ||
            filled(setting.email) ||
            filled(setting.telepon))
    ) {
        done.add("pengaturan");
    }

    // 2) Jadwal: selesai jika ADA record apa pun di tabel
    if (setting && filled(setting.tanggalCatatDefault)) {
        done.add("jadwal");
    }

    // 3) Petugas aktif
    const petugasCount = await prisma.user.count({
        where: { role: "PETUGAS", isActive: true },
    });
    if (petugasCount > 0) done.add("user");

    // 4) Tandon (tak ada soft delete di schema saat ini)
    const tandonCount = await prisma.tandon.count();
    if (tandonCount > 0) done.add("tandon");

    // 5) Blok ≡ Zona (tak ada soft delete di schema saat ini)
    const zonaCount = await prisma.zona.count();
    if (zonaCount > 0) done.add("blok");

    // 6) Pelanggan (hindari yang soft-deleted)
    const pelangganCount = await prisma.pelanggan.count({
        where: { deletedAt: null },
    });
    if (pelangganCount > 0) done.add("pelanggan");

    // 7) jadwal pencatatan
    const jadwalCount = await prisma.jadwalPencatatan.count();
    if (jadwalCount > 0) done.add("jadwal-catat");

    const all: StepKey[] = [
        "tarif",
        "pengaturan",
        "jadwal",
        "user",
        "tandon",
        "blok",
        "pelanggan",
        "jadwal-catat",
    ];

    const completedKeys = all.filter((k) => done.has(k));
    const progressPct = Math.round((completedKeys.length / all.length) * 100);

    return { completedKeys, progressPct };
}
