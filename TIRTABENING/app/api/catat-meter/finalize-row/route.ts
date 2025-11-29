import { NextRequest, NextResponse } from "next/server";
import { CatatStatus } from "@prisma/client";
import { randomToken } from "@/lib/auth-utils";
import puppeteer from "puppeteer";
import { getWaTargets } from "@/lib/wa-targets";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/* ======================= Helpers periode ======================= */
function prevPeriod(code: string) {
    const [y, m] = code.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    d.setMonth(d.getMonth() - 1);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yy}-${mm}`;
}
function nextPeriod(code: string) {
    const [y, m] = code.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    d.setMonth(d.getMonth() + 1);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yy}-${mm}`;
}

/* ======================= Helpers existing ======================= */
function getAppOrigin(req: NextRequest | undefined) {
    // accept either NextRequest or undefined — fallback env
    const h = (req as any)?.headers;
    return (
        process.env.APP_ORIGIN ||
        process.env.NEXT_PUBLIC_APP_URL ||
        (h && h.get("origin")) ||
        `${h && (h.get("x-forwarded-proto") || "http")}://${
            (h && (h.get("x-forwarded-host") || h.get("host"))) || ""
        }`
    )?.replace(/\/$/, "");
}
function formatRp(n: number) {
    return "Rp " + Number(n || 0).toLocaleString("id-ID");
}
function fmtTanggalID(d: Date) {
    return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

/* ======================= Pesan WA ======================= */
function waText(p: {
    setting?: {
        namaPerusahaan?: string | null;
        telepon?: string | null;
        email?: string | null;
        alamat?: string | null;
        anNorekPembayaran?: string | null;
        namaBankPembayaran?: string | null;
        namaBendahara?: string | null;
        norekPembayaran?: string | null;
        whatsappCs?: string | null;
    };
    nama?: string;
    kode?: string;
    periode: string; // periode billing (+1)
    meterAwal: number;
    meterAkhir: number;
    pemakaian: number;
    tarifPerM3: number;
    abonemen: number;
    biayaAdmin: number;
    total: number;
    due: Date;
    pdfUrl?: string;
    tagihanLalu: number;
    tagihanBulanIni: number;
    sisaKurang?: number;
    tglCatat?: Date; // hanya untuk ditampilkan
}) {
    const perusahaan = p.setting?.namaPerusahaan || "NataBanyu";
    const bulan = new Date(p.periode + "-01").toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
    });
    const bayarLines = [
        `• Tunai ke bendahara (${p.setting?.namaBendahara}).`,
        `• Transfer ke Rekening ${p.setting?.namaBankPembayaran} ${p.setting?.norekPembayaran} a.n. ${p.setting?.anNorekPembayaran}.`,
    ].join("\n");
    const kontakLine = [
        p.setting?.whatsappCs
            ? `WhatsApp:\nKlik nomor berikut -> ${p.setting.whatsappCs}`
            : null,
    ]
        .filter(Boolean)
        .join("\n");

    const totalGabungan = (p.tagihanLalu || 0) + (p.tagihanBulanIni || 0);
    const renderSisaKurangText = (n: number) =>
        n > 0
            ? `Kurang ${formatRp(n)}`
            : n < 0
            ? `Sisa ${formatRp(Math.abs(n))}`
            : "Rp 0";

    const sections: string[] = [];
    sections.push(
        [
            `Kepada pelanggan ${perusahaan} yang terhormat,\n`,
            `Tagihan Air Bulan ${bulan}`,
            p.nama ? `Pelanggan: *${p.nama}*` : undefined,
        ]
            .filter(Boolean)
            .join("\n")
    );
    sections.push(
        [
            "*Ringkasan*",
            `• Tagihan Bulan Lalu: ${renderSisaKurangText(p.tagihanLalu)}`,
            `• Tagihan Bulan Ini: ${formatRp(p.tagihanBulanIni)}`,
            `• *Total Tagihan: ${formatRp(totalGabungan)}*`,
            `• Batas Bayar: *${fmtTanggalID(p.due)}*`,
        ].join("\n")
    );
    sections.push(
        [
            "*Rincian*",
            p.tglCatat
                ? `• Tanggal Catat: ${fmtTanggalID(p.tglCatat)}`
                : undefined,
            `• Meter Awal: ${p.meterAwal}`,
            `• Meter Akhir: ${p.meterAkhir}`,
            `• Pemakaian: ${p.pemakaian} m³`,
            `• Tarif/m³: ${formatRp(p.tarifPerM3)}`,
            `• Abonemen: ${formatRp(p.abonemen)}`,
            `• Tagihan Bulan Ini: ${formatRp(p.tagihanBulanIni)}`,
            `• Tagihan Bulan Lalu: ${renderSisaKurangText(p.tagihanLalu)}`,
            "—",
            `*Total Tagihan: ${formatRp(totalGabungan)}*`,
        ]
            .filter(Boolean)
            .join("\n")
    );
    sections.push(["*Cara Pembayaran*", bayarLines].join("\n"));
    if (kontakLine) sections.push(["*Bantuan*", kontakLine].join("\n"));
    sections.push("Terima kasih 🙏");
    sections.push(
        [
            "*NOTE:*",
            `Setelah melakukan Transfer, silahkan konfirmasi ke nomor ${p.setting?.whatsappCs}\n\nAtau`,
        ].join("\n")
    );

    return sections.map((s) => s.replace(/[ \t]+$/g, "")).join("\n\n");
}

