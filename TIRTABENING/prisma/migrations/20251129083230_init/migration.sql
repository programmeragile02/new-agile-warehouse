-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `role` VARCHAR(50) NULL,
    `appRoleId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `lastPasswordChangeAt` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `tandonId` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    INDEX `User_companyId_idx`(`companyId`),
    INDEX `User_tandonId_idx`(`tandonId`),
    INDEX `User_deletedAt_idx`(`deletedAt`),
    INDEX `User_deletedBy_idx`(`deletedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pelanggan` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `wa` VARCHAR(20) NULL,
    `wa2` VARCHAR(20) NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `meterAwal` INTEGER NOT NULL DEFAULT 0,
    `isResetMeter` BOOLEAN NOT NULL DEFAULT false,
    `statusAktif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `passwordPlain` VARCHAR(100) NULL,
    `userId` VARCHAR(191) NULL,
    `zonaId` VARCHAR(191) NULL,
    `noUrutRumah` INTEGER NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `Pelanggan_kode_key`(`kode`),
    UNIQUE INDEX `Pelanggan_userId_key`(`userId`),
    INDEX `Pelanggan_zonaId_idx`(`zonaId`),
    INDEX `Pelanggan_deletedAt_idx`(`deletedAt`),
    INDEX `Pelanggan_deletedBy_idx`(`deletedBy`),
    INDEX `Pelanggan_zonaId_noUrutRumah_idx`(`zonaId`, `noUrutRumah`),
    UNIQUE INDEX `Pelanggan_zonaId_noUrutRumah_key`(`zonaId`, `noUrutRumah`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CatatPeriode` (
    `id` VARCHAR(191) NOT NULL,
    `kodePeriode` VARCHAR(191) NOT NULL,
    `bulan` INTEGER NOT NULL,
    `tahun` INTEGER NOT NULL,
    `tarifPerM3` INTEGER NOT NULL DEFAULT 0,
    `abonemen` INTEGER NOT NULL DEFAULT 0,
    `tanggalCatat` DATETIME(3) NULL,
    `petugasId` VARCHAR(191) NULL,
    `petugasNama` VARCHAR(191) NULL,
    `totalPelanggan` INTEGER NOT NULL DEFAULT 0,
    `selesai` INTEGER NOT NULL DEFAULT 0,
    `pending` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'FINAL') NOT NULL DEFAULT 'DRAFT',
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `lockedAt` DATETIME(3) NULL,
    `lockedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `CatatPeriode_kodePeriode_key`(`kodePeriode`),
    INDEX `CatatPeriode_kodePeriode_idx`(`kodePeriode`),
    INDEX `CatatPeriode_status_idx`(`status`),
    INDEX `CatatPeriode_isLocked_lockedAt_idx`(`isLocked`, `lockedAt`),
    INDEX `CatatPeriode_petugasId_idx`(`petugasId`),
    INDEX `CatatPeriode_tanggalCatat_idx`(`tanggalCatat`),
    INDEX `CatatPeriode_deletedAt_idx`(`deletedAt`),
    INDEX `CatatPeriode_deletedBy_idx`(`deletedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CatatMeter` (
    `id` VARCHAR(191) NOT NULL,
    `periodeId` VARCHAR(191) NOT NULL,
    `pelangganId` VARCHAR(191) NOT NULL,
    `meterAwal` INTEGER NOT NULL DEFAULT 0,
    `meterAkhir` INTEGER NOT NULL DEFAULT 0,
    `pemakaianM3` INTEGER NOT NULL DEFAULT 0,
    `tarifPerM3` INTEGER NOT NULL DEFAULT 0,
    `abonemen` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL DEFAULT 0,
    `kendala` TEXT NULL,
    `status` ENUM('PENDING', 'DONE') NOT NULL DEFAULT 'PENDING',
    `waTerkirim` BOOLEAN NOT NULL DEFAULT false,
    `waSentAt` DATETIME(3) NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `zonaIdSnapshot` VARCHAR(191) NULL,
    `zonaNamaSnapshot` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,

    INDEX `CatatMeter_status_idx`(`status`),
    INDEX `CatatMeter_zonaIdSnapshot_idx`(`zonaIdSnapshot`),
    INDEX `CatatMeter_zonaNamaSnapshot_idx`(`zonaNamaSnapshot`),
    INDEX `CatatMeter_deletedAt_idx`(`deletedAt`),
    INDEX `CatatMeter_deletedBy_idx`(`deletedBy`),
    UNIQUE INDEX `CatatMeter_periodeId_pelangganId_key`(`periodeId`, `pelangganId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tagihan` (
    `id` VARCHAR(191) NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `tarifPerM3` INTEGER NOT NULL,
    `abonemen` INTEGER NOT NULL DEFAULT 0,
    `denda` INTEGER NOT NULL DEFAULT 0,
    `totalTagihan` INTEGER NOT NULL,
    `tagihanLalu` INTEGER NOT NULL DEFAULT 0,
    `sisaKurang` INTEGER NOT NULL DEFAULT 0,
    `sudahBayar` INTEGER NOT NULL DEFAULT 0,
    `belumBayar` INTEGER NOT NULL DEFAULT 0,
    `statusBayar` VARCHAR(191) NOT NULL DEFAULT 'UNPAID',
    `statusVerif` VARCHAR(191) NOT NULL DEFAULT 'UNVERIFIED',
    `tglJatuhTempo` DATETIME(3) NOT NULL,
    `info` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `pelangganId` VARCHAR(191) NOT NULL,
    `catatMeterId` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `Tagihan_catatMeterId_key`(`catatMeterId`),
    INDEX `Tagihan_periode_idx`(`periode`),
    INDEX `Tagihan_statusBayar_statusVerif_idx`(`statusBayar`, `statusVerif`),
    INDEX `Tagihan_deletedAt_idx`(`deletedAt`),
    INDEX `Tagihan_deletedBy_idx`(`deletedBy`),
    INDEX `Tagihan_catatMeterId_idx`(`catatMeterId`),
    UNIQUE INDEX `Tagihan_pelangganId_periode_key`(`pelangganId`, `periode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pembayaran` (
    `id` VARCHAR(191) NOT NULL,
    `tanggalBayar` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `jumlahBayar` INTEGER NOT NULL,
    `buktiUrl` VARCHAR(191) NULL,
    `adminBayar` VARCHAR(191) NULL,
    `tagihanId` VARCHAR(191) NOT NULL,
    `metode` ENUM('TUNAI', 'TRANSFER', 'EWALLET', 'QRIS') NOT NULL DEFAULT 'TUNAI',
    `keterangan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,

    INDEX `Pembayaran_tanggalBayar_idx`(`tanggalBayar`),
    INDEX `Pembayaran_tagihanId_fkey`(`tagihanId`),
    INDEX `Pembayaran_deletedAt_idx`(`deletedAt`),
    INDEX `Pembayaran_deletedBy_idx`(`deletedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetailPembayaran` (
    `id` VARCHAR(191) NOT NULL,
    `pembayaranId` VARCHAR(191) NOT NULL,
    `tagihanId` VARCHAR(191) NOT NULL,
    `pelangganId` VARCHAR(191) NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `jumlahTerbayar` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DetailPembayaran_pembayaranId_idx`(`pembayaranId`),
    INDEX `DetailPembayaran_tagihanId_idx`(`tagihanId`),
    INDEX `DetailPembayaran_pelangganId_idx`(`pelangganId`),
    INDEX `DetailPembayaran_periode_idx`(`periode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `tarifPerM3` INTEGER NULL,
    `abonemen` INTEGER NULL,
    `biayaAdmin` INTEGER NULL,
    `tglJatuhTempo` INTEGER NULL,
    `dendaTelatBulanSama` INTEGER NULL,
    `dendaTelatBulanBerbeda` INTEGER NULL,
    `namaPerusahaan` VARCHAR(120) NULL,
    `alamat` VARCHAR(255) NULL,
    `telepon` VARCHAR(30) NULL,
    `email` VARCHAR(120) NULL,
    `logoUrl` VARCHAR(255) NULL,
    `namaBankPembayaran` VARCHAR(120) NULL,
    `norekPembayaran` VARCHAR(50) NULL,
    `anNorekPembayaran` VARCHAR(120) NULL,
    `namaBendahara` VARCHAR(120) NULL,
    `whatsappCs` VARCHAR(30) NULL,
    `tanggalCatatDefault` INTEGER NULL,
    `onboardingCompleted` BOOLEAN NOT NULL DEFAULT false,
    `onboardingCompletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WaLog` (
    `id` VARCHAR(191) NOT NULL,
    `tujuan` VARCHAR(191) NOT NULL,
    `tipe` VARCHAR(191) NOT NULL,
    `payload` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Zona` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,
    `petugasId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `initialMeter` INTEGER NOT NULL DEFAULT 0,
    `tandonId` VARCHAR(191) NULL,

    UNIQUE INDEX `Zona_kode_key`(`kode`),
    INDEX `Zona_tandonId_idx`(`tandonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JadwalPencatatan` (
    `id` VARCHAR(191) NOT NULL,
    `bulan` VARCHAR(7) NOT NULL,
    `tanggalRencana` DATETIME(3) NOT NULL,
    `target` INTEGER NOT NULL DEFAULT 0,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('WAITING', 'IN_PROGRESS', 'NON_PROGRESS', 'DONE', 'OVERDUE') NOT NULL DEFAULT 'WAITING',
    `zonaId` VARCHAR(191) NULL,
    `petugasId` VARCHAR(191) NULL,
    `alamat` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `JadwalPencatatan_bulan_idx`(`bulan`),
    INDEX `JadwalPencatatan_status_idx`(`status`),
    INDEX `JadwalPencatatan_zonaId_idx`(`zonaId`),
    INDEX `JadwalPencatatan_petugasId_idx`(`petugasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MagicLinkToken` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tagihanId` VARCHAR(191) NULL,
    `purpose` VARCHAR(191) NOT NULL DEFAULT 'pelunasan',
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MagicLinkToken_token_key`(`token`),
    INDEX `MagicLinkToken_userId_purpose_expiresAt_idx`(`userId`, `purpose`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResetMeter` (
    `id` VARCHAR(191) NOT NULL,
    `pelangganId` VARCHAR(191) NOT NULL,
    `tanggalReset` DATETIME(3) NOT NULL,
    `alasan` TEXT NULL,
    `meterAwalBaru` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'SELESAI') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ResetMeter_pelangganId_idx`(`pelangganId`),
    INDEX `ResetMeter_tanggalReset_idx`(`tanggalReset`),
    INDEX `ResetMeter_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CatatMeterBlok` (
    `id` VARCHAR(191) NOT NULL,
    `periodeId` VARCHAR(191) NOT NULL,
    `pelangganId` VARCHAR(191) NOT NULL,
    `meterAwal` INTEGER NOT NULL DEFAULT 0,
    `meterAkhir` INTEGER NULL,
    `pemakaianM3` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'DONE') NOT NULL DEFAULT 'PENDING',
    `kendala` VARCHAR(191) NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `lockedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CatatMeterBlok_periodeId_idx`(`periodeId`),
    INDEX `CatatMeterBlok_pelangganId_idx`(`pelangganId`),
    UNIQUE INDEX `CatatMeterBlok_periodeId_pelangganId_key`(`periodeId`, `pelangganId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_biaya` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NULL,
    `deskripsi` VARCHAR(191) NULL,
    `status` VARCHAR(10) NOT NULL DEFAULT 'Aktif',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `master_biaya_kode_key`(`kode`),
    INDEX `master_biaya_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengeluaran` (
    `id` VARCHAR(191) NOT NULL,
    `noBulan` VARCHAR(20) NOT NULL,
    `tanggalInput` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggalPengeluaran` DATETIME(3) NOT NULL,
    `total` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'CLOSE') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pengeluaran_noBulan_idx`(`noBulan`),
    INDEX `pengeluaran_tanggalPengeluaran_idx`(`tanggalPengeluaran`),
    INDEX `pengeluaran_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengeluaran_detail` (
    `id` VARCHAR(191) NOT NULL,
    `pengeluaranId` VARCHAR(191) NOT NULL,
    `masterBiayaId` VARCHAR(191) NOT NULL,
    `biayaNamaSnapshot` VARCHAR(120) NOT NULL,
    `keterangan` VARCHAR(255) NOT NULL,
    `nominal` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pengeluaran_detail_pengeluaranId_idx`(`pengeluaranId`),
    INDEX `pengeluaran_detail_masterBiayaId_idx`(`masterBiayaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Item` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kategori` VARCHAR(191) NOT NULL,
    `satuan` VARCHAR(191) NOT NULL,
    `stok` INTEGER NOT NULL DEFAULT 0,
    `hargaBeli` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Item_kode_key`(`kode`),
    INDEX `Item_kategori_idx`(`kategori`),
    INDEX `Item_nama_idx`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Purchase` (
    `id` VARCHAR(191) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,
    `supplier` VARCHAR(191) NOT NULL,
    `qty` INTEGER NOT NULL DEFAULT 0,
    `harga` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'CLOSE') NOT NULL DEFAULT 'DRAFT',
    `itemId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Purchase_tanggal_idx`(`tanggal`),
    INDEX `Purchase_supplier_idx`(`supplier`),
    INDEX `Purchase_itemId_idx`(`itemId`),
    INDEX `Purchase_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockLedger` (
    `id` VARCHAR(191) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,
    `masuk` INTEGER NOT NULL DEFAULT 0,
    `keluar` INTEGER NOT NULL DEFAULT 0,
    `saldo` INTEGER NOT NULL DEFAULT 0,
    `itemId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `StockLedger_tanggal_idx`(`tanggal`),
    INDEX `StockLedger_itemId_tanggal_idx`(`itemId`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Hutang` (
    `id` VARCHAR(191) NOT NULL,
    `noBukti` VARCHAR(191) NOT NULL,
    `tanggalInput` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggalHutang` DATETIME(3) NOT NULL,
    `keterangan` VARCHAR(191) NOT NULL,
    `pemberi` VARCHAR(191) NOT NULL,
    `nominal` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'CLOSE') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Hutang_noBukti_key`(`noBukti`),
    INDEX `Hutang_tanggalHutang_idx`(`tanggalHutang`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HutangDetail` (
    `id` VARCHAR(191) NOT NULL,
    `hutangId` VARCHAR(191) NOT NULL,
    `keterangan` VARCHAR(191) NOT NULL,
    `nominal` INTEGER NOT NULL,
    `no` INTEGER NOT NULL DEFAULT 0,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HutangDetail_hutangId_idx`(`hutangId`),
    INDEX `HutangDetail_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HutangPayment` (
    `id` VARCHAR(191) NOT NULL,
    `pemberi` VARCHAR(191) NOT NULL,
    `tanggalBayar` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `refNo` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `total` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'CLOSE') NOT NULL DEFAULT 'DRAFT',
    `postedAt` DATETIME(3) NULL,
    `postedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HutangPayment_tanggalBayar_idx`(`tanggalBayar`),
    INDEX `HutangPayment_status_idx`(`status`),
    INDEX `HutangPayment_postedAt_idx`(`postedAt`),
    INDEX `HutangPayment_postedBy_idx`(`postedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HutangPaymentDetail` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `hutangId` VARCHAR(191) NOT NULL,
    `hutangDetailId` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `note` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tandon` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `initialMeter` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Tandon_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TandonReading` (
    `id` VARCHAR(191) NOT NULL,
    `periodeId` VARCHAR(191) NOT NULL,
    `tandonId` VARCHAR(191) NOT NULL,
    `meterAwal` INTEGER NOT NULL DEFAULT 0,
    `meterAkhir` INTEGER NULL,
    `pemakaianM3` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'DONE') NOT NULL DEFAULT 'PENDING',
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `lockedAt` DATETIME(3) NULL,
    `kendala` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `TandonReading_tandonId_idx`(`tandonId`),
    INDEX `TandonReading_periodeId_idx`(`periodeId`),
    INDEX `TandonReading_status_idx`(`status`),
    INDEX `TandonReading_isLocked_lockedAt_idx`(`isLocked`, `lockedAt`),
    UNIQUE INDEX `TandonReading_periodeId_tandonId_key`(`periodeId`, `tandonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlokReading` (
    `id` VARCHAR(191) NOT NULL,
    `periodeId` VARCHAR(191) NOT NULL,
    `tandonId` VARCHAR(191) NOT NULL,
    `zonaId` VARCHAR(191) NOT NULL,
    `meterAwal` INTEGER NOT NULL DEFAULT 0,
    `meterAkhir` INTEGER NULL,
    `pemakaianM3` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'DONE') NOT NULL DEFAULT 'PENDING',
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `lockedAt` DATETIME(3) NULL,
    `kendala` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `BlokReading_tandonId_idx`(`tandonId`),
    INDEX `BlokReading_zonaId_idx`(`zonaId`),
    INDEX `BlokReading_periodeId_idx`(`periodeId`),
    INDEX `BlokReading_status_idx`(`status`),
    INDEX `BlokReading_isLocked_lockedAt_idx`(`isLocked`, `lockedAt`),
    UNIQUE INDEX `BlokReading_periodeId_zonaId_key`(`periodeId`, `zonaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mst_menus` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `parentId` BIGINT NULL,
    `level` TINYINT NOT NULL,
    `type` ENUM('group', 'module', 'menu') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `icon` VARCHAR(255) NULL,
    `color` VARCHAR(32) NULL,
    `orderNumber` INTEGER NOT NULL DEFAULT 0,
    `crudBuilderId` BIGINT NULL,
    `productId` CHAR(36) NULL,
    `productCode` VARCHAR(84) NULL,
    `routePath` VARCHAR(255) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `note` TEXT NULL,
    `createdBy` BIGINT NULL,
    `deletedAt` TIMESTAMP(6) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mst_menus_parentId_idx`(`parentId`),
    INDEX `mst_menus_type_level_idx`(`type`, `level`),
    INDEX `mst_menus_productCode_idx`(`productCode`),
    UNIQUE INDEX `mst_menus_parentId_title_key`(`parentId`, `title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mst_features` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `product_id` CHAR(36) NULL,
    `product_code` VARCHAR(64) NULL,
    `parent_id` BIGINT NULL,
    `name` VARCHAR(160) NOT NULL,
    `feature_code` VARCHAR(128) NOT NULL,
    `type` ENUM('category', 'feature', 'subfeature') NOT NULL DEFAULT 'feature',
    `description` TEXT NULL,
    `crud_menu_id` BIGINT NULL,
    `price_addon` INTEGER NOT NULL DEFAULT 0,
    `trial_available` BOOLEAN NOT NULL DEFAULT false,
    `trial_days` SMALLINT UNSIGNED NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `order_number` INTEGER NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `mst_features_feature_code_key`(`feature_code`),
    INDEX `mst_features_crud_menu_id_idx`(`crud_menu_id`),
    INDEX `mst_features_parent_id_idx`(`parent_id`),
    INDEX `mst_features_feature_code_idx`(`feature_code`),
    INDEX `mst_features_product_code_idx`(`product_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mst_company` (
    `id` CHAR(26) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `wa_client_id` VARCHAR(191) NULL,
    `wa_server_url` VARCHAR(255) NULL,
    `wa_api_key` VARCHAR(191) NULL,

    UNIQUE INDEX `mst_company_company_id_key`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportThread` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `productCode` VARCHAR(191) NULL,
    `topic` VARCHAR(200) NULL,
    `status` ENUM('OPEN', 'PENDING', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `createdById` VARCHAR(191) NULL,
    `createdByName` VARCHAR(120) NULL,
    `createdByPhone` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SupportThread_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportMessage` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `authorType` ENUM('ME', 'CS') NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `authorName` VARCHAR(120) NULL,
    `body` TEXT NOT NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SupportMessage_threadId_createdAt_idx`(`threadId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pajak` (
    `id` VARCHAR(191) NOT NULL,
    `periodeId` VARCHAR(191) NOT NULL,
    `keterangan` VARCHAR(191) NOT NULL,
    `pemakaianM3` INTEGER NOT NULL DEFAULT 0,
    `tarifPajakPerM3` INTEGER NOT NULL,
    `nominalBayarPajak` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'CLOSE') NOT NULL DEFAULT 'DRAFT',

    INDEX `Pajak_periodeId_idx`(`periodeId`),
    UNIQUE INDEX `Pajak_periodeId_key`(`periodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `app_roles_isActive_idx`(`isActive`),
    UNIQUE INDEX `app_roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `menuId` BIGINT NOT NULL,
    `menuTitle` VARCHAR(255) NOT NULL,
    `category` VARCHAR(160) NULL,
    `productCode` VARCHAR(84) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `app_permissions_menuId_key`(`menuId`),
    INDEX `app_permissions_productCode_idx`(`productCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `canView` BOOLEAN NOT NULL DEFAULT false,
    `canAdd` BOOLEAN NOT NULL DEFAULT false,
    `canEdit` BOOLEAN NOT NULL DEFAULT false,
    `canDelete` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `app_role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KendalaAir` (
    `id` VARCHAR(191) NOT NULL,
    `pelangganId` VARCHAR(191) NULL,
    `issue` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('UNRESOLVED', 'SOLVED') NOT NULL DEFAULT 'UNRESOLVED',
    `priority` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    `source` ENUM('METER_READING', 'METER_READING_BLOK', 'MANUAL_REPORT') NOT NULL DEFAULT 'MANUAL_REPORT',
    `reporterName` VARCHAR(160) NULL,
    `reporterPhone` VARCHAR(30) NULL,
    `reporterAddress` VARCHAR(255) NULL,
    `reportedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `solvedAt` DATETIME(3) NULL,
    `solution` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_appRoleId_fkey` FOREIGN KEY (`appRoleId`) REFERENCES `app_roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `mst_company`(`company_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_tandonId_fkey` FOREIGN KEY (`tandonId`) REFERENCES `Tandon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_deletedBy_fkey` FOREIGN KEY (`deletedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pelanggan` ADD CONSTRAINT `Pelanggan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pelanggan` ADD CONSTRAINT `Pelanggan_zonaId_fkey` FOREIGN KEY (`zonaId`) REFERENCES `Zona`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pelanggan` ADD CONSTRAINT `Pelanggan_deletedBy_fkey` FOREIGN KEY (`deletedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CatatPeriode` ADD CONSTRAINT `CatatPeriode_petugasId_fkey` FOREIGN KEY (`petugasId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CatatPeriode` ADD CONSTRAINT `CatatPeriode_lockedBy_fkey` FOREIGN KEY (`lockedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CatatPeriode` ADD CONSTRAINT `CatatPeriode_deletedBy_fkey` FOREIGN KEY (`deletedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CatatMeter` ADD CONSTRAINT `CatatMeter_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `CatatPeriode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CatatMeter` ADD CONSTRAINT `CatatMeter_pelangganId_fkey` FOREIGN KEY (`pelangganId`) REFERENCES `Pelanggan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CatatMeter` ADD CONSTRAINT `CatatMeter_deletedBy_fkey` FOREIGN KEY (`deletedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tagihan` ADD CONSTRAINT `Tagihan_pelangganId_fkey` FOREIGN KEY (`pelangganId`) REFERENCES `Pelanggan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tagihan` ADD CONSTRAINT `Tagihan_catatMeterId_fkey` FOREIGN KEY (`catatMeterId`) REFERENCES `CatatMeter`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tagihan` ADD CONSTRAINT `Tagihan_deletedBy_fkey` FOREIGN KEY (`deletedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pembayaran` ADD CONSTRAINT `Pembayaran_tagihanId_fkey` FOREIGN KEY (`tagihanId`) REFERENCES `Tagihan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pembayaran` ADD CONSTRAINT `Pembayaran_deletedBy_fkey` FOREIGN KEY (`deletedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailPembayaran` ADD CONSTRAINT `DetailPembayaran_pembayaranId_fkey` FOREIGN KEY (`pembayaranId`) REFERENCES `Pembayaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailPembayaran` ADD CONSTRAINT `DetailPembayaran_tagihanId_fkey` FOREIGN KEY (`tagihanId`) REFERENCES `Tagihan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailPembayaran` ADD CONSTRAINT `DetailPembayaran_pelangganId_fkey` FOREIGN KEY (`pelangganId`) REFERENCES `Pelanggan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Zona` ADD CONSTRAINT `Zona_petugasId_fkey` FOREIGN KEY (`petugasId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Zona` ADD CONSTRAINT `Zona_tandonId_fkey` FOREIGN KEY (`tandonId`) REFERENCES `Tandon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JadwalPencatatan` ADD CONSTRAINT `JadwalPencatatan_zonaId_fkey` FOREIGN KEY (`zonaId`) REFERENCES `Zona`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JadwalPencatatan` ADD CONSTRAINT `JadwalPencatatan_petugasId_fkey` FOREIGN KEY (`petugasId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MagicLinkToken` ADD CONSTRAINT `MagicLinkToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MagicLinkToken` ADD CONSTRAINT `MagicLinkToken_tagihanId_fkey` FOREIGN KEY (`tagihanId`) REFERENCES `Tagihan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResetMeter` ADD CONSTRAINT `ResetMeter_pelangganId_fkey` FOREIGN KEY (`pelangganId`) REFERENCES `Pelanggan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CatatMeterBlok` ADD CONSTRAINT `CatatMeterBlok_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `CatatPeriode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CatatMeterBlok` ADD CONSTRAINT `CatatMeterBlok_pelangganId_fkey` FOREIGN KEY (`pelangganId`) REFERENCES `Pelanggan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengeluaran_detail` ADD CONSTRAINT `pengeluaran_detail_pengeluaranId_fkey` FOREIGN KEY (`pengeluaranId`) REFERENCES `pengeluaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengeluaran_detail` ADD CONSTRAINT `pengeluaran_detail_masterBiayaId_fkey` FOREIGN KEY (`masterBiayaId`) REFERENCES `master_biaya`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockLedger` ADD CONSTRAINT `StockLedger_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HutangDetail` ADD CONSTRAINT `HutangDetail_hutangId_fkey` FOREIGN KEY (`hutangId`) REFERENCES `Hutang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HutangPayment` ADD CONSTRAINT `HutangPayment_postedBy_fkey` FOREIGN KEY (`postedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HutangPaymentDetail` ADD CONSTRAINT `HutangPaymentDetail_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `HutangPayment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HutangPaymentDetail` ADD CONSTRAINT `HutangPaymentDetail_hutangId_fkey` FOREIGN KEY (`hutangId`) REFERENCES `Hutang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HutangPaymentDetail` ADD CONSTRAINT `HutangPaymentDetail_hutangDetailId_fkey` FOREIGN KEY (`hutangDetailId`) REFERENCES `HutangDetail`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TandonReading` ADD CONSTRAINT `TandonReading_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `CatatPeriode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TandonReading` ADD CONSTRAINT `TandonReading_tandonId_fkey` FOREIGN KEY (`tandonId`) REFERENCES `Tandon`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlokReading` ADD CONSTRAINT `BlokReading_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `CatatPeriode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlokReading` ADD CONSTRAINT `BlokReading_tandonId_fkey` FOREIGN KEY (`tandonId`) REFERENCES `Tandon`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlokReading` ADD CONSTRAINT `BlokReading_zonaId_fkey` FOREIGN KEY (`zonaId`) REFERENCES `Zona`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mst_menus` ADD CONSTRAINT `mst_menus_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `mst_menus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mst_features` ADD CONSTRAINT `mst_features_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `mst_features`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportMessage` ADD CONSTRAINT `SupportMessage_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `SupportThread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pajak` ADD CONSTRAINT `Pajak_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `CatatPeriode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `app_role_permissions` ADD CONSTRAINT `app_role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `app_roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `app_role_permissions` ADD CONSTRAINT `app_role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `app_permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KendalaAir` ADD CONSTRAINT `KendalaAir_pelangganId_fkey` FOREIGN KEY (`pelangganId`) REFERENCES `Pelanggan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
