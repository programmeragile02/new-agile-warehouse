// app/api/kendala/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Priority = "high" | "medium" | "low";
type StatusUi = "unresolved" | "solved";
type SourceUi = "meter_reading" | "meter_reading_blok" | "manual_report";

export interface WaterIssueDto {
    id: string;
    issue: string;
    description: string;
    status: StatusUi;
    date: string; // YYYY-MM-DD
    reporter: string;
    phone: string;
    address: string;
    priority: Priority;
    solvedDate: string | null;
    solution: string | null;
    customerId: string | null; // kode pelanggan (bukan id)
    source: SourceUi;
}

/** Heuristic priority untuk catat meter */
function inferPriority(text?: string | null): Priority {
    if (!text) return "medium";
    const t = text.toLowerCase();
    if (
        /(bocor parah|pipa pecah|banjir|air mati total|meter rusak berat)/.test(
            t
        )
    )
        return "high";
    if (/(bocor|meter rusak|tekanan rendah|rembes|mampet)/.test(t))
        return "medium";
    return "low";
}

/** Map enum DB → UI string */
function mapPriorityEnumToUi(p: any): Priority {
    if (p === "HIGH") return "high";
    if (p === "LOW") return "low";
    return "medium";
}

function mapPriorityUiToEnum(p: Priority): "HIGH" | "MEDIUM" | "LOW" {
    if (p === "high") return "HIGH";
    if (p === "low") return "LOW";
    return "MEDIUM";
}

function mapStatusEnumToUi(s: any): StatusUi {
    return s === "SOLVED" ? "solved" : "unresolved";
}

function mapSourceEnumToUi(s: any): SourceUi {
    if (s === "METER_READING") return "meter_reading";
    if (s === "METER_READING_BLOK") return "meter_reading_blok";
    return "manual_report";
}