/* ======= helper: resolve clientId ======= */
async function resolveClientIdForCompany(
    prismaInstance: any,
    companyId?: string
) {
    if (!companyId) return null;
    try {
        const row = await prismaInstance.mstCompany.findUnique({
            where: { company_id: companyId },
            select: { wa_client_id: true },
        });
        if (row?.wa_client_id) return String(row.wa_client_id);
    } catch (err) {
        console.warn("resolveClientIdForCompany error:", String(err));
    }
    return `tenant_${companyId}`;
}

/* ======= sendWaAndLog (tenant-aware, verbose logging of WA-sender response) ======= */
async function sendWaAndLog(
    tujuanRaw: string,
    text: string,
    companyIdMaybe?: string
) {
    const prisma = await db();

    const to = tujuanRaw.replace(/\D/g, "").replace(/^0/, "62");
    const base = (process.env.WA_SENDER_URL || "").replace(/\/$/, "");
    const apiKey = process.env.WA_SENDER_API_KEY || "";

    // prepare waLog entry first (PENDING)
    const log = await prisma.waLog.create({
        data: {
            tujuan: to,
            tipe: "TAGIHAN",
            payload: JSON.stringify({ to, text }),
            status: "PENDING",
        },
    });

    if (!base) {
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                payload: JSON.stringify({
                    to,
                    text,
                    err: "WA_SENDER_URL not set",
                }),
            },
        });
        return { ok: false, reason: "WA_SENDER_URL not set" };
    }

    // resolve clientId for header
    let clientId: string | null = null;
    if (companyIdMaybe) {
        clientId = await resolveClientIdForCompany(prisma, companyIdMaybe);
    }

    const url = `${base}/send`;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
    };
    if (clientId) headers["x-client-id"] = clientId;

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15000); // 15s timeout for safety

    try {
        const r = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ to, text }),
            signal: ac.signal,
        });
        const bodyText = await r.text().catch(() => "");
        // try parse json if possible
        let bodyJson: any = null;
        try {
            bodyJson = JSON.parse(bodyText);
        } catch {}

        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: r.ok ? "SENT" : "FAILED",
                payload: JSON.stringify({
                    to,
                    text,
                    http: {
                        ok: r.ok,
                        status: r.status,
                        bodyText: bodyText.slice(0, 20000),
                    },
                    clientId: clientId || null,
                }),
            },
        });

        clearTimeout(t);
        return { ok: r.ok, status: r.status, body: bodyJson ?? bodyText };
    } catch (err: any) {
        clearTimeout(t);
        const emsg = String(err?.message || err);
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                payload: JSON.stringify({
                    to,
                    text,
                    err: emsg,
                    clientId: clientId || null,
                }),
            },
        });
        return { ok: false, reason: emsg };
    }
}

