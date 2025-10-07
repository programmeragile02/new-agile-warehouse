import { PrismaClient, MenuType } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCT_ID = "ec23de55-565f-432e-836e-83d5c336d23f";
const PRODUCT_CODE = "TIRTABENING";

// helper: simpan node + children (rekursif)
async function createNode(
    node: {
        title: string;
        type: MenuType;
        routePath?: string | null;
        icon?: string | null;
        color?: string | null;
        note?: string | null;
        children?: Omit<
            Parameters<typeof createNode>[0],
            "level" | "parentId"
        >[];
    },
    parentId: bigint | null,
    level: number,
    orderNumber: number
): Promise<bigint> {
    const created = await prisma.mstMenu.create({
        data: {
            parentId,
            level,
            type: node.type,
            title: node.title,
            routePath: node.routePath ?? null,
            icon: node.icon ?? null,
            color: node.color ?? null,
            note: node.note ?? null,
            orderNumber,
            productId: PRODUCT_ID,
            productCode: PRODUCT_CODE,
            isActive: true,
        },
        select: { id: true },
    });

    if (node.children?.length) {
        for (let i = 1; i < node.children.length; i++) {
            await createNode(
                childWithDefaults(node.children[i]),
                created.id,
                level + 1,
                i + 1
            );
        }
    }
    return created.id;
}

// pastikan properti opsional aman
function childWithDefaults(n: any) {
    return { routePath: null, icon: null, color: null, note: null, ...n };
}

/* =========================
   STRUKTUR MENU (ROOT = MODULE)
========================= */
const tree: Array<{
    title: string;
    type: MenuType;
    routePath?: string | null;
    children?: any[];
}> = [
    // ===== ROOT MODULES (bekas "Admin")
    {
        title: "Master",
        type: "module" as MenuType,
        children: [
            {
                title: "Pelanggan",
                type: "menu" as MenuType,
                routePath: "/master/pelanggan",
            },
            {
                title: "Meteran",
                type: "menu" as MenuType,
                routePath: "/master/meteran",
            },
            {
                title: "Inventaris",
                type: "menu" as MenuType,
                routePath: "/master/inventaris",
            },
            {
                title: "Tandon",
                type: "menu" as MenuType,
                routePath: "/master/tandon",
            },
            {
                title: "Blok",
                type: "menu" as MenuType,
                routePath: "/master/blok",
            },
        ],
    },
    {
        title: "Operasional",
        type: "module" as MenuType,
        children: [
            {
                title: "Catat Meter",
                type: "menu" as MenuType,
                routePath: "/operasional/catat-meter",
            },
            {
                title: "Reser Meteran",
                type: "menu" as MenuType,
                routePath: "/operasional/reser-meteran",
            },
            {
                title: "Jadwal Pencatatan",
                type: "menu" as MenuType,
                routePath: "/operasional/jadwal",
            },
        ],
    },
    {
        title: "Distribusi",
        type: "module" as MenuType,
        children: [
            {
                title: "Hirarki",
                type: "menu" as MenuType,
                routePath: "/distribusi/hirarki",
            },
            {
                title: "Rekonsiliasi",
                type: "menu" as MenuType,
                routePath: "/distribusi/rekonsiliasi",
            },
            {
                title: "Peta",
                type: "menu" as MenuType,
                routePath: "/distribusi/peta",
            },
        ],
    },
    {
        title: "Keuangan",
        type: "module" as MenuType,
        children: [
            {
                title: "Biaya",
                type: "menu" as MenuType,
                routePath: "/keuangan/biaya",
            },
            {
                title: "Pengeluaran",
                type: "menu" as MenuType,
                routePath: "/keuangan/pengeluaran",
            },
            {
                title: "Hutang",
                type: "menu" as MenuType,
                routePath: "/keuangan/hutang",
            },
            {
                title: "Pembayaran Hutang",
                type: "menu" as MenuType,
                routePath: "/keuangan/pembayaran-hutang",
            },
            {
                title: "Tagihan Pembayaran",
                type: "menu" as MenuType,
                routePath: "/keuangan/tagihan-pembayaran",
            },
        ],
    },
    {
        title: "Laporan",
        type: "module" as MenuType,
        children: [
            {
                title: "Laporan Summary",
                type: "menu" as MenuType,
                routePath: "/laporan/summary",
            },
            {
                title: "Laporan Catat Meter",
                type: "menu" as MenuType,
                routePath: "/laporan/catat-meter",
            },
            {
                title: "Laporan Konsumsi Zona",
                type: "menu" as MenuType,
                routePath: "/laporan/konsumsi-zona",
            },
            {
                title: "Laporan Status Pembayaran",
                type: "menu" as MenuType,
                routePath: "/laporan/status-pembayaran",
            },
            {
                title: "Laporan Piutang",
                type: "menu" as MenuType,
                routePath: "/laporan/piutang",
            },
            {
                title: "Laporan Hutang",
                type: "menu" as MenuType,
                routePath: "/laporan/hutang",
            },
            {
                title: "Laporan Laba Rugi",
                type: "menu" as MenuType,
                routePath: "/laporan/laba-rugi",
            },
            {
                title: "Laporan Keuangan",
                type: "menu" as MenuType,
                routePath: "/laporan/keuangan",
            },
        ],
    },
    {
        title: "Pengaturan",
        type: "module" as MenuType,
        children: [
            {
                title: "Pengaturan",
                type: "menu" as MenuType,
                routePath: "/pengaturan",
            },
            {
                title: "WhatsApp Setting",
                type: "menu" as MenuType,
                routePath: "/pengaturan/whatsapp",
            },
        ],
    },

    // ===== PETUGAS
    {
        title: "Petugas",
        type: "group" as MenuType,
        children: [
            {
                title: "Dashboard",
                type: "menu" as MenuType,
                routePath: "/petugas",
            },
            {
                title: "Jadwal",
                type: "menu" as MenuType,
                routePath: "/petugas/jadwal",
            },
            {
                title: "Riwayat",
                type: "menu" as MenuType,
                routePath: "/petugas/riwayat",
            },
            {
                title: "Profil",
                type: "menu" as MenuType,
                routePath: "/petugas/profil",
            },
        ],
    },

    // ===== WARGA
    {
        title: "Warga",
        type: "group" as MenuType,
        children: [
            {
                title: "Dashboard",
                type: "menu" as MenuType,
                routePath: "/warga",
            },
            {
                title: "Tagihan",
                type: "menu" as MenuType,
                routePath: "/warga/tagihan",
            },
            {
                title: "Profil",
                type: "menu" as MenuType,
                routePath: "/warga/profil",
            },
        ],
    },
];

async function main() {
    // Bersihkan data lama khusus produk ini (aman untuk dev/staging)
    await prisma.mstMenu.deleteMany({ where: { productCode: PRODUCT_CODE } });

    for (let i = 0; i < tree.length; i++) {
        await createNode(childWithDefaults(tree[i]), null, 0, i + 1);
    }
}

main()
    .then(async () => {
        console.log("✅ Seed mst_menus selesai (root = module, tanpa Admin).");
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Seed gagal:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
