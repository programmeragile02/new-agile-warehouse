import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { randomToken } from "@/lib/auth-utils";
import { getWaTargets } from "@/lib/wa-targets";
import { db } from "@/lib/db";
import { sendWaAndLog, sendWaImageAndLog } from "@/lib/wa-send";

/* ============ Helpers ============ */
function getAppOrigin(req: NextRequest) {
    const h = (req as any).headers;
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
    periode: string;
    meterAwal?: number;
    meterAkhir?: number;
    pemakaian?: number;
    tarifPerM3?: number;
    abonemen?: number;
    biayaAdmin?: number;
    total?: number;
    due: Date;
    pdfUrl?: string;
    tagihanLalu: number;
    tagihanBulanIni: number;
    sisaKurang?: number;
    tglCatat?: Date;
}) {
    const perusahaan = p.setting?.namaPerusahaan || "Natabanyu";
    const bulan = new Date(p.periode + "-01").toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
    });
    const bayarLines = [
        `• Tunai ke bendahara (${p.setting?.namaBendahara}).`,
        `• Transfer ke Rekening ${p.setting?.namaBankPembayaran} ${p.setting?.norekPembayaran} a.n. ${p.setting?.anNorekPembayaran}.`,
    ].join("\n");
    const kontakLine = p.setting?.whatsappCs
        ? `WhatsApp:\nKlik nomor berikut -> ${p.setting.whatsappCs}`
        : "";

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
            p.meterAwal != null ? `• Meter Awal: ${p.meterAwal}` : undefined,
            p.meterAkhir != null ? `• Meter Akhir: ${p.meterAkhir}` : undefined,
            p.pemakaian != null ? `• Pemakaian: ${p.pemakaian} m³` : undefined,
            p.tarifPerM3 != null
                ? `• Tarif/m³: ${formatRp(p.tarifPerM3)}`
                : undefined,
            p.abonemen != null
                ? `• Abonemen: ${formatRp(p.abonemen)}`
                : undefined,
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

/* ============ util: ambil company dari cookie/header ============ */
function getCompanyFromRequest(req: NextRequest) {
    try {
        const anyReq = req as any;
        const ck = anyReq?.cookies?.get?.("tb_company")?.value;
        if (ck) return ck;
        const cookieHeader = req.headers.get("cookie") || "";
        const found = cookieHeader
            .split(";")
            .map((s) => s.trim())
            .find((c) => c.startsWith("tb_company="));
        if (found) return decodeURIComponent(found.split("=")[1] || "");
        const xcompany =
            req.headers.get("x-company-id") || req.headers.get("x-companyid");
        if (xcompany) return xcompany;
        return null;
    } catch {
        return null;
    }
}

