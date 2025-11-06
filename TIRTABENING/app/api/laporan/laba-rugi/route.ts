// // app/api/laporan/laba-rugi/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { getAuthUserWithRole } from "@/lib/auth-user-server";
// import { PengeluaranStatus, MetodeBayar, PurchaseStatus } from "@prisma/client";

// export const dynamic = "force-dynamic";

// function monthRange(ym: string) {
//     const [y, m] = ym.split("-").map(Number);
//     const start = new Date(Date.UTC(y, (m ?? 1) - 1, 1, 0, 0, 0));
//     const end = new Date(start);
//     end.setUTCMonth(end.getUTCMonth() + 1);
//     return { start, end };
// }
// function yearRange(yyyy: string) {
//     const y = Number(yyyy);
//     const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
//     const end = new Date(Date.UTC(y + 1, 0, 1, 0, 0, 0));
//     return { start, end };
// }
// function formatPeriodeID(ym?: string | null) {
//     if (!ym) return "-";
//     const [y, m] = ym.split("-").map(Number);
//     const d = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
//     return d.toLocaleDateString("id-ID", {
//         month: "long",
//         year: "numeric",
//         timeZone: "UTC",
//     });
// }

// export async function GET(req: NextRequest) {
//     const prisma = await db();
//     try {
//         // Auth
//         const me = await getAuthUserWithRole(req);
//         if (!me)
//             return NextResponse.json(
//                 { ok: false, error: "UNAUTHORIZED" },
//                 { status: 401 }
//             );
//         if (me.role !== "ADMIN" && me.role !== "PETUGAS") {
//             return NextResponse.json(
//                 { ok: false, error: "FORBIDDEN" },
//                 { status: 403 }
//             );
//         }

//         // Range waktu
//         const sp = req.nextUrl.searchParams;
//         const scope = (sp.get("scope") || "month").toLowerCase(); // month|year|all
//         const now = new Date();
//         const ymDefault = `${now.getUTCFullYear()}-${String(
//             now.getUTCMonth() + 1
//         ).padStart(2, "0")}`;

//         let start: Date | null = null,
//             end: Date | null = null,
//             periodLabel = "";

//         if (scope === "all") {
//             // all — tidak ada filter tanggal
//             periodLabel = "Semua Periode";
//         } else if (scope === "year") {
//             const y = sp.get("year") || String(now.getUTCFullYear());
//             ({ start, end } = yearRange(y));
//             periodLabel = `Tahun ${y}`;
//         } else {
//             const ym = sp.get("month") || ymDefault;
//             ({ start, end } = monthRange(ym));
//             const d = new Date(start);
//             periodLabel = d.toLocaleDateString("id-ID", {
//                 month: "long",
//                 year: "numeric",
//                 timeZone: "UTC",
//             });
//         }

//         // ===== PENDAPATAN (Pembayaran) =====
//         // Jika start/end === null maka jangan sertakan filter tanggal
//         const pembayaranWhere: any = { deletedAt: null };
//         if (start && end)
//             pembayaranWhere.tanggalBayar = { gte: start, lt: end };

//         const payments = await prisma.pembayaran.findMany({
//             where: pembayaranWhere,
//             include: { tagihan: { select: { periode: true } } },
//             orderBy: { tanggalBayar: "asc" },
//         });

//         const pendapatanTotal = payments.reduce(
//             (s, p) => s + (p.jumlahBayar || 0),
//             0
//         );
//         const pendapatanByMetode: Record<string, number> = {};
//         for (const m of Object.values(MetodeBayar)) pendapatanByMetode[m] = 0;
//         for (const p of payments) {
//             pendapatanByMetode[p.metode] =
//                 (pendapatanByMetode[p.metode] || 0) + (p.jumlahBayar || 0);
//         }

//         // ===== BEBAN (Pengeluaran CLOSE + Purchase CLOSE) =====
//         const pengeluaranDetailWhere: any = {
//             pengeluaran: { status: PengeluaranStatus.CLOSE },
//         };
//         if (start && end)
//             pengeluaranDetailWhere.pengeluaran.tanggalPengeluaran = {
//                 gte: start,
//                 lt: end,
//             };

//         const pengeluaranDetails = await prisma.pengeluaranDetail.findMany({
//             where: pengeluaranDetailWhere,
//             include: {
//                 masterBiaya: { select: { nama: true } },
//                 pengeluaran: {
//                     select: { tanggalPengeluaran: true, noBulan: true },
//                 },
//             },
//             orderBy: { createdAt: "asc" },
//         });