/** Map dari tabel KendalaAir → WaterIssueDto */
function mapKendalaRow(row: any): WaterIssueDto {
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

/** Map dari CatatMeter / CatatMeterBlok → WaterIssueDto (virtual) */
function mapIssueFromReading(row: any, source: SourceUi): WaterIssueDto {
    const pelanggan = row?.pelanggan ?? {};
    const created = row?.updatedAt ?? row?.createdAt ?? new Date();
    const kendala = row?.kendala ?? "";
    const date = new Date(created).toISOString().slice(0, 10);

    return {
        id: `${source}-${row.id}`,
        issue:
            kendala?.split("\n")[0]?.slice(0, 120) ||
            "Kendala dari catat meter",
        description: kendala || "",
        reporter: pelanggan?.nama || "Pelanggan",
        phone: pelanggan?.wa || "",
        address: pelanggan?.alamat || "",
        priority: inferPriority(kendala),
        status: "unresolved",
        source,
        date,
        solution: null,
        solvedDate: null,
        customerId: pelanggan?.kode ?? null,
    };
}

/**
 * GET /api/kendala
 * Optional query:
 *   - periode=YYYY-MM (limit ke periode)
 *   - customerCode=KODE_PELANGGAN (untuk dashboard warga)
 */
export async function GET(req: Request) {
    const prisma = await db();

    try {
        const { searchParams } = new URL(req.url);
        const periodeParam = searchParams.get("periode") ?? undefined;
        const customerCode =
            searchParams.get("customerCode") ??
            searchParams.get("customerId") ??
            undefined;

        // ---- Manual Kendala dari tabel KendalaAir ----
        const kendalaWhere: any = {};
        if (customerCode) {
            kendalaWhere.pelanggan = { kode: customerCode };
        }
        const kendalaManual = await prisma.kendalaAir.findMany({
            where: kendalaWhere,
            include: {
                pelanggan: {
                    select: {
                        id: true,
                        kode: true,
                        nama: true,
                        wa: true,
                        alamat: true,
                    },
                },
            },
            orderBy: { reportedAt: "desc" },
            take: 500,
        });

        const manualItems: WaterIssueDto[] = kendalaManual.map(mapKendalaRow);

        // ---- Kendala dari CatatMeter ----
        const whereCatat: any = {
            deletedAt: null,
            NOT: [{ kendala: null }, { kendala: "" }],
        };
        if (periodeParam) {
            const [yStr, mStr] = periodeParam.split("-");
            whereCatat.periode = {
                tahun: Number(yStr),
                bulan: Number(mStr),
            };
        }
        if (customerCode) {
            whereCatat.pelanggan = { kode: customerCode };
        }

        const cm = await prisma.catatMeter.findMany({
            where: whereCatat,
            orderBy: [
                { periode: { tahun: "desc" } },
                { periode: { bulan: "desc" } },
                { updatedAt: "desc" },
            ],
            select: {
                id: true,
                kendala: true,
                updatedAt: true,
                createdAt: true,
                pelanggan: {
                    select: { nama: true, wa: true, alamat: true, kode: true },
                },
            },
            take: 500,
        });

        // ---- Kendala dari CatatMeterBlok ----
        const whereBlok: any = {
            deletedAt: null,
            NOT: [{ kendala: null }, { kendala: "" }],
        };
        if (periodeParam) {
            const [yStr, mStr] = periodeParam.split("-");
            whereBlok.periode = {
                tahun: Number(yStr),
                bulan: Number(mStr),
            };
        }
        if (customerCode) {
            whereBlok.pelanggan = { kode: customerCode };
        }

        const cmb = await prisma.catatMeterBlok.findMany({
            where: whereBlok,
            orderBy: [
                { periode: { tahun: "desc" } },
                { periode: { bulan: "desc" } },
                { updatedAt: "desc" },
            ],
            select: {
                id: true,
                kendala: true,
                updatedAt: true,
                createdAt: true,
                pelanggan: {
                    select: { nama: true, wa: true, alamat: true, kode: true },
                },
            },
            take: 500,
        });

        const fromCatat = cm.map((r) =>
            mapIssueFromReading(r, "meter_reading")
        );
        const fromBlok = cmb.map((r) =>
            mapIssueFromReading(r, "meter_reading_blok")
        );

        // gabungkan
        const items: WaterIssueDto[] = [
            ...manualItems,
            ...fromCatat,
            ...fromBlok,
        ];

        return NextResponse.json({ items });
    } catch (e: any) {
        console.error("[API] /api/kendala GET error:", e);
        return NextResponse.json(
            { error: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/kendala
 * Body JSON (admin atau warga):
 * {
 *   issue: string
 *   description?: string
 *   priority: "high" | "medium" | "low"
 *   reporter?: string
 *   phone?: string
 *   address?: string
 *   customerCode?: string  // KODE pelanggan, bukan id. Optional.
 * }
 */
export async function POST(req: Request) {
    const prisma = await db();

    try {
        const body = await req.json().catch(() => ({}));
        const {
            issue,
            description,
            priority = "medium",
            reporter,
            phone,
            address,
            customerCode,
            customerId,
        } = body as {
            issue?: string;
            description?: string;
            priority?: Priority;
            reporter?: string;
            phone?: string;
            address?: string;
            customerCode?: string;
            customerId?: string; // alias, kalau FE masih kirim ini
        };

        const kodePelanggan = customerCode ?? customerId;

        if (!issue || !issue.trim()) {
            return NextResponse.json(
                { error: "Judul kendala (issue) wajib diisi" },
                { status: 400 }
            );
        }

        // cari pelanggan (opsional)
        let pelanggan: any = null;
        if (kodePelanggan) {
            pelanggan = await prisma.pelanggan.findFirst({
                where: { kode: kodePelanggan, deletedAt: null },
                select: {
                    id: true,
                    kode: true,
                    nama: true,
                    wa: true,
                    alamat: true,
                },
            });
        }

        const created = await prisma.kendalaAir.create({
            data: {
                issue: issue.trim(),
                description: description?.trim() || null,
                priority: mapPriorityUiToEnum(priority as Priority),
                status: "UNRESOLVED",
                source: "MANUAL_REPORT",
                reporterName: reporter || pelanggan?.nama || null,
                reporterPhone: phone || pelanggan?.wa || null,
                reporterAddress: address || pelanggan?.alamat || null,
                reportedAt: new Date(),
                pelangganId: pelanggan?.id ?? null,
            },
            include: {
                pelanggan: {
                    select: {
                        id: true,
                        kode: true,
                        nama: true,
                        wa: true,
                        alamat: true,
                    },
                },
            },
        });

        const item = mapKendalaRow(created);
        return NextResponse.json({ item }, { status: 201 });
    } catch (e: any) {
        console.error("[API] /api/kendala POST error:", e);
        return NextResponse.json(
            { error: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
