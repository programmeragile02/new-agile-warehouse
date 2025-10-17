// prisma/seed.features.ts
import { PrismaClient, FeatureType } from "@prisma/client";

const prisma = new PrismaClient();

// Sesuaikan jika ID/Code product kamu berbeda
const PRODUCT_ID = "ec23de55-565f-432e-836e-83d5c336d23f";
const PRODUCT_CODE = "NATABANYU";

async function main() {
    const now = new Date();

    // ===== PARENT FEATURES =====
    const settingWaSender = await prisma.feature.upsert({
        where: { code: "setting.wa.sender" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Setting Whatsapp Sender",
            code: "setting.wa.sender",
            type: FeatureType.FEATURE,
            description: "Fitur Setting untuk nomor WhatsApp sender",
            priceAddon: 100000,
            trialAvailable: false,
            isActive: true,
            orderNumber: 1,
            createdAt: now,
        },
    });

    const kirimNotifWa = await prisma.feature.upsert({
        where: { code: "kirim.notif.whatsapp" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Kirim Notif Whatsapp",
            code: "kirim.notif.whatsapp",
            type: FeatureType.FEATURE,
            description: "Fitur untuk kirim notifikasi WA",
            priceAddon: 300000,
            isActive: true,
            orderNumber: 2,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "manajemen.akses.role" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Manajemen Akses Role",
            code: "manajemen.akses.role",
            type: FeatureType.FEATURE,
            description: "Manajemen Akses Role Warga, Admin, Petugas",
            priceAddon: 250000,
            isActive: true,
            orderNumber: 3,
            createdAt: now,
        },
    });

    const exportExcel = await prisma.feature.upsert({
        where: { code: "export.excel" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Export Excel",
            code: "export.excel",
            type: FeatureType.FEATURE,
            description: "Export Excel Fitur",
            priceAddon: 100000,
            isActive: true,
            orderNumber: 4,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "unduh.tagihan" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Unduh Tagihan",
            code: "unduh.tagihan",
            type: FeatureType.FEATURE,
            description: "Unduh Tagihan",
            priceAddon: 50000,
            isActive: true,
            orderNumber: 5,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "unduh.kwitansi" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Unduh Kwitansi",
            code: "unduh.kwitansi",
            type: FeatureType.FEATURE,
            description: "Unduh Kwitansi",
            priceAddon: 50000,
            isActive: true,
            orderNumber: 6,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "monitoring.keuangan" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Monitoring Keuangan",
            code: "monitoring.keuangan",
            type: FeatureType.FEATURE,
            description: "Monitoring Keuangan",
            priceAddon: 100000,
            isActive: true,
            orderNumber: 7,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "dashboard.kpi" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Dashboard & KPI",
            code: "dashboard.kpi",
            type: FeatureType.FEATURE,
            description: "Dashboard & KPI",
            priceAddon: 50000,
            isActive: true,
            orderNumber: 8,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "kpi" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "KPI",
            code: "kpi",
            type: FeatureType.FEATURE,
            description: "Indikator kinerja",
            priceAddon: 50000,
            isActive: true,
            orderNumber: 9,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "hirarki" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Hirarki",
            code: "hirarki",
            type: FeatureType.FEATURE,
            description: "Tree view tandon, blok, rumah",
            priceAddon: 100000,
            isActive: true,
            orderNumber: 10,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "rekonsiliasi" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Rekonsiliasi",
            code: "rekonsiliasi",
            type: FeatureType.FEATURE,
            description: "Compare air masuk vs keluar",
            priceAddon: 75000,
            isActive: true,
            orderNumber: 11,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "peta.pemakaian.air" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Peta Pemakaian Air",
            code: "peta.pemakaian.air",
            type: FeatureType.FEATURE,
            description: "Maps Pemakaian Air",
            priceAddon: 100000,
            isActive: true,
            orderNumber: 12,
            createdAt: now,
        },
    });

    const laporan = await prisma.feature.upsert({
        where: { code: "laporan" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Laporan",
            code: "laporan",
            type: FeatureType.FEATURE,
            description: "Laporan - Laporan",
            priceAddon: 300000,
            isActive: true,
            orderNumber: 13,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "setting.logo" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Setting Logo",
            code: "setting.logo",
            type: FeatureType.FEATURE,
            description: "Setting Logo Brand",
            priceAddon: 25000,
            isActive: true,
            orderNumber: 14,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "maksimal.pelanggan" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Maksimal Pelanggan",
            code: "maksimal.pelanggan",
            type: FeatureType.FEATURE,
            description: "Maksimal Pelanggan",
            priceAddon: 50000,
            isActive: true,
            orderNumber: 15,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "maksimal.blok" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Maksimal Blok",
            code: "maksimal.blok",
            type: FeatureType.FEATURE,
            description: "Maksimal Blok",
            priceAddon: 50000,
            isActive: true,
            orderNumber: 16,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "maksimal.tandon" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Maksimal Tandon",
            code: "maksimal.tandon",
            type: FeatureType.FEATURE,
            description: "Maksimal Tandon",
            priceAddon: 50000,
            isActive: true,
            orderNumber: 17,
            createdAt: now,
        },
    });

    // ===== CHILDREN: Kirim Notif WA =====
    await prisma.feature.upsert({
        where: { code: "wa.notif.tagihan" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Notif Tagihan",
            code: "wa.notif.tagihan",
            type: FeatureType.SUBFEATURE,
            description: "Notif WhatsApp Tagihan",
            parentId: kirimNotifWa.id,
            orderNumber: 1,
            isActive: true,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "wa.notif.kwitansi" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Notif Kwitansi",
            code: "wa.notif.kwitansi",
            type: FeatureType.SUBFEATURE,
            description: "Notif WhatsApp Kwitansi",
            parentId: kirimNotifWa.id,
            orderNumber: 2,
            isActive: true,
            createdAt: now,
        },
    });

    await prisma.feature.upsert({
        where: { code: "wa.notif.tagihan.finalisasi" },
        update: {},
        create: {
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            name: "Notif Tagihan Finalisasi Catat Meter",
            code: "wa.notif.tagihan.finalisasi",
            type: FeatureType.SUBFEATURE,
            description: "Notif saat finalisasi kunci catat meter",
            parentId: kirimNotifWa.id,
            orderNumber: 3,
            isActive: true,
            createdAt: now,
        },
    });

    // ===== CHILDREN: Export Excel =====
    const exportChildren: ReadonlyArray<[string, string]> = [
        [
            "export.excel.laporan.status.pembayaran",
            "Export Laporan Status Pembayaran",
        ],
        ["export.excel.laporan.catat.meter", "Export Laporan Catat Meter"],
        ["export.excel.laporan.konsumsi.blok", "Export Laporan Konsumsi Blok"],
        ["export.excel.laporan.laba.rugi", "Export Laporan Laba Rugi"],
        ["export.excel.laporan.hutang", "Export Laporan Hutang"],
        ["export.excel.laporan.keuangan", "Export Laporan Keuangan"],
        ["export.excel.laporan.piutang", "Export Laporan Piutang"],
    ];
    for (let i = 0; i < exportChildren.length; i++) {
        const [code, name] = exportChildren[i];
        await prisma.feature.upsert({
            where: { code },
            update: {},
            create: {
                productId: PRODUCT_ID,
                productCode: PRODUCT_CODE,
                name,
                code,
                type: FeatureType.SUBFEATURE,
                description: name,
                parentId: exportExcel.id,
                orderNumber: i + 1,
                isActive: true,
                createdAt: now,
            },
        });
    }

    // ===== CHILDREN: Laporan =====
    const laporanChildren: ReadonlyArray<[string, string]> = [
        ["laporan.catat.meter", "Laporan Catat Meter"],
        ["laporan.konsumsi.blok", "Laporan Konsumsi Blok"],
        ["laporan.status.pembayaran", "Laporan Status Pembayaran"],
        ["laporan.piutang", "Laporan Piutang"],
        ["laporan.hutang", "Laporan Hutang"],
        ["laporan.laba.rugi", "Laporan Laba Rugi"],
        ["laporan.keuangan", "Laporan Keuangan"],
        ["laporan.summary", "Laporan Summary"],
    ];
    for (let i = 0; i < laporanChildren.length; i++) {
        const [code, name] = laporanChildren[i];
        await prisma.feature.upsert({
            where: { code },
            update: {},
            create: {
                productId: PRODUCT_ID,
                productCode: PRODUCT_CODE,
                name,
                code,
                type: FeatureType.SUBFEATURE,
                description: name,
                parentId: laporan.id,
                orderNumber: i + 1,
                isActive: true,
                createdAt: now,
            },
        });
    }

    // Backfill berjaga-jaga (kalau ada row lama tanpa product fields)
    await prisma.feature.updateMany({
        data: { productId: PRODUCT_ID, productCode: PRODUCT_CODE },
    });

    console.log("✅ Seed mst_features selesai");
}

main()
    .catch((e) => {
        console.error("❌ Seed gagal:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