/* ============ POST: kirim WA tagihan by tagihanId ============ */
export async function POST(req: NextRequest) {
    const prisma = await db();
    try {
        const { tagihanId } = await req.json();
        if (!tagihanId) {
            return NextResponse.json(
                { ok: false, message: "tagihanId wajib" },
                { status: 400 }
            );
        }

        const t = await prisma.tagihan.findUnique({
            where: { id: tagihanId },
            include: {
                pelanggan: {
                    select: {
                        id: true,
                        nama: true,
                        kode: true,
                        wa: true,
                        wa2: true,
                        userId: true,
                    },
                },
                catatMeter: {
                    select: {
                        meterAwal: true,
                        meterAkhir: true,
                        pemakaianM3: true,
                        updatedAt: true,
                    },
                },
            },
        });
        if (!t || t.deletedAt) {
            return NextResponse.json(
                { ok: false, message: "Tagihan tidak ditemukan" },
                { status: 404 }
            );
        }

        const targets = getWaTargets([t.pelanggan?.wa, t.pelanggan?.wa2]);
        if (targets.length === 0) {
            return NextResponse.json(
                { ok: false, message: "Nomor WhatsApp pelanggan belum diisi" },
                { status: 400 }
            );
        }

        const setting = await prisma.setting.findUnique({ where: { id: 1 } });
        if (!setting) {
            return NextResponse.json(
                { ok: false, message: "Setting tidak ditemukan" },
                { status: 500 }
            );
        }

        // ensure user WARGA exists
        let userId = t.pelanggan.userId as string | undefined;
        if (!userId) {
            const username =
                t.pelanggan.kode || "WARGA-" + t.pelanggan.id.slice(-6);
            const pwd = randomToken(12);
            const user = await prisma.user.create({
                data: {
                    username,
                    passwordHash: pwd,
                    name: t.pelanggan.nama,
                    phone: t.pelanggan.wa ?? null,
                    role: "WARGA",
                    isActive: true,
                },
                select: { id: true },
            });
            userId = user.id;
            await prisma.pelanggan.update({
                where: { id: t.pelanggan.id },
                data: { userId },
            });
        }

        // company id (tenant)
        const companyFromCookie = getCompanyFromRequest(req) || undefined;

        // create magic link (include companyId so magic login resolves tenant)
        const token = randomToken(32);
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        await prisma.magicLinkToken.create({
            data: {
                token,
                userId: userId!,
                tagihanId: t.id,
                purpose: "pembayaran",
                expiresAt,
            },
        });
        const origin = getAppOrigin(req);
        let magicUrl =
            origin &&
            `${origin}/api/auth/magic?token=${encodeURIComponent(token)}`;
        if (magicUrl && companyFromCookie) {
            magicUrl = `${magicUrl}&companyId=${encodeURIComponent(
                companyFromCookie
            )}`;
        }

        const now = new Date();
        const due = new Date(t.tglJatuhTempo);
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
                nama: t.pelanggan?.nama,
                kode: t.pelanggan?.kode || undefined,
                periode: t.periode,
                meterAwal: t.catatMeter?.meterAwal ?? undefined,
                meterAkhir: t.catatMeter?.meterAkhir ?? undefined,
                pemakaian: t.catatMeter?.pemakaianM3 ?? undefined,
                tarifPerM3: t.tarifPerM3,
                abonemen: t.abonemen,
                tagihanLalu: t.tagihanLalu,
                tagihanBulanIni: t.totalTagihan,
                sisaKurang: t.sisaKurang,
                total: t.totalTagihan,
                due,
                tglCatat: t.catatMeter?.updatedAt ?? now,
            }) + (magicUrl ? `\n\nUnggah bukti pembayaran:\n${magicUrl}` : "");

        // forwardHeaders for Puppeteer (so print page can read company/session)
        const forwardHeaders: Record<string, string> = {};
        const cookie = req.headers.get("cookie");
        if (cookie) forwardHeaders["cookie"] = cookie;
        const xcompany =
            req.headers.get("x-company-id") || req.headers.get("x-companyid");
        if (xcompany) forwardHeaders["x-company-id"] = xcompany;
        const auth = req.headers.get("authorization");
        if (auth) forwardHeaders["authorization"] = auth;

        // Send text + image (run background)
        (async () => {
            // send text (tenant-aware)
            await Promise.allSettled(
                targets.map((to) => sendWaAndLog(to, text, companyFromCookie))
            );

            // render invoice to image (puppeteer), then send as base64 via lib/wa-send
            try {
                let browser: any = null;

                // Common helpful flags for VPS / containers
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
                    } catch (errFirst) {
                        console.error(
                            "Puppeteer launch failed (first attempt)",
                            {
                                err: String(
                                    (errFirst as any)?.message || errFirst
                                ),
                            }
                        );
                    }
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

                const page: any = await browser.newPage();

                // forward headers (best-effort)
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
                                    idx > -1
                                        ? p.slice(0, idx).trim()
                                        : p.trim();
                                const value =
                                    idx > -1 ? p.slice(idx + 1).trim() : "";
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

                const origin =
                    process.env.APP_ORIGIN ||
                    process.env.NEXT_PUBLIC_APP_URL ||
                    "http://localhost:3000";

                await page.setViewport({
                    width: 380,
                    height: 800,
                    deviceScaleFactor: 2,
                });

                await page.goto(
                    `${origin}/print/tagihan/${tagihanId}?compact=1`,
                    {
                        waitUntil: "networkidle0",
                        timeout: 60_000,
                    }
                );

                await page
                    .evaluate(() => {
                        try {
                            (document.body as any).style.background = "#ffffff";
                        } catch {}
                        try {
                            (performance as any).clearMarks?.();
                            (performance as any).clearMeasures?.();
                        } catch {}
                    })
                    .catch(() => {});

                await page
                    .waitForSelector(".paper", {
                        visible: true,
                        timeout: 20_000,
                    })
                    .catch(() => {});

                const buffer: Buffer = await page.screenshot({
                    type: "jpeg",
                    quality: 85,
                    fullPage: true,
                });

                try {
                    await page.close();
                } catch {}
                try {
                    await browser.close();
                } catch {}
                browser = null;

                const base64 = buffer.toString("base64");
                const filename = `tagihan-${tagihanId}.jpg`;
                const caption = `Tagihan Air Periode ${new Date(
                    `${t.periode}-01`
                ).toLocaleDateString("id-ID", {
                    month: "long",
                    year: "numeric",
                })} - ${t.pelanggan?.nama}`;

                // send images (tenant-aware)
                await Promise.allSettled(
                    targets.map((to) =>
                        sendWaImageAndLog(
                            to,
                            { base64, filename, caption },
                            companyFromCookie
                        )
                    )
                );
            } catch (err) {
                console.error("kirim-wa: render/send image failed", err);
            }
        })();

        return NextResponse.json({ ok: true, message: "WA tagihan dikirim" });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
