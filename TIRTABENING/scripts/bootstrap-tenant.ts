// scripts/bootstrap-tenant.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ulid } from "ulid";

function arg(name: string, def: string | null = null) {
    const p = `--${name}=`;
    const f = process.argv.find((a) => a.startsWith(p));
    return f ? f.slice(p.length) : def;
}

const PRODUCT_CODE =
    process.env.NEXT_PUBLIC_PRODUCT_CODE ||
    process.env.PRODUCT_CODE ||
    "NATABANYU";

async function main() {
    const prisma = new PrismaClient();

    const companyId = arg("companyId")!;
    let companyPassHash = arg("companyPassHash"); // hash dari Warehouse; boleh kosong
    // const adminUser  = arg('adminUser')!;
    const adminEmail = arg("adminEmail")!; // masuk ke username
    const adminPass = arg("adminPass")!;
    const adminPhone = arg("adminPhone")!;

    if (!companyPassHash && adminPass) {
        companyPassHash = await bcrypt.hash(adminPass, 12);
    }

    // 1) Upsert MstCompany by unique company_id
    await prisma.mstCompany.upsert({
        where: { company_id: companyId }, // <-- ini valid karena @unique
        update: {
            password: companyPassHash!,
            updated_at: new Date(),
        },
        create: {
            // per schema kamu, PK id tidak dipakai relasi; yang unik adalah company_id
            // jika ingin ada kolom id juga, Prisma akan generate otomatis jika kamu set @id — di schema ini id @db.Char(26) adalah PK
            id: ulid(),
            company_id: companyId,
            password: companyPassHash!,
            name: "Default Company",
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    // 2) upsert role default (role awal utama)
    const defaultRoles = [
        { name: "ADMIN", description: "Administrator sistem" },
        { name: "PETUGAS", description: "Petugas lapangan" },
        { name: "WARGA", description: "Akun warga / pelanggan" },
    ];

    for (const r of defaultRoles) {
        await prisma.appRole.upsert({
            where: { name: r.name },
            update: {
                description: r.description,
                isActive: true,
                updatedAt: new Date(),
            },
            create: {
                name: r.name,
                description: r.description,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }

    // Ambil AppRole Awal
    const adminRole = await prisma.appRole.findUnique({
        where: { name: "ADMIN" },
    });

    const petugasRole = await prisma.appRole.findUnique({
        where: { name: "PETUGAS" },
    });
    const wargaRole = await prisma.appRole.findUnique({
        where: { name: "WARGA" },
    });

    if (!adminRole) {
        throw new Error("AppRole ADMIN tidak ditemukan setelah seeding");
    }

    if (!petugasRole || !wargaRole) {
        throw new Error(
            "Role PETUGAS atau WARGA tidak ditemukan setelah seeding"
        );
    }

    // 3) seed menu
    const baseMenus = [
        {
            id: 1,
            parentId: null,
            level: 1,
            type: "menu",
            title: "Dashboard",
            orderNumber: 1,
            routePath: "/dashboard",
        },
        {
            id: 2,
            parentId: null,
            level: 1,
            type: "module",
            title: "Master",
            orderNumber: 2,
            routePath: undefined,
        },
        {
            id: 3,
            parentId: 2,
            level: 2,
            type: "menu",
            title: "Pelanggan",
            orderNumber: 1,
            routePath: "/pelanggan",
        },
        {
            id: 5,
            parentId: 2,
            level: 2,
            type: "menu",
            title: "Inventaris",
            orderNumber: 2,
            routePath: "/inventaris",
        },
        {
            id: 6,
            parentId: 2,
            level: 2,
            type: "menu",
            title: "Tandon",
            orderNumber: 3,
            routePath: "/tandon",
        },
        {
            id: 7,
            parentId: 2,
            level: 2,
            type: "menu",
            title: "Blok",
            orderNumber: 4,
            routePath: "/zona",
        },
        {
            id: 8,
            parentId: null,
            level: 1,
            type: "module",
            title: "Operasional",
            orderNumber: 3,
            routePath: undefined,
        },
        {
            id: 9,
            parentId: 8,
            level: 2,
            type: "menu",
            title: "Catat Meter",
            orderNumber: 1,
            routePath: "/catat-meter",
        },
        {
            id: 10,
            parentId: 8,
            level: 2,
            type: "menu",
            title: "Reset Meteran",
            orderNumber: 2,
            routePath: "/reset-meteran",
        },
        {
            id: 11,
            parentId: 8,
            level: 2,
            type: "menu",
            title: "Jadwal Pencatatan",
            orderNumber: 3,
            routePath: "/jadwal-pencatatan",
        },
        {
            id: 12,
            parentId: null,
            level: 1,
            type: "module",
            title: "Distribusi",
            orderNumber: 4,
            routePath: undefined,
        },
        {
            id: 13,
            parentId: 12,
            level: 2,
            type: "menu",
            title: "Hirarki",
            orderNumber: 1,
            routePath: "/distribusi/hirarki",
        },
        {
            id: 14,
            parentId: 12,
            level: 2,
            type: "menu",
            title: "Rekonsiliasi",
            orderNumber: 2,
            routePath: "/distribusi/rekonsiliasi",
        },
        {
            id: 15,
            parentId: 12,
            level: 2,
            type: "menu",
            title: "Peta",
            orderNumber: 3,
            routePath: "/distribusi/peta",
        },
        {
            id: 16,
            parentId: null,
            level: 1,
            type: "module",
            title: "Keuangan",
            orderNumber: 5,
            routePath: undefined,
        },
        {
            id: 17,
            parentId: 16,
            level: 2,
            type: "menu",
            title: "Biaya",
            orderNumber: 1,
            routePath: "/biaya",
        },
        {
            id: 18,
            parentId: 16,
            level: 2,
            type: "menu",
            title: "Pengeluaran",
            orderNumber: 2,
            routePath: "/pengeluaran",
        },
        {
            id: 19,
            parentId: 16,
            level: 2,
            type: "menu",
            title: "Hutang",
            orderNumber: 3,
            routePath: "/hutang",
        },
        {
            id: 20,
            parentId: 16,
            level: 2,
            type: "menu",
            title: "Pembayaran Hutang",
            orderNumber: 4,
            routePath: "/hutang-pembayaran",
        },
        {
            id: 21,
            parentId: 16,
            level: 2,
            type: "menu",
            title: "Tagihan Pembayaran",
            orderNumber: 5,
            routePath: "/tagihan-pembayaran",
        },
        {
            id: 22,
            parentId: null,
            level: 1,
            type: "module",
            title: "Laporan",
            orderNumber: 6,
            routePath: undefined,
        },
        {
            id: 23,
            parentId: 22,
            level: 2,
            type: "menu",
            title: "Laporan Summary",
            orderNumber: 1,
            routePath: "/laporan-summary",
        },
        {
            id: 24,
            parentId: 22,
            level: 2,
            type: "menu",
            title: "Laporan Catat Meter",
            orderNumber: 2,
            routePath: "/laporan-catat-meter",
        },
        {
            id: 25,
            parentId: 22,
            level: 2,
            type: "menu",
            title: "Laporan Konsumsi Zona",
            orderNumber: 3,
            routePath: "/laporan/konsumsi-zona",
        },
        {
            id: 26,
            parentId: 22,
            level: 2,
            type: "menu",
            title: "Laporan Status Pembayaran",
            orderNumber: 4,
            routePath: "/laporan-status-pembayaran",
        },
        {
            id: 27,
            parentId: 22,
            level: 2,
            type: "menu",
            title: "Laporan Piutang",
            orderNumber: 5,
            routePath: "/laporan/piutang",
        },
        {
            id: 28,
            parentId: 22,
            level: 2,
            type: "menu",
            title: "Laporan Hutang",
            orderNumber: 6,
            routePath: "/laporan/hutang",
        },
        {
            id: 29,
            parentId: 22,
            level: 2,
            type: "menu",
            title: "Laporan Laba Rugi",
            orderNumber: 7,
            routePath: "/laporan/laba-rugi",
        },
        {
            id: 30,
            parentId: 22,
            level: 2,
            type: "menu",
            title: "Laporan Keuangan",
            orderNumber: 8,
            routePath: "/laporan/keuangan",
        },
        {
            id: 31,
            parentId: null,
            level: 1,
            type: "module",
            title: "Pengaturan",
            orderNumber: 7,
            routePath: undefined,
        },
        {
            id: 32,
            parentId: 31,
            level: 2,
            type: "menu",
            title: "Pengaturan",
            orderNumber: 1,
            routePath: "/pengaturan",
        },
        {
            id: 33,
            parentId: 31,
            level: 2,
            type: "menu",
            title: "WhatsApp Setting",
            orderNumber: 2,
            routePath: "/whatsapp-setting",
        },
        {
            id: 34,
            parentId: null,
            level: 1,
            type: "module",
            title: "Petugas",
            orderNumber: 8,
            routePath: undefined,
        },
        {
            id: 37,
            parentId: 34,
            level: 2,
            type: "menu",
            title: "Riwayat Petugas",
            orderNumber: 1,
            routePath: "/petugas/riwayat",
        },
        {
            id: 38,
            parentId: 34,
            level: 2,
            type: "menu",
            title: "Profil Petugas",
            orderNumber: 2,
            routePath: "/petugas/profil",
        },
        {
            id: 39,
            parentId: null,
            level: 1,
            type: "module",
            title: "Warga",
            orderNumber: 9,
            routePath: undefined,
        },
        {
            id: 40,
            parentId: 39,
            level: 2,
            type: "menu",
            title: "Dashboard Warga",
            orderNumber: 1,
            routePath: "/warga-dashboard",
        },
        {
            id: 42,
            parentId: 39,
            level: 2,
            type: "menu",
            title: "Profil Warga",
            orderNumber: 2,
            routePath: "/warga-profil",
        },
        {
            id: 45,
            parentId: null,
            level: 1,
            type: "module",
            title: "Meteran",
            orderNumber: 10,
            routePath: undefined,
        },
        {
            id: 46,
            parentId: 45,
            level: 2,
            type: "menu",
            title: "Catat Meter Tandon",
            orderNumber: 1,
            routePath: "/catat-tandon",
        },
        {
            id: 47,
            parentId: 45,
            level: 2,
            type: "menu",
            title: "Catat Meter Blok",
            orderNumber: 2,
            routePath: "/catat-blok",
        },
        {
            id: 48,
            parentId: 16,
            level: 2,
            type: "menu",
            title: "Pengelolaan Pajak",
            orderNumber: 6,
            routePath: "/pajak",
        },
        {
            id: 49,
            parentId: null,
            level: 1,
            type: "module",
            title: "Support",
            orderNumber: 11,
            routePath: undefined,
        },
        {
            id: 50,
            parentId: 49,
            level: 2,
            type: "menu",
            title: "Pusat Bantuan",
            orderNumber: 1,
            routePath: "/support",
        },
        {
            id: 51,
            parentId: 49,
            level: 2,
            type: "menu",
            title: "CS Center",
            orderNumber: 2,
            routePath: "/admin/support",
        },
        {
            id: 52,
            parentId: 8,
            level: 2,
            type: "menu",
            title: "Kendala",
            orderNumber: 4,
            routePath: "/kendala",
        },
    ] as const;

    // Map seedId -> DB id (bigint)
    const seedIdToDbId = new Map<number, bigint>();

    // Insert/update semua menu berdasarkan @@unique([parentId, title])
    for (const m of baseMenus) {
        // ambil parent db id dari map (kalau module root, parentId = null)
        const parentDbId =
            m.parentId != null ? seedIdToDbId.get(m.parentId) ?? null : null;

        // bangun where dinamis
        const where: any = {
            title: m.title,
            productCode: PRODUCT_CODE,
        };
        if (parentDbId === null) {
            where.parentId = null;
        } else {
            where.parentId = parentDbId;
        }

        // cek sudah ada atau belum
        const existing = await prisma.mstMenu.findFirst({
            where,
        });

        let menu;
        if (existing) {
            menu = await prisma.mstMenu.update({
                where: { id: existing.id },
                data: {
                    level: m.level,
                    type: m.type,
                    orderNumber: m.orderNumber,
                    routePath: m.routePath ?? null,
                    productCode: PRODUCT_CODE,
                    isActive: true,
                    updatedAt: new Date(),
                },
            });
        } else {
            menu = await prisma.mstMenu.create({
                data: {
                    parentId: parentDbId, // boleh null kalau di schema parentId optional
                    level: m.level,
                    type: m.type,
                    title: m.title,
                    orderNumber: m.orderNumber,
                    routePath: m.routePath ?? null,
                    productCode: PRODUCT_CODE,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        }

        seedIdToDbId.set(m.id, menu.id);
    }

    // 4) sinkron ke apppermisions admin, petugas, warga awal
    // Ambil semua menu aktif (buat hitung parentTitle/category)
    const allMenus = await prisma.mstMenu.findMany({
        where: {
            productCode: PRODUCT_CODE,
            isActive: true,
        },
    });

    const menuById = new Map(allMenus.map((mm) => [mm.id.toString(), mm]));

    // Menu awal ADMIN
    const initialMenuAdmin = await prisma.mstMenu.findMany({
        where: {
            productCode: PRODUCT_CODE,
            isActive: true,
            routePath: {
                in: [
                    "/dashboard",
                    "/pelanggan",
                    "/inventaris",
                    "/tandon",
                    "/zona",
                    "/pengaturan",
                    "/kendala",
                    "/laporan-summary",
                    "/laporan-catat-meter",
                    "/laporan-status-pembayaran",
                    "/support",
                    "/admin/support",
                    "/catat-meter",
                    "/jadwal-pencatatan",
                    "/tagihan-pembayaran",
                ],
            },
        },
    });

    // Menu awal PETUGAS
    const initialMenuPetugas = await prisma.mstMenu.findMany({
        where: {
            productCode: PRODUCT_CODE,
            isActive: true,
            routePath: {
                in: [
                    "/jadwal-pencatatan",
                    "/petugas/riwayat",
                    "/petugas/profil",
                    "/catat-meter",
                    "/laporan-catat-meter",
                ],
            },
        },
    });

    // Menu awal WARGA
    const initialMenuWarga = await prisma.mstMenu.findMany({
        where: {
            productCode: PRODUCT_CODE,
            isActive: true,
            routePath: {
                in: [
                    "/warga-dashboard",
                    "/warga-profil",
                    "/tagihan-pembayaran",
                ],
            },
        },
    });

    type MenuRecord = {
        id: bigint;
        title: string;
        category: string | null;
    };

    function buildMenuRecords(source: typeof allMenus): MenuRecord[] {
        return source
            .filter((m) => m.type === "menu") // skip module
            .map((m) => {
                const parentTitle =
                    m.parentId != null
                        ? menuById.get(m.parentId.toString())?.title ?? null
                        : null;
                return {
                    id: m.id,
                    title: m.title,
                    category: parentTitle,
                };
            });
    }

    const adminMenuRecords = buildMenuRecords(initialMenuAdmin);
    const petugasMenuRecords = buildMenuRecords(initialMenuPetugas);
    const wargaMenuRecords = buildMenuRecords(initialMenuWarga);

    // Gabungkan semua menu yang dipakai role2 awal (unik)
    const allInitialMenuRecordsMap = new Map<bigint, MenuRecord>();
    for (const m of [
        ...adminMenuRecords,
        ...petugasMenuRecords,
        ...wargaMenuRecords,
    ]) {
        allInitialMenuRecordsMap.set(m.id, m);
    }
    const allInitialMenuRecords = Array.from(allInitialMenuRecordsMap.values());

    const permissionRecords = new Map<bigint, string>(); // menuId -> permissionId

    for (const m of allInitialMenuRecords) {
        const perm = await prisma.appPermission.upsert({
            where: { menuId: m.id },
            update: {
                menuTitle: m.title,
                category: m.category ?? undefined,
                productCode: PRODUCT_CODE,
                isActive: true,
            },
            create: {
                menuId: m.id,
                menuTitle: m.title,
                category: m.category ?? undefined,
                productCode: PRODUCT_CODE,
                isActive: true,
            },
        });

        permissionRecords.set(m.id, perm.id);
    }

    // 5) akses admin untuk menu tsb
    for (const m of adminMenuRecords) {
        const permId = permissionRecords.get(m.id);
        if (!permId) continue;

        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: permId,
                },
            },
            update: {
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
            },
            create: {
                roleId: adminRole.id,
                permissionId: permId,
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
            },
        });
    }

    // 6) Akses awal petugas
    for (const m of petugasMenuRecords) {
        const permId = permissionRecords.get(m.id);
        if (!permId) continue;

        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: petugasRole.id,
                    permissionId: permId,
                },
            },
            update: {
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
            },
            create: {
                roleId: petugasRole.id,
                permissionId: permId,
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
            },
        });
    }

    // 7) Akses awal warga
    for (const m of wargaMenuRecords) {
        const permId = permissionRecords.get(m.id);
        if (!permId) continue;

        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: wargaRole.id,
                    permissionId: permId,
                },
            },
            update: {
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
            },
            create: {
                roleId: wargaRole.id,
                permissionId: permId,
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
            },
        });
    }

    // 6) Upsert admin User by username + set companyId = company_id (relasi ke MstCompany.company_id)
    const adminHash = await bcrypt.hash(adminPass, 12);

    await prisma.user.upsert({
        where: { username: adminEmail },
        update: {
            passwordHash: adminHash,
            isActive: true,
            role: adminRole.name,
            appRoleId: adminRole.id,
            name: "Administrator",
            phone: adminPhone,
            companyId: companyId, // <-- link ke MstCompany.company_id
            mustChangePassword: true,
            updatedAt: new Date(),
        },
        create: {
            username: adminEmail,
            passwordHash: adminHash,
            name: "Administrator",
            phone: adminPhone,
            role: adminRole.name,
            appRoleId: adminRole.id,
            isActive: true,
            companyId: companyId, // <-- link ke MstCompany.company_id
            mustChangePassword: true,
            // createdAt/updatedAt diisi Prisma
        },
    });

    await prisma.$disconnect();
    console.log("bootstrap-tenant: done");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
