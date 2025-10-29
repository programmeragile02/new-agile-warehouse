// app/api/laporan-summary/years/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Mengembalikan daftar tahun yang ada di sistem.
 * Sumber utama: Tagihan.periode ("YYYY-MM" / "MMM YYYY" dll).
 * Fallback selalu menyertakan tahun berjalan.
 */
export async function GET() {
    const prisma = await db();
    try {
        // Ambil distinct periode dari Tagihan agar ringan
        const periods = await prisma.tagihan.findMany({
            where: { deletedAt: null, periode: { not: null } },
            select: { periode: true },
            distinct: ["periode"],
            orderBy: { createdAt: "desc" },
            take: 5000, // pengaman
        });

        const years = new Set<number>();

        // helper parse berbagai format
        const parseYear = (s: string | null | undefined): number | null => {
            if (!s) return null;
            const t = s.trim();

            // format "YYYY-MM" / "YYYY-M"
            let m = /^(\d{4})[-/](\d{1,2})$/.exec(t);
            if (m) {
                const y = Number(m[1]);
                if (y >= 2000 && y <= 2100) return y;
            }

            // format "MMM YYYY" (Jan 2025)
            m = /^([A-Za-z]{3,})\s+(\d{4})$/.exec(t);
            if (m) {
                const y = Number(m[2]);
                if (y >= 2000 && y <= 2100) return y;
            }

            // format "MM YYYY" (10 2025) atau "YYYY"
            m = /^(\d{4})$/.exec(t) || /^(\d{1,2})\s+(\d{4})$/.exec(t);
            if (m) {
                const y = Number(m[m.length - 1]);
                if (y >= 2000 && y <= 2100) return y;
            }

            return null;
        };

        for (const p of periods) {
            const y = parseYear(p.periode || "");
            if (y) years.add(y);
        }

        // selalu sertakan tahun berjalan
        const nowY = new Date().getFullYear();
        years.add(nowY);

        // sort desc
        const result = Array.from(years).sort((a, b) => b - a);

        return NextResponse.json({ ok: true, years: result });
    } catch (e: any) {
        console.error("GET /api/laporan-summary/years error:", e);
        // fallback minimal tahun berjalan
        return NextResponse.json(
            { ok: true, years: [new Date().getFullYear()] },
            { status: 200 }
        );
    }
}
