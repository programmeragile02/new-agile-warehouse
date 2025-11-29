// app/api/kendala/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// kalau re-export helper terlalu ribet, duplikasi kecil ini juga boleh:
function mapPriorityEnumToUi(p: any): "high" | "medium" | "low" {
    if (p === "HIGH") return "high";
    if (p === "LOW") return "low";
    return "medium";
}
function mapStatusEnumToUi(s: any): "unresolved" | "solved" {
    return s === "SOLVED" ? "solved" : "unresolved";
}
function mapSourceEnumToUi(
    s: any
): "meter_reading" | "meter_reading_blok" | "manual_report" {
    if (s === "METER_READING") return "meter_reading";
    if (s === "METER_READING_BLOK") return "meter_reading_blok";
    return "manual_report";
}

function mapKendalaRow(row: any) {
    const reportedDate = row.reportedAt
        ? new Date(row.reportedAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

    return {
        id: row.id,
        issue: row.issue,
        description: row.description ?? "",
        status: mapStatusEnumToUi(row.status),
        date: reportedDate,
        reporter: row.reporterName || row.pelanggan?.nama || "Pelanggan",
        phone: row.reporterPhone || row.pelanggan?.wa || "",
        address: row.reporterAddress || row.pelanggan?.alamat || "",
        priority: mapPriorityEnumToUi(row.priority),
        solvedDate: row.solvedAt
            ? new Date(row.solvedAt).toISOString().slice(0, 10)
            : null,
        solution: row.solution ?? null,
        customerId: row.pelanggan?.kode ?? null,
        source: mapSourceEnumToUi(row.source),
    };
}

/**
 * PATCH /api/kendala/[id]
 * Body JSON: { solution: string }
 */
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const prisma = await db();
    const id = params.id;

    try {
        const body = await req.json().catch(() => ({}));
        const { solution } = body as { solution?: string };

        if (!solution || !solution.trim()) {
            return NextResponse.json(
                { error: "Solusi wajib diisi" },
                { status: 400 }
            );
        }

        const existing = await prisma.kendalaAir.findUnique({
            where: { id },
            include: {
                pelanggan: {
                    select: { kode: true, nama: true, wa: true, alamat: true },
                },
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Kendala tidak ditemukan" },
                { status: 404 }
            );
        }

        const updated = await prisma.kendalaAir.update({
            where: { id },
            data: {
                status: "SOLVED",
                solution: solution.trim(),
                solvedAt: new Date(),
            },
            include: {
                pelanggan: {
                    select: { kode: true, nama: true, wa: true, alamat: true },
                },
            },
        });

        const item = mapKendalaRow(updated);
        return NextResponse.json({ item });
    } catch (e: any) {
        console.error("[API] /api/kendala/[id] PATCH error:", e);
        return NextResponse.json(
            { error: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