//         const purchaseWhere: any = {
//             status: PurchaseStatus.CLOSE,
//             deletedAt: null,
//         };
//         if (start && end) purchaseWhere.tanggal = { gte: start, lt: end };

//         const purchases = await prisma.purchase.findMany({
//             where: purchaseWhere,
//             include: { item: { select: { nama: true, kode: true } } },
//             orderBy: { tanggal: "asc" },
//         });

//         const bebanPengeluaran = pengeluaranDetails.reduce(
//             (s, d) => s + (d.nominal || 0),
//             0
//         );
//         const bebanPurchase = purchases.reduce((s, p) => s + (p.total || 0), 0);
//         const bebanTotal = bebanPengeluaran + bebanPurchase;

//         // Rekap beban per kategori
//         const bebanByKategori: Record<string, { nama: string; total: number }> =
//             {};
//         for (const d of pengeluaranDetails) {
//             const key = d.masterBiayaId || d.biayaNamaSnapshot || "Lainnya";
//             if (!bebanByKategori[key])
//                 bebanByKategori[key] = {
//                     nama:
//                         d.masterBiaya?.nama || d.biayaNamaSnapshot || "Lainnya",
//                     total: 0,
//                 };
//             bebanByKategori[key].total += d.nominal || 0;
//         }
//         if (bebanPurchase > 0) {
//             const key = "_PEMBELIAN_";
//             if (!bebanByKategori[key])
//                 bebanByKategori[key] = { nama: "Pembelian", total: 0 };
//             bebanByKategori[key].total += bebanPurchase;
//         }

//         // ===== LEDGER (dengan jenisPendapatan/jenisBeban) =====
//         type Row = {
//             tanggal: Date;
//             keterangan: string;
//             debit: number; // Beban
//             kredit: number; // Pendapatan
//             jenisPendapatan: string | null; // "Pembayaran Tagihan"
//             jenisBeban: string | null; // "Biaya Transport" / "Pembelian Pipa"
//         };

//         const ledgerPengeluaran: Row[] = pengeluaranDetails.map((d) => ({
//             tanggal: d.pengeluaran.tanggalPengeluaran,
//             keterangan: `${
//                 d.biayaNamaSnapshot || d.masterBiaya?.nama || "Biaya"
//             } • ${d.keterangan || ""}`.trim(),
//             debit: d.nominal,
//             kredit: 0,
//             jenisPendapatan: null,
//             jenisBeban: d.masterBiaya?.nama || d.biayaNamaSnapshot || "Biaya",
//         }));

//         const ledgerPurchases: Row[] = purchases.map((p) => ({
//             tanggal: p.tanggal,
//             keterangan: `Pembelian ${p.item?.nama || ""}${
//                 p.item?.kode ? ` (${p.item.kode})` : ""
//             }`,
//             debit: p.total,
//             kredit: 0,
//             jenisPendapatan: null,
//             jenisBeban: `Pembelian ${p.item?.nama || ""}`.trim(),
//         }));

//         const ledgerPayments: Row[] = payments.map((p) => ({
//             tanggal: p.tanggalBayar,
//             keterangan: `Pembayaran Tagihan Bulan ${formatPeriodeID(
//                 p.tagihan?.periode
//             )}`,
//             debit: 0,
//             kredit: p.jumlahBayar,
//             jenisPendapatan: "Pembayaran Tagihan",
//             jenisBeban: null,
//         }));

//         const ledgerAll: Row[] = [
//             ...ledgerPengeluaran,
//             ...ledgerPurchases,
//             ...ledgerPayments,
//         ].sort((a, b) => +new Date(a.tanggal) - +new Date(b.tanggal));

//         // ===== Pagination (in-memory, gabungan) =====
//         const size = Math.max(
//             1,
//             Math.min(5000, Number(sp.get("size") || 1000))
//         ); // default 1000
//         const page = Math.max(1, Number(sp.get("page") || 1));
//         const total = ledgerAll.length;
//         const pages = Math.max(1, Math.ceil(total / size));
//         const startIdx = (page - 1) * size;
//         const endIdx = startIdx + size;
//         const ledger = ledgerAll.slice(startIdx, endIdx);

//         const labaBersih = pendapatanTotal - bebanTotal;

