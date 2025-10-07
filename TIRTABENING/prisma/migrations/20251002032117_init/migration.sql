/*
  Warnings:

  - You are about to drop the column `periodeJadwalAktif` on the `setting` table. All the data in the column will be lost.
  - The `tanggalCatatDefault` column on the `setting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[catatMeterId]` on the table `Tagihan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `pelanggan` ADD COLUMN `lat` DOUBLE NULL,
    ADD COLUMN `lng` DOUBLE NULL,
    ADD COLUMN `passwordPlain` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `pembayaran` ADD COLUMN `keterangan` TEXT NULL,
    ADD COLUMN `metode` ENUM('TUNAI', 'TRANSFER', 'EWALLET', 'QRIS') NOT NULL DEFAULT 'TUNAI';

-- AlterTable
ALTER TABLE `setting` DROP COLUMN `periodeJadwalAktif`,
    ADD COLUMN `anNorekPembayaran` VARCHAR(120) NULL,
    ADD COLUMN `namaBankPembayaran` VARCHAR(120) NULL,
    ADD COLUMN `namaBendahara` VARCHAR(120) NULL,
    ADD COLUMN `norekPembayaran` VARCHAR(50) NULL,
    ADD COLUMN `whatsappCs` VARCHAR(30) NULL,
    DROP COLUMN `tanggalCatatDefault`,
    ADD COLUMN `tanggalCatatDefault` INTEGER NULL;

-- AlterTable
ALTER TABLE `tagihan` ADD COLUMN `catatMeterId` VARCHAR(191) NULL,
    ADD COLUMN `sisaKurang` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `tagihanLalu` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `tandonId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `zona` ADD COLUMN `initialMeter` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `tandonId` VARCHAR(191) NULL;

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

-- CreateIndex
CREATE UNIQUE INDEX `Tagihan_catatMeterId_key` ON `Tagihan`(`catatMeterId`);

-- CreateIndex
CREATE INDEX `Tagihan_catatMeterId_idx` ON `Tagihan`(`catatMeterId`);

-- CreateIndex
CREATE INDEX `User_tandonId_idx` ON `User`(`tandonId`);

-- CreateIndex
CREATE INDEX `Zona_tandonId_idx` ON `Zona`(`tandonId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_tandonId_fkey` FOREIGN KEY (`tandonId`) REFERENCES `Tandon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tagihan` ADD CONSTRAINT `Tagihan_catatMeterId_fkey` FOREIGN KEY (`catatMeterId`) REFERENCES `CatatMeter`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Zona` ADD CONSTRAINT `Zona_tandonId_fkey` FOREIGN KEY (`tandonId`) REFERENCES `Tandon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
