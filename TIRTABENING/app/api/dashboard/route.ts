import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const IMONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const pad2 = (n: number) => n.toString().padStart(2, "0");

// safe percent change: bila prev = 0 → 0 (hindari Infinity)
function pctChange(curr: number, prev: number) {
  if (!prev) return 0;
  return ((curr - prev) / prev) * 100;
}

function prevYM(year: number, month1to12: number) {
  const d = new Date(Date.UTC(year, month1to12 - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}
function nextYM(year: number, month1to12: number) {
  const d = new Date(Date.UTC(year, month1to12 - 1, 1));
  d.setUTCMonth(d.getUTCMonth() + 1);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}

// ===== NEW: helper saldo akhir (piutang/kredit) dengan fallback =====
function hitungSaldoAkhir(
  totalTagihan: number,
  tagihanLalu: number | null | undefined,
  totalBayar: number,
  sisaKurang: number | null | undefined
) {
  const fallback = (totalTagihan || 0) + (tagihanLalu || 0) - (totalBayar || 0);
  return sisaKurang ?? fallback;
}

// ===== NEW: sum saldo per periode (piutang & kredit terpisah) =====
async function sumSaldoByPeriode(periode: string) {
  const prisma = await db();
  const rows = await prisma.tagihan.findMany({
    where: { deletedAt: null, periode },
    select: {
      totalTagihan: true,
      tagihanLalu: true,
      sisaKurang: true,
      pembayarans: { select: { jumlahBayar: true } },
    },
  });

  let piutangAmount = 0,
    piutangCount = 0;
  let kreditAmount = 0,
    kreditCount = 0;

  for (const r of rows) {
    const paid = r.pembayarans.reduce((s, p) => s + (p.jumlahBayar || 0), 0);
    const saldo = hitungSaldoAkhir(
      r.totalTagihan || 0,
      r.tagihanLalu,
      paid,
      r.sisaKurang
    );
    if (saldo > 0) {
      piutangAmount += saldo;
      piutangCount++;
    } else if (saldo < 0) {
      kreditAmount += Math.abs(saldo);
      kreditCount++;
    }
  }
  return { piutangAmount, piutangCount, kreditAmount, kreditCount };
}

export async function GET(req: Request) {
  const prisma = await db();
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());

    // ==== CHART: Pemakaian (CatatMeter by tahun CatatPeriode) ====
    const catats = await prisma.catatMeter.findMany({
      where: { deletedAt: null, periode: { tahun: year } },
      select: { pemakaianM3: true, periode: { select: { bulan: true } } },
    });
    const usageByMonth: number[] = Array(12).fill(0);
    for (const r of catats) {
      const idx = Math.max(0, Math.min(11, (r.periode?.bulan ?? 1) - 1));
      usageByMonth[idx] += r.pemakaianM3 ?? 0;
    }
    const usageData = IMONTHS.map((m, i) => ({
      month: m,
      usage: usageByMonth[i],
    }));

    // ==== CHART: Tagihan per bulan (pakai Tagihan.periode 'YYYY-MM') ====
    const tagihanTahun = await prisma.tagihan.findMany({
      where: { deletedAt: null, periode: { startsWith: `${year}-` } },
      select: { periode: true, totalTagihan: true },
    });
    const billingByMonth: number[] = Array(12).fill(0);
    for (const t of tagihanTahun) {
      const [yStr, mStr] = (t.periode ?? "").split("-");
      if (Number(yStr) !== year) continue;
      const midx = Math.max(0, Math.min(11, Number(mStr) - 1));
      billingByMonth[midx] += t.totalTagihan ?? 0; // bulan ini saja
    }
    const billingData = IMONTHS.map((m, i) => ({
      month: m,
      amount: billingByMonth[i],
    }));

    // ==== TABLE: 5 periode catat terakhir tahun ini (label = periode tagihan) ====
    const periods = await prisma.catatPeriode.findMany({
      where: { deletedAt: null, tahun: year },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
      take: 5,
      select: { kodePeriode: true, bulan: true, tahun: true },
    });
    const kode = (y: number, m: number) => `${y}-${pad2(m)}`;
    const tableData: any[] = [];

    for (const p of periods) {
      // periode catat
      const kPeriodeCatat = p.kodePeriode || kode(p.tahun, p.bulan);

      // periode TAGIHAN = bulan berikutnya
      const { y: billY, m: billM } = nextYM(p.tahun, p.bulan);
      const kPeriodeTagihan = kode(billY, billM);

      // total m³ dari catat periode ini
      const cmRows = await prisma.catatMeter.findMany({
        where: { deletedAt: null, periode: { tahun: p.tahun, bulan: p.bulan } },
        select: { pemakaianM3: true },
      });
      const totalM3 = cmRows.reduce((s, r) => s + (r.pemakaianM3 || 0), 0);

      // ===== NEW: ringkas tagihan periode TAGIHAN dengan carry & kredit =====
      const tg = await prisma.tagihan.findMany({
        where: { deletedAt: null, periode: kPeriodeTagihan },
        select: {
          totalTagihan: true,
          tagihanLalu: true, // NEW
          sisaKurang: true, // saldo akhir (±)
          pembayarans: { select: { jumlahBayar: true } },
        },
      });

      let tagihanBulanIni = 0;
      let totalTagihanLalu = 0;
      let totalSudahBayar = 0;
      let sisaAkhirKurang = 0; // piutang (+)
      let sisaAkhirLebih = 0; // kredit (+)

      for (const r of tg) {
        tagihanBulanIni += r.totalTagihan ?? 0;
        totalTagihanLalu += r.tagihanLalu ?? 0;

        const paid = r.pembayarans.reduce(
          (a, b) => a + (b.jumlahBayar || 0),
          0
        );
        totalSudahBayar += paid;

        const saldo = hitungSaldoAkhir(
          r.totalTagihan || 0,
          r.tagihanLalu,
          paid,
          r.sisaKurang
        );
        if (saldo > 0) sisaAkhirKurang += saldo;
        else if (saldo < 0) sisaAkhirLebih += Math.abs(saldo);
      }

      const status =
        sisaAkhirKurang <= 0
          ? ("paid" as const)
          : totalSudahBayar > 0
          ? ("partial" as const)
          : ("unpaid" as const);

      // label bulan PENAGIHAN
      const periodeLabel = new Date(billY, billM - 1, 1).toLocaleDateString(
        "id-ID",
        { month: "long", year: "numeric" }
      );

      tableData.push({
        id: kPeriodeTagihan,
        periode: periodeLabel,
        totalM3,
        tagihan: tagihanBulanIni, // bulan ini saja (compatible dgn UI lama)
        sudahBayar: totalSudahBayar,
        // === NEW fields (opsional dipakai UI baru) ===
        tagihanLalu: totalTagihanLalu, // carry-in (±)
        sisaKurang: sisaAkhirKurang, // saldo akhir piutang (+)
        sisaLebih: sisaAkhirLebih, // saldo akhir kredit  (+)
        // === Legacy compatibility ===
        // Jika UI lama masih membaca "belumBayar", isi dengan piutang akhir (tanpa kredit):
        belumBayar: sisaAkhirKurang,
        status,
      });
    }

    // ==== LISTS ====

    // Top 5 pemakai (periode catat terbaru tahun ini)
    const latestPeriod = await prisma.catatPeriode.findFirst({
      where: { deletedAt: null, tahun: year },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
      select: { id: true },
    });
    let topUsers: Array<{ name: string; usage: number; address: string }> = [];
    if (latestPeriod) {
      const tops = await prisma.catatMeter.findMany({
        where: { deletedAt: null, periodeId: latestPeriod.id },
        orderBy: { pemakaianM3: "desc" },
        take: 5,
        select: {
          pemakaianM3: true,
          pelanggan: { select: { nama: true, alamat: true } },
        },
      });
      topUsers = tops.map((r) => ({
        name: r.pelanggan?.nama ?? "-",
        address: r.pelanggan?.alamat ?? "-",
        usage: r.pemakaianM3 ?? 0,
      }));
    }

    // Unpaid list (10 terbaru) — gunakan saldo akhir & hanya yang piutang
    const unpaidTagihans = await prisma.tagihan.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        totalTagihan: true,
        tagihanLalu: true, // NEW
        sisaKurang: true,
        periode: true,
        pembayarans: { select: { jumlahBayar: true } },
        pelanggan: { select: { nama: true } },
      },
    });
    const unpaidList = unpaidTagihans
      .map((t) => {
        const paid = t.pembayarans.reduce(
          (s, p) => s + (p.jumlahBayar || 0),
          0
        );
        const saldo = hitungSaldoAkhir(
          t.totalTagihan || 0,
          t.tagihanLalu,
          paid,
          t.sisaKurang
        );
        return {
          name: t.pelanggan?.nama ?? "-",
          amount: saldo,
          period: t.periode ?? "-",
        };
      })
      .filter((x) => x.amount > 0); // hanya piutang

    // Water issues (CatatMeter.kendala terbaru)
    const issues = await prisma.catatMeter.findMany({
      where: { deletedAt: null, kendala: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        kendala: true,
        updatedAt: true,
        pelanggan: { select: { nama: true } },
      },
    });
    const waterIssues = issues.map((i) => ({
      issue: `${i.kendala} - ${i.pelanggan?.nama ?? "Pelanggan"}`,
      status: "unresolved",
      date: i.updatedAt.toISOString().slice(0, 10),
    }));

    // ==== STAT CARDS + TRENDS ====
    const lastTwo = await prisma.catatPeriode.findMany({
      where: { deletedAt: null, tahun: year },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
      take: 2,
      select: { tahun: true, bulan: true },
    });

    let periodeNow: string, periodePrev: string;
    if (lastTwo.length) {
      const { y: cy, m: cm } = nextYM(lastTwo[0].tahun, lastTwo[0].bulan);
      periodeNow = `${cy}-${pad2(cm)}`;
      if (lastTwo[1]) {
        const { y: py, m: pm } = nextYM(lastTwo[1].tahun, lastTwo[1].bulan);
        periodePrev = `${py}-${pad2(pm)}`;
      } else {
        const { y: py, m: pm } = prevYM(cy, cm);
        periodePrev = `${py}-${pad2(pm)}`;
      }
    } else {
      const nowD = new Date();
      const cy = nowD.getFullYear(),
        cm = nowD.getMonth() + 1;
      const { y: py, m: pm } = prevYM(cy, cm);
      periodeNow = `${cy}-${pad2(cm)}`;
      periodePrev = `${py}-${pad2(pm)}`;
    }

    // total tagihan (sum nominal — bulan ini saja)
    async function sumTagihanInclCarry(periode: string) {
      const rows = await prisma.tagihan.findMany({
        where: { deletedAt: null, periode },
        select: { totalTagihan: true, tagihanLalu: true },
      });
      return rows.reduce((sum, r) => {
        const net = (r.totalTagihan || 0) + (r.tagihanLalu || 0);
        return sum + Math.max(net, 0); // untuk tampilan, jangan minus
      }, 0);
    }

    const totalInclCarryNow = await sumTagihanInclCarry(periodeNow);
    const totalInclCarryPrev = await sumTagihanInclCarry(periodePrev);

    // (biarkan aggregate lama untuk _count pelanggan & payingRate)
    const tagihanCurr = await prisma.tagihan.aggregate({
      where: { deletedAt: null, periode: periodeNow },
      _sum: { totalTagihan: true },
      _count: true,
    });

    const tagihanPrev = await prisma.tagihan.aggregate({
      where: { deletedAt: null, periode: periodePrev },
      _sum: { totalTagihan: true },
      _count: true,
    });

    // paying rate tetap pakai "bulan ini saja"
    const paidCurr = await prisma.pembayaran.aggregate({
      where: {
        deletedAt: null,
        tagihan: { deletedAt: null, periode: periodeNow },
      },
      _sum: { jumlahBayar: true },
    });
    const totalTagCurr = tagihanCurr._sum.totalTagihan ?? 0;
    const payingRateCurr = totalTagCurr
      ? (paidCurr._sum.jumlahBayar ?? 0) / totalTagCurr
      : 0;

    const paidPrev = await prisma.pembayaran.aggregate({
      where: {
        deletedAt: null,
        tagihan: { deletedAt: null, periode: periodePrev },
      },
      _sum: { jumlahBayar: true },
    });
    const totalTagPrev = tagihanPrev._sum.totalTagihan ?? 0;
    const payingRatePrev = totalTagPrev
      ? (paidPrev._sum.jumlahBayar ?? 0) / totalTagPrev
      : 0;

    // total pelanggan aktif
    const totalPelangganNow = await prisma.pelanggan.count({
      where: { deletedAt: null, statusAktif: true },
    });

    // saldo (piutang & kredit) per periode – pakai helper yang sudah ada di filemu
    const saldoCurr = await sumSaldoByPeriode(periodeNow);
    const saldoPrev = await sumSaldoByPeriode(periodePrev);

    const trends = {
      // === pakai metrik incl. carry untuk konsistensi dengan kartu
      totalTagihan: {
        value: Math.round(pctChange(totalInclCarryNow, totalInclCarryPrev)),
        isPositive: totalInclCarryNow >= totalInclCarryPrev,
      },
      totalBelumBayar: {
        value: Math.round(
          pctChange(saldoCurr.piutangAmount, saldoPrev.piutangAmount)
        ),
        isPositive: saldoCurr.piutangAmount <= saldoPrev.piutangAmount,
      },
      pelanggan: {
        value: Math.round(pctChange(totalPelangganNow, totalPelangganNow)),
        isPositive: true,
      },
      payingRate: {
        value: Math.round(pctChange(payingRateCurr, payingRatePrev)),
        isPositive: payingRateCurr >= payingRatePrev,
      },
      // ===== NEW: trend kredit (lebih bayar)
      totalLebihBayar: {
        value: Math.round(
          pctChange(saldoCurr.kreditAmount, saldoPrev.kreditAmount)
        ),
        isPositive: saldoCurr.kreditAmount >= saldoPrev.kreditAmount, // interpretasi tergantung kebijakanmu
      },
    };

    return NextResponse.json({
      usageData,
      billingData,
      tableData,
      topUsers,
      unpaidList,
      waterIssues,
      statCards: {
        // === UPDATED: kartu total ikut carry
        totalTagihanBulanIni: totalInclCarryNow,
        totalTagihanCount: tagihanCurr._count ?? 0,
        totalBelumBayarAmount: saldoCurr.piutangAmount,
        totalBelumBayarCount: saldoCurr.piutangCount,
        totalPelanggan: totalPelangganNow,
        payingRate: payingRateCurr,
        trends,

        // === NEW: kredit/lebih bayar (tambahan, tidak wajib dipakai UI) ===
        totalLebihBayarAmount: saldoCurr.kreditAmount,
        totalLebihBayarCount: saldoCurr.kreditCount,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