/* ======= sendWaImageAndLog (tenant-aware, verbose logging) ======= */
async function sendWaImageAndLog(
    tujuanRaw: string,
    tagihanId: string,
    caption?: string,
    forwardHeaders?: Record<string, string> | undefined,
    companyIdMaybe?: string,
    bufferMaybe?: Buffer | null // optional, kalau caller punya buffer, bisa pass
) {
    const prisma = await db();

    const to = tujuanRaw.replace(/\D/g, "").replace(/^0/, "62");
    const base = (process.env.WA_SENDER_URL || "").replace(/\/$/, "");
    const apiKey = process.env.WA_SENDER_API_KEY || "";

    const initialPayload = { to, tagihanId, caption };
    const log = await prisma.waLog.create({
        data: {
            tujuan: to,
            tipe: "TAGIHAN_IMG",
            payload: JSON.stringify(initialPayload),
            status: "PENDING",
        },
    });

    if (!base) {
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                payload: JSON.stringify({
                    ...initialPayload,
                    err: "WA_SENDER_URL not set",
                }),
            },
        });
        return { ok: false, reason: "WA_SENDER_URL not set" };
    }

    // Puppeteer + screenshot logic (re-use your previous code)
    let browser: puppeteer.Browser | null = null;
    let buffer: Buffer | null = null;
    try {
        // --- Puppeteer launch (copy your existing safe launch logic) ---
        const commonArgs = [
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
        ];
        const baseLaunch: any = {
            headless: true,
            args: [...commonArgs],
            executablePath: process.env.CHROME_PATH || undefined,
            timeout: 60_000,
        };
        const forceNoSandbox = !!process.env.FORCE_PUPPETEER_NO_SANDBOX;
        if (!forceNoSandbox) {
            try {
                browser = await puppeteer.launch(baseLaunch);
            } catch {}
        }
        if (!browser) {
            browser = await puppeteer.launch({
                ...baseLaunch,
                args: [
                    ...baseLaunch.args,
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                ],
            });
        }

        const page = await browser.newPage();
        // forward headers / cookies (optional)
        if (forwardHeaders && Object.keys(forwardHeaders).length > 0) {
            try {
                await page.setExtraHTTPHeaders(
                    forwardHeaders as Record<string, string>
                );
            } catch {}
            const cookieHeader =
                forwardHeaders["cookie"] || forwardHeaders["Cookie"];
            if (cookieHeader) {
                try {
                    const urlForCookie =
                        process.env.APP_ORIGIN ||
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "http://localhost:3000";
                    const parts = cookieHeader
                        .split(";")
                        .map((s) => s.trim())
                        .filter(Boolean);
                    for (const p of parts) {
                        const idx = p.indexOf("=");
                        const name =
                            idx > -1 ? p.slice(0, idx).trim() : p.trim();
                        const value = idx > -1 ? p.slice(idx + 1).trim() : "";
                        if (!name) continue;
                        try {
                            await page.setCookie({
                                name,
                                value,
                                url: urlForCookie,
                                path: "/",
                            });
                        } catch {}
                    }
                } catch {}
            }
        }

        await page.setViewport({
            width: 380,
            height: 800,
            deviceScaleFactor: 2,
        });
        const origin =
            process.env.APP_ORIGIN ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "http://localhost:3000";
        await page.goto(`${origin}/print/tagihan/${tagihanId}?compact=1`, {
            waitUntil: "networkidle0",
            timeout: 60000,
        });
        await page
            .waitForSelector(".paper", { visible: true, timeout: 20000 })
            .catch(() => {});
        await page.evaluate(() => {
            try {
                (document.body as any).style.background = "#ffffff";
            } catch {}
        });

        buffer = await page.screenshot({
            type: "jpeg",
            quality: 75,
            fullPage: true,
        });
        try {
            await page.close();
        } catch {}
        try {
            await browser.close();
        } catch {}
        browser = null;
    } catch (e: any) {
        const emsg = String(e?.stack || e?.message || e);
        console.error("screenshot error:", emsg);
        if (browser) {
            try {
                await browser.close();
            } catch {}
        }
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                payload: JSON.stringify({ ...initialPayload, err: emsg }),
            },
        });
        return { ok: false, reason: emsg };
    }

    // now we have buffer (or caller may pass bufferMaybe; prefer that)
    if (!buffer && bufferMaybe) buffer = bufferMaybe;
    if (!buffer) {
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                payload: JSON.stringify({
                    ...initialPayload,
                    err: "No image buffer",
                }),
            },
        });
        return { ok: false, reason: "No image buffer" };
    }

    // Build body: prefer to send as base64 only if small enough; still record size
    const base64 = buffer.toString("base64");
    const sizeBytes = Buffer.byteLength(base64, "base64");
    // If base64 size is too big for comfort, log and still try (but earlier you should increase express.json limit)
    if (sizeBytes > 5_000_000) {
        // ~5MB base64 threshold (approx)
        console.warn("sendWaImageAndLog: large base64 size:", sizeBytes);
    }

    // Resolve clientId
    let clientId: string | null = null;
    if (companyIdMaybe)
        clientId = await resolveClientIdForCompany(prisma, companyIdMaybe);

    // prepare headers
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
    };
    if (clientId) headers["x-client-id"] = clientId;

    // send to WA sender
    try {
        const r = await fetch(`${base}/send-image`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                to,
                base64,
                filename: `tagihan-${tagihanId}.jpg`,
                caption,
                mimeType: "image/jpeg",
            }),
        });

        const bodyText = await r.text().catch(() => "");
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: r.ok ? "SENT" : "FAILED",
                payload: JSON.stringify({
                    to,
                    tagihanId,
                    clientId: clientId || null,
                    http: {
                        ok: r.ok,
                        status: r.status,
                        bodyText: bodyText.slice(0, 20000),
                    },
                }),
            },
        });

        return { ok: r.ok, status: r.status, body: bodyText };
    } catch (err: any) {
        const emsg = String(err?.message || err);
        await prisma.waLog.update({
            where: { id: log.id },
            data: {
                status: "FAILED",
                payload: JSON.stringify({
                    to,
                    tagihanId,
                    err: emsg,
                    clientId: clientId || null,
                }),
            },
        });
        return { ok: false, reason: emsg };
    }
}