//         return NextResponse.json({
//             ok: true,
//             scope,
//             periodLabel,
//             range: start && end ? { start, end } : null,
//             ringkasan: {
//                 bebanTotal,
//                 pendapatanTotal,
//                 labaBersih,
//             },
//             pendapatan: {
//                 total: pendapatanTotal,
//                 byMetode: pendapatanByMetode,
//                 rows: payments,
//             },
//             beban: {
//                 total: bebanTotal,
//                 byKategori: Object.values(bebanByKategori),
//                 pengeluaranDetails,
//                 purchases,
//             },
//             ledger,
//             pagination: {
//                 total,
//                 page,
//                 size,
//                 pages,
//                 hasPrev: page > 1,
//                 hasNext: page < pages,
//             },
//         });
//     } catch (e: any) {
//         console.error("LR API error:", e);
//         return NextResponse.json(
//             { ok: false, error: e?.message || "INTERNAL_ERROR" },
//             { status: 500 }
//         );
//     }
// }

// app/api/laporan/laba-rugi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserWithRole } from "@/lib/auth-user-server";

export const dynamic = "force-dynamic";

/* =========================
   Helpers: Date & Period
========================= */
function monthRange(ym: string) {
    const [y, m] = ym.split("-").map(Number);
    const start = new Date(Date.UTC(y, (m ?? 1) - 1, 1, 0, 0, 0));
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    return { start, end };
}
function yearRange(yyyy: string) {
    const y = Number(yyyy);
    const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y + 1, 0, 1, 0, 0, 0));
    return { start, end };
}
function formatPeriodeID(ym?: string | null) {
    if (!ym) return "-";
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
    return d.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}
function monthsBetween(start: Date, end: Date) {
    const arr: string[] = [];
    const cur = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)
    );
    while (cur < end) {
        const ym = `${cur.getUTCFullYear()}-${String(
            cur.getUTCMonth() + 1
        ).padStart(2, "0")}`;
        arr.push(ym);
        cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    return arr;
}

