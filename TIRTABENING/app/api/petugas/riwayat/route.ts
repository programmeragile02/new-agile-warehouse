// app/api/petugas/riwayat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserId } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isYm(v?: string | null) {
    return !!v && /^\d{4}-\d{2}$/.test(v);
}

export async function GET(req: NextRequest) {
    const prisma = await db();
    try {
        const meId = await getAuthUserId(req);
        if (!meId) {
            return NextResponse.json(
                { ok: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const sp = req.nextUrl.searchParams;
        const periode = sp.get("periode") || ""; // "YYYY-MM"
        const q = (sp.get("q") || "").trim().toLowerCase();

        // pagination params (optional)
        const page = Math.max(1, Number(sp.get("page") || "1"));
        const pageSize = Math.max(
            1,
            Math.min(200, Number(sp.get("pageSize") || "20"))
        );
        const skip = (page - 1) * pageSize;
        const take = pageSize;

        // 1) ambil daftar zona yang dipegang petugas login
        const myZones = await prisma.zona.findMany({
            where: { petugasId: meId },
            select: { id: true },
        });
        const myZoneIds = new Set(myZones.map((z) => z.id));
        if (myZoneIds.size === 0) {
            return NextResponse.json({
                ok: true,
                items: [],
                pagination: { page, pageSize, total: 0, totalPages: 0 },
                periods: [],
            });
        }

        // 2) build where-periode + base where
        const baseWhere: any = {
            deletedAt: null,
            status: "DONE",
            zonaIdSnapshot: { in: Array.from(myZoneIds) },
        };
        if (isYm(periode)) {
            baseWhere.periode = { kodePeriode: periode };
        }

        // 3) total count for pagination
        const total = await prisma.catatMeter.count({
            where: baseWhere,
        });

        // 4) fetch rows with pagination
        const rows = await prisma.catatMeter.findMany({
            where: baseWhere,
            select: {
                id: true,
                meterAwal: true,
                meterAkhir: true,
                pemakaianM3: true,
                total: true,
                kendala: true,
                createdAt: true,
                periode: { select: { kodePeriode: true } },
                pelanggan: {
                    select: { nama: true, zona: { select: { nama: true } } },
                },
                zonaNamaSnapshot: true,
            },
            orderBy: [{ createdAt: "desc" }],
            skip,
            take,
        });

        // 5) compute distinct periods available — safer approach:
        //    query periode codes from catatMeter directly (avoid prisma.periode model assumptions)
        const periodRows = await prisma.catatMeter.findMany({
            where: {
                deletedAt: null,
                status: "DONE",
                zonaIdSnapshot: { in: Array.from(myZoneIds) },
            },
            select: { periode: { select: { kodePeriode: true } } },
            orderBy: [{ createdAt: "desc" }], // newest entries first so we get recent periods first
            take: 1000, // guard: limit how many rows we scan
        });

        const periodSet = new Set<string>();
        for (const p of periodRows) {
            const k = p.periode?.kodePeriode;
            if (k) periodSet.add(k);
        }
        // Turn into descending-sorted array (YYYY-MM lexical sort works)
        const periodList = Array.from(periodSet).sort((a, b) =>
            b.localeCompare(a)
        );

        // 6) mapping + filter q (q is applied client-side as before)
        const mapped = rows.map((r) => ({
            id: r.id,
            tanggal: r.createdAt.toISOString(),
            periode: r.periode?.kodePeriode ?? "-",
            zona: r.zonaNamaSnapshot ?? r.pelanggan?.zona?.nama ?? "-",
            pelanggan: r.pelanggan?.nama ?? "-",
            meterAwal: r.meterAwal,
            meterAkhir: r.meterAkhir,
            pakai: r.pemakaianM3,
            total: r.total,
            status: "DONE",
            kendala: r.kendala ?? null,
        }));

        // apply q filter (text search) — same behavior as previously
        const filtered = mapped.filter((it) => {
            if (!q) return true;
            const s = `${it.periode} ${it.zona} ${it.pelanggan} ${
                it.kendala ?? ""
            }`.toLowerCase();
            return s.includes(q);
        });

        const pagination = {
            page,
            pageSize: take,
            total,
            totalPages: Math.max(1, Math.ceil(total / take)),
        };

        return NextResponse.json({
            ok: true,
            items: filtered,
            pagination,
            periods: periodList,
        });
    } catch (e: any) {
        console.error("riwayat petugas error:", e);
        return NextResponse.json(
            { ok: false, message: e?.message || "Gagal memuat riwayat" },
            { status: 500 }
        );
    }
}