/* ======================= FINALIZE ROW ======================= */
export async function POST(req: NextRequest) {
    const prisma = await db();
    try {
        const { id, sendWa }: { id?: string; sendWa?: boolean } =
            await req.json();
        if (!id)
            return NextResponse.json(
                { ok: false, message: "id wajib" },
                { status: 400 }
            );

        const row = await prisma.catatMeter.findUnique({
            where: { id },
            include: {
                periode: true,
                pelanggan: {
                    select: {
                        id: true,
                        nama: true,
                        kode: true,
                        wa: true,
                        wa2: true,
                        userId: true,
                        user: {
                            select: {
                                companyId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!row || row.deletedAt)
            return NextResponse.json(
                { ok: false, message: "Data tidak ditemukan" },
                { status: 404 }
            );
        if (row.periode.isLocked)
            return NextResponse.json(
                { ok: false, message: "Periode sudah dikunci" },
                { status: 423 }
            );
        if (row.isLocked)
            return NextResponse.json({
                ok: true,
                locked: true,
                message: "Row sudah dikunci",
            });

        const periodeStr = row.periode.kodePeriode; // "YYYY-MM" (bulan catat)
        const setting = await prisma.setting.findUnique({ where: { id: 1 } });
        if (!setting)
            return NextResponse.json(
                { ok: false, message: "Setting tidak ditemukan" },
                { status: 500 }
            );

        // Periode tagihan = +1 bulan
        const billingPeriode = nextPeriod(periodeStr);

        // Hitung total
        const akhir = Math.max(row.meterAkhir ?? row.meterAwal, row.meterAwal);
        const pem = Math.max(0, akhir - row.meterAwal);
        const tarif = row.tarifPerM3 ?? row.periode.tarifPerM3 ?? 0;
        const abon = row.abonemen ?? row.periode.abonemen ?? 0;
        const biayaAdmin = setting.biayaAdmin ?? 0;
        const total = tarif * pem + abon + biayaAdmin;

        // Due date
        const [yy, mm] = billingPeriode.split("-").map(Number);
        const day = Math.min(
            Math.max(1, setting.tglJatuhTempo ?? 15),
            new Date(yy, mm, 0).getDate()
        );
        const due = new Date(yy, mm - 1, day, 12, 0, 0, 0);

        // Carry-over
        const prevCode = prevPeriod(billingPeriode);
        const prevBill = await prisma.tagihan.findUnique({
            where: {
                pelangganId_periode: {
                    pelangganId: row.pelangganId,
                    periode: prevCode,
                },
            },
            select: { sisaKurang: true },
        });
        const carryFromPrev = prevBill?.sisaKurang ?? 0;

        // Timestamp tampilan WA
        const now = new Date();

        // Transaksi DB
        const { periodeId, pelanggan, tagihan } = await prisma.$transaction(
            async (tx) => {
                const updated = await tx.catatMeter.update({
                    where: { id: row.id },
                    data: {
                        isLocked: true,
                        status: CatatStatus.DONE,
                        meterAkhir: akhir,
                        pemakaianM3: pem,
                        total,
                        tarifPerM3: tarif,
                        abonemen: abon,
                    },
                    select: { periodeId: true },
                });

                const paidAgg = await tx.pembayaran.aggregate({
                    where: {
                        tagihan: {
                            pelangganId: row.pelangganId,
                            periode: billingPeriode,
                        },
                        deletedAt: null,
                    },
                    _sum: { jumlahBayar: true },
                });
                const alreadyPaid = paidAgg._sum.jumlahBayar ?? 0;

                const t = await tx.tagihan.upsert({
                    where: {
                        pelangganId_periode: {
                            pelangganId: row.pelangganId,
                            periode: billingPeriode,
                        },
                    },
                    update: {
                        tarifPerM3: tarif,
                        abonemen: abon,
                        totalTagihan: total,
                        denda: 0,
                        tagihanLalu: carryFromPrev,
                        sisaKurang: total + carryFromPrev - alreadyPaid,
                        statusBayar:
                            total + carryFromPrev - alreadyPaid <= 0
                                ? "PAID"
                                : "UNPAID",
                        statusVerif: "UNVERIFIED",
                        tglJatuhTempo: due,
                        catatMeterId: row.id,
                        belumBayar: total,
                    },
                    create: {
                        pelangganId: row.pelangganId,
                        periode: billingPeriode,
                        tarifPerM3: tarif,
                        abonemen: abon,
                        totalTagihan: total,
                        denda: 0,
                        tagihanLalu: carryFromPrev,
                        sisaKurang: total + carryFromPrev - alreadyPaid,
                        statusBayar:
                            total + carryFromPrev - alreadyPaid <= 0
                                ? "PAID"
                                : "UNPAID",
                        statusVerif: "UNVERIFIED",
                        tglJatuhTempo: due,
                        catatMeterId: row.id,
                        belumBayar: total,
                    },
                });

                const agg = await tx.catatMeter.groupBy({
                    by: ["status"],
                    where: { periodeId: updated.periodeId, deletedAt: null },
                    _count: { _all: true },
                });

                const selesai =
                    agg.find((a) => a.status === CatatStatus.DONE)?._count
                        ._all ?? 0;
                const pending =
                    agg.find((a) => a.status === CatatStatus.PENDING)?._count
                        ._all ?? 0;

                const unlockedCount = await tx.catatMeter.count({
                    where: {
                        periodeId: updated.periodeId,
                        deletedAt: null,
                        isLocked: false,
                    },
                });

                const allLocked =
                    pending === 0 && selesai > 0 && unlockedCount === 0;

                await tx.catatPeriode.update({
                    where: { id: updated.periodeId },
                    data: {
                        totalPelanggan: selesai + pending,
                        selesai,
                        pending,
                        ...(allLocked
                            ? {
                                  status: "FINAL",
                                  isLocked: true,
                                  lockedAt: new Date(),
                              }
                            : {}),
                    },
                });

                const nextCode = nextPeriod(billingPeriode);
                const nextExists = await tx.tagihan.findUnique({
                    where: {
                        pelangganId_periode: {
                            pelangganId: row.pelangganId,
                            periode: nextCode,
                        },
                    },
                    select: { id: true, totalTagihan: true },
                });
                if (nextExists) {
                    await tx.tagihan.update({
                        where: { id: nextExists.id },
                        data: {
                            tagihanLalu: t.sisaKurang,
                            sisaKurang: nextExists.totalTagihan + t.sisaKurang,
                            statusBayar:
                                nextExists.totalTagihan + t.sisaKurang <= 0
                                    ? "PAID"
                                    : "UNPAID",
                        },
                    });
                }

                return {
                    periodeId: updated.periodeId,
                    pelanggan: row.pelanggan,
                    tagihan: t,
                };
            }
        );

        // === Magic link user WARGA ===
        let userId = pelanggan.userId as string | undefined;
        if (!userId) {
            const username = pelanggan.kode;
            const pwd = randomToken(12);
            const user = await prisma.user.create({
                data: {
                    username,
                    passwordHash: pwd,
                    name: pelanggan.nama,
                    phone: pelanggan.wa ?? null,
                    role: "WARGA",
                    isActive: true,
                },
                select: { id: true },
            });
            userId = user.id;
            await prisma.pelanggan.update({
                where: { id: pelanggan.id },
                data: { userId },
            });
        }

        const token = randomToken(32);
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        await prisma.magicLinkToken.create({
            data: {
                token,
                userId: userId!,
                tagihanId: tagihan.id,
                purpose: "pembayaran",
                expiresAt,
            },
        });
        const origin = getAppOrigin(req);
        // get companyId from nested user include (if available)
        let companyIdForMagic: string | undefined = undefined;
        try {
            // row.pelanggan.user may be undefined; use optional chaining
            companyIdForMagic = (row.pelanggan as any)?.user?.companyId as
                | string
                | undefined;
        } catch (err) {
            console.warn(
                "unable to read companyId from nested user:",
                String(err)
            );
        }

        // Fallback: try x-company-id header from the incoming request
        if (!companyIdForMagic) {
            const xcompany =
                req.headers.get("x-company-id") ||
                req.headers.get("x-companyid");
            if (xcompany) companyIdForMagic = xcompany;
        }

        // Build magic URL — include companyId query param when available
        const magicUrlBase =
            origin &&
            `${origin}/api/auth/magic?token=${encodeURIComponent(token)}`;
        const magicUrl =
            magicUrlBase &&
            (companyIdForMagic
                ? `${magicUrlBase}&companyId=${encodeURIComponent(
                      companyIdForMagic
                  )}`
                : magicUrlBase);

        // === Kirim WA (teks + gambar) ke wa / wa2 bila ada ===
        if (sendWa) {
            const targets = getWaTargets([pelanggan?.wa, pelanggan?.wa2]);
            if (targets.length > 0) {
                const linkBaris = magicUrl
                    ? `\n\nUnggah bukti pembayaran dengan aman via tautan berikut:\n${magicUrl}`
                    : "";

                const text =
                    waText({
                        setting: {
                            namaPerusahaan: setting.namaPerusahaan,
                            telepon: setting.telepon,
                            email: setting.email,
                            alamat: setting.alamat,
                            anNorekPembayaran: setting.anNorekPembayaran,
                            namaBankPembayaran: setting.namaBankPembayaran,
                            namaBendahara: setting.namaBendahara,
                            norekPembayaran: setting.norekPembayaran,
                            whatsappCs: setting.whatsappCs,
                        },
                        nama: pelanggan.nama,
                        kode: pelanggan.kode || undefined,
                        periode: billingPeriode,
                        meterAwal: row.meterAwal,
                        meterAkhir: Math.max(
                            row.meterAkhir ?? row.meterAwal,
                            row.meterAwal
                        ),
                        pemakaian: Math.max(
                            0,
                            (row.meterAkhir ?? row.meterAwal) - row.meterAwal
                        ),
                        tarifPerM3: tarif,
                        abonemen: abon,
                        biayaAdmin,
                        tagihanLalu: tagihan.tagihanLalu,
                        tagihanBulanIni: tagihan.totalTagihan,
                        sisaKurang: tagihan.sisaKurang,
                        total,
                        due,
                        tglCatat: now,
                    }) + linkBaris;

                // Build forwardHeaders from incoming request so Puppeteer can read cookie/company
                const forwardHeaders: Record<string, string> = {};
                const cookie = req.headers.get("cookie");
                if (cookie) forwardHeaders["cookie"] = cookie;
                const xcompany =
                    req.headers.get("x-company-id") ||
                    req.headers.get("x-companyid");
                if (xcompany) forwardHeaders["x-company-id"] = xcompany;
                const auth = req.headers.get("authorization");
                if (auth) forwardHeaders["authorization"] = auth;

                // send text messages (best-effort, non-blocking)
                (async () => {
                    await Promise.allSettled(
                        targets.map(async (to) => {
                            try {
                                await sendWaAndLog(to, text, companyIdForMagic);
                            } catch (err) {
                                console.error(
                                    "sendWaAndLog failed for",
                                    to,
                                    String(err)
                                );
                            }
                        })
                    );
                    const caption = `Tagihan Air Periode ${new Date(
                        `${billingPeriode}-01`
                    ).toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                    })} - ${pelanggan.nama}`;

                    // pass forwardHeaders so page has company/session
                    await Promise.allSettled(
                        targets.map(async (to) => {
                            try {
                                await sendWaImageAndLog(
                                    to,
                                    tagihan.id,
                                    caption,
                                    forwardHeaders,
                                    companyIdForMagic
                                );
                            } catch (err) {
                                console.error(
                                    "sendWaImageAndLog failed for",
                                    to,
                                    String(err)
                                );
                            }
                        })
                    );
                })();
            }
        }

        return NextResponse.json({ ok: true, locked: true, tagihan });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