/* =========================
   Handler
========================= */
export async function GET(req: NextRequest) {
    const prisma = await db();
    try {
        // Auth
        const me = await getAuthUserWithRole(req);
        if (!me) {
            return NextResponse.json(
                { ok: false, error: "UNAUTHORIZED" },
                { status: 401 }
            );
        }
        if (me.role !== "ADMIN" && me.role !== "PETUGAS") {
            return NextResponse.json(
                { ok: false, error: "FORBIDDEN" },
                { status: 403 }
            );
        }

        const sp = req.nextUrl.searchParams;
        const multi = (sp.get("multi") || "").toLowerCase();

        /* ==========================================================
       MODE 1: Rekap 12 Bulan (multi=months&year=YYYY)
    ========================================================== */
        if (multi === "months") {
            const now = new Date();
            const year = Number(sp.get("year") || now.getUTCFullYear());
            const months: Array<{
                ym: string;
                label: string;
                pendapatan: number;
                beban: number;
                laba: number;
            }> = [];

            for (let m = 1; m <= 12; m++) {
                const ym = `${year}-${String(m).padStart(2, "0")}`;
                const { start, end } = monthRange(ym);

                // 1) Pendapatan (Pembayaran)
                const payments = await prisma.pembayaran.findMany({
                    where: {
                        deletedAt: null,
                        tanggalBayar: { gte: start, lt: end },
                    },
                    select: { jumlahBayar: true },
                });
                const pendapatan = payments.reduce(
                    (s, p) => s + (p.jumlahBayar || 0),
                    0
                );

                // 2) Beban: Pengeluaran CLOSE
                const pengeluaranDetails =
                    await prisma.pengeluaranDetail.findMany({
                        where: {
                            pengeluaran: {
                                status: "CLOSE",
                                tanggalPengeluaran: { gte: start, lt: end },
                            },
                        },
                        select: { nominal: true },
                    });
                const bebanPengeluaran = pengeluaranDetails.reduce(
                    (s, d) => s + (d.nominal || 0),
                    0
                );

                // 3) Beban: Purchase CLOSE
                const purchases = await prisma.purchase.findMany({
                    where: {
                        status: "CLOSE",
                        deletedAt: null,
                        tanggal: { gte: start, lt: end },
                    },
                    select: { total: true },
                });
                const bebanPurchase = purchases.reduce(
                    (s, p) => s + (p.total || 0),
                    0
                );

                // 4) Beban: Pajak CLOSE (via periode.id)
                const periode = await prisma.catatPeriode.findFirst({
                    where: { kodePeriode: ym },
                    select: { id: true },
                });
                let bebanPajak = 0;
                if (periode?.id) {
                    const pajaks = await prisma.pajak.findMany({
                        where: { status: "CLOSE", periodeId: periode.id },
                        select: { nominalBayarPajak: true },
                    });
                    bebanPajak = pajaks.reduce(
                        (s, pj) => s + (pj.nominalBayarPajak || 0),
                        0
                    );
                }

                // 5) Beban: Pembayaran Hutang (detail) dengan parent CLOSE & tanggal range
                const paymentsClose = await prisma.hutangPayment.findMany({
                    where: {
                        status: "CLOSE",
                        tanggalBayar: { gte: start, lt: end },
                    },
                    select: { id: true },
                });
                let bebanHutang = 0;
                if (paymentsClose.length > 0) {
                    const hutangDetail =
                        await prisma.hutangPaymentDetail.findMany({
                            where: {
                                paymentId: {
                                    in: paymentsClose.map((p) => p.id),
                                },
                            },
                            select: { amount: true },
                        });
                    bebanHutang = hutangDetail.reduce(
                        (s, d) => s + (d.amount || 0),
                        0
                    );
                }

                const beban =
                    bebanPengeluaran + bebanPurchase + bebanPajak + bebanHutang;

                months.push({
                    ym,
                    label: new Date(
                        Date.UTC(year, m - 1, 1)
                    ).toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                    }),
                    pendapatan,
                    beban,
                    laba: pendapatan - beban,
                });
            }

            return NextResponse.json({ ok: true, months });
        }

        /* ==========================================================
       MODE 2: Satu Periode (scope=month|year|all) + Ledger Detail
    ========================================================== */
        const scope = (sp.get("scope") || "month").toLowerCase(); // month|year|all
        const now = new Date();
        const ymDefault = `${now.getUTCFullYear()}-${String(
            now.getUTCMonth() + 1
        ).padStart(2, "0")}`;

        let start: Date | null = null,
            end: Date | null = null,
            periodLabel = "",
            ymList: string[] = []; // utk filter pajak per periode

        if (scope === "all") {
            periodLabel = "Semua Periode";
            // ambil semua pajak CLOSE nanti (tanpa filter periode)
        } else if (scope === "year") {
            const y = sp.get("year") || String(now.getUTCFullYear());
            ({ start, end } = yearRange(y));
            periodLabel = `Tahun ${y}`;
            ymList = monthsBetween(start!, end!);
        } else {
            const ym = sp.get("month") || ymDefault;
            ({ start, end } = monthRange(ym));
            const d = new Date(start);
            periodLabel = d.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
            });
            ymList = [ym];
        }

        // ===== PENDAPATAN =====
        const pembayaranWhere: any = { deletedAt: null };
        if (start && end)
            pembayaranWhere.tanggalBayar = { gte: start, lt: end };

        const payments = await prisma.pembayaran.findMany({
            where: pembayaranWhere,
            include: { tagihan: { select: { periode: true } } },
            orderBy: { tanggalBayar: "asc" },
        });
        const pendapatanTotal = payments.reduce(
            (s, p) => s + (p.jumlahBayar || 0),
            0
        );

        // ===== BEBAN: Pengeluaran CLOSE =====
        const pengeluaranDetailWhere: any = {
            pengeluaran: { status: "CLOSE" },
        };
        if (start && end) {
            pengeluaranDetailWhere.pengeluaran.tanggalPengeluaran = {
                gte: start,
                lt: end,
            };
        }
        const pengeluaranDetails = await prisma.pengeluaranDetail.findMany({
            where: pengeluaranDetailWhere,
            include: {
                masterBiaya: { select: { nama: true } },
                pengeluaran: {
                    select: { tanggalPengeluaran: true, noBulan: true },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        // ===== BEBAN: Purchase CLOSE =====
        const purchaseWhere: any = { status: "CLOSE", deletedAt: null };
        if (start && end) purchaseWhere.tanggal = { gte: start, lt: end };
        const purchases = await prisma.purchase.findMany({
            where: purchaseWhere,
            include: { item: { select: { nama: true, kode: true } } },
            orderBy: { tanggal: "asc" },
        });

        // ===== BEBAN: Pajak CLOSE (via periodeId IN ...)
        let pajaks: Array<{
            nominalBayarPajak: number;
            periode?: {
                kodePeriode: string | null;
                bulan: number | null;
                tahun: number | null;
            } | null;
        }> = [];
        if (scope === "all") {
            pajaks = await prisma.pajak.findMany({
                where: { status: "CLOSE" },
                include: {
                    periode: {
                        select: { kodePeriode: true, bulan: true, tahun: true },
                    },
                },
                orderBy: { id: "asc" },
            });
        } else {
            // ambil periode id dari ymList
            const periods = await prisma.catatPeriode.findMany({
                where: { kodePeriode: { in: ymList } },
                select: { id: true },
            });
            if (periods.length > 0) {
                pajaks = await prisma.pajak.findMany({
                    where: {
                        status: "CLOSE",
                        periodeId: { in: periods.map((p) => p.id) },
                    },
                    include: {
                        periode: {
                            select: {
                                kodePeriode: true,
                                bulan: true,
                                tahun: true,
                            },
                        },
                    },
                    orderBy: { id: "asc" },
                });
            }
        }

        // ===== BEBAN: HutangPaymentDetail (parent HutangPayment CLOSE & date filter)
        let hutangDetails: Array<{
            amount: number;
            payment?: { tanggalBayar: Date; refNo: string | null } | null;
            hutang?: {
                keterangan: string;
                pemberi: string | null;
                noBukti: string | null;
            } | null;
            hutangDetail?: {
                keterangan: string | null;
                tanggal: Date | null;
            } | null;
        }> = [];
        // cari payment CLOSE + tanggal range
        const payWhere: any = { status: "CLOSE" };
        if (start && end) payWhere.tanggalBayar = { gte: start, lt: end };
        const hp = await prisma.hutangPayment.findMany({
            where: payWhere,
            select: { id: true },
        });
        if (hp.length > 0) {
            hutangDetails = await prisma.hutangPaymentDetail.findMany({
                where: { paymentId: { in: hp.map((x) => x.id) } },
                include: {
                    payment: { select: { tanggalBayar: true, refNo: true } },
                    hutang: {
                        select: {
                            keterangan: true,
                            pemberi: true,
                            noBukti: true,
                        },
                    },
                    hutangDetail: {
                        select: { keterangan: true, tanggal: true },
                    },
                },
                orderBy: { id: "asc" },
            });
        }

        // ===== Aggregations =====
        const bebanPengeluaran = pengeluaranDetails.reduce(
            (s, d) => s + (d.nominal || 0),
            0
        );
        const bebanPurchase = purchases.reduce((s, p) => s + (p.total || 0), 0);
        const bebanPajak = pajaks.reduce(
            (s, pj) => s + (pj.nominalBayarPajak || 0),
            0
        );
        const bebanHutang = hutangDetails.reduce(
            (s, d) => s + (d.amount || 0),
            0
        );

        const bebanTotal =
            bebanPengeluaran + bebanPurchase + bebanPajak + bebanHutang;

        // ===== byKategori =====
        const bebanByKategori: Record<string, { nama: string; total: number }> =
            {};

        for (const d of pengeluaranDetails) {
            const key =
                (d as any).masterBiayaId ||
                (d as any).biayaNamaSnapshot ||
                "Lainnya";
            if (!bebanByKategori[key]) {
                bebanByKategori[key] = {
                    nama:
                        d.masterBiaya?.nama ||
                        (d as any).biayaNamaSnapshot ||
                        "Biaya",
                    total: 0,
                };
            }
            bebanByKategori[key].total += (d as any).nominal || 0;
        }
        if (bebanPurchase > 0) {
            const key = "_PEMBELIAN_";
            if (!bebanByKategori[key])
                bebanByKategori[key] = { nama: "Pembelian", total: 0 };
            bebanByKategori[key].total += bebanPurchase;
        }
        if (bebanPajak > 0) {
            const key = "_PAJAK_";
            if (!bebanByKategori[key])
                bebanByKategori[key] = { nama: "Pajak", total: 0 };
            bebanByKategori[key].total += bebanPajak;
        }
        if (bebanHutang > 0) {
            const key = "_PEMBAYARAN_HUTANG_";
            if (!bebanByKategori[key])
                bebanByKategori[key] = { nama: "Pembayaran Hutang", total: 0 };
            bebanByKategori[key].total += bebanHutang;
        }

        // ===== Ledger =====
        type Row = {
            tanggal: Date;
            keterangan: string;
            debit: number;
            kredit: number;
            jenisPendapatan: string | null;
            jenisBeban: string | null;
        };

        const ledgerPengeluaran: Row[] = pengeluaranDetails.map((d) => ({
            tanggal: (d as any).pengeluaran.tanggalPengeluaran,
            keterangan: `${
                (d as any).biayaNamaSnapshot || d.masterBiaya?.nama || "Biaya"
            } • ${((d as any).keterangan || "").trim()}`.trim(),
            debit: (d as any).nominal,
            kredit: 0,
            jenisPendapatan: null,
            jenisBeban:
                d.masterBiaya?.nama || (d as any).biayaNamaSnapshot || "Biaya",
        }));

        const ledgerPurchases: Row[] = purchases.map((p) => ({
            tanggal: p.tanggal,
            keterangan: `Pembelian ${(p.item?.nama || "").trim()}${
                p.item?.kode ? ` (${p.item.kode})` : ""
            }`.trim(),
            debit: p.total,
            kredit: 0,
            jenisPendapatan: null,
            jenisBeban: `Pembelian ${(p.item?.nama || "").trim()}`.trim(),
        }));

        const ledgerPajak: Row[] = pajaks.map((pj) => {
            const tahun = pj.periode?.tahun ?? 1970;
            const bulan = (pj.periode?.bulan ?? 1) - 1;
            const tanggalPeriode = new Date(Date.UTC(tahun, bulan, 1));
            const label = pj.periode?.kodePeriode
                ? `Pajak Periode ${formatPeriodeID(pj.periode.kodePeriode)}`
                : "Pajak";
            return {
                tanggal: tanggalPeriode,
                keterangan: label,
                debit: pj.nominalBayarPajak || 0,
                kredit: 0,
                jenisPendapatan: null,
                jenisBeban: "Pajak",
            };
        });

        const ledgerHutang: Row[] = hutangDetails.map((d) => {
            const tanggal = d.payment?.tanggalBayar ?? new Date();
            const ref = d.payment?.refNo ? ` [Ref ${d.payment.refNo}]` : "";
            const hutangKet = (
                d.hutangDetail?.keterangan ||
                d.hutang?.keterangan ||
                `Hutang ${d.hutang?.noBukti || ""}`
            ).trim();
            const pemberi = d.hutang?.pemberi ? ` • ${d.hutang.pemberi}` : "";
            return {
                tanggal,
                keterangan:
                    `Pembayaran Hutang${ref} • ${hutangKet}${pemberi}`.trim(),
                debit: d.amount || 0,
                kredit: 0,
                jenisPendapatan: null,
                jenisBeban: "Pembayaran Hutang",
            };
        });

        const ledgerPayments: Row[] = payments.map((p) => ({
            tanggal: p.tanggalBayar,
            keterangan: `Pembayaran Tagihan Bulan ${formatPeriodeID(
                p.tagihan?.periode
            )}`,
            debit: 0,
            kredit: p.jumlahBayar,
            jenisPendapatan: "Pembayaran Tagihan",
            jenisBeban: null,
        }));

        const ledgerAll: Row[] = [
            ...ledgerPengeluaran,
            ...ledgerPurchases,
            ...ledgerPajak,
            ...ledgerHutang,
            ...ledgerPayments,
        ].sort((a, b) => +new Date(a.tanggal) - +new Date(b.tanggal));

        // pagination in-memory
        const size = Math.max(
            1,
            Math.min(5000, Number(sp.get("size") || 1000))
        );
        const page = Math.max(1, Number(sp.get("page") || 1));
        const total = ledgerAll.length;
        const pages = Math.max(1, Math.ceil(total / size));
        const startIdx = (page - 1) * size;
        const endIdx = startIdx + size;
        const ledger = ledgerAll.slice(startIdx, endIdx);

        const labaBersih = pendapatanTotal - bebanTotal;

        // Pendapatan by metode (tanpa enum import)
        const pendapatanByMetode: Record<string, number> = {};
        for (const p of payments) {
            const k = (p as any).metode || "UNKNOWN";
            pendapatanByMetode[k] =
                (pendapatanByMetode[k] || 0) + ((p as any).jumlahBayar || 0);
        }

        return NextResponse.json({
            ok: true,
            scope,
            periodLabel,
            range: start && end ? { start, end } : null,
            ringkasan: { bebanTotal, pendapatanTotal, labaBersih },
            pendapatan: {
                total: pendapatanTotal,
                byMetode: pendapatanByMetode,
                rows: payments,
            },
            beban: {
                total: bebanTotal,
                byKategori: Object.values(bebanByKategori),
                pengeluaranDetails,
                purchases,
                pajaks,
                hutangDetails,
            },
            ledger,
            pagination: {
                total,
                page,
                size,
                pages,
                hasPrev: page > 1,
                hasNext: page < pages,
            },
        });
    } catch (e: any) {
        console.error("LR API error:", e);
        return NextResponse.json(
            { ok: false, error: e?.message || "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
