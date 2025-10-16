// // app/api/pelanggan/reset-password/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// // ---- Helper auth sama seperti di route pelanggan ----
// type JwtPayload = { sub?: string };
// async function getAuthUser(req: NextRequest) {
//   const prisma = await db();
//   const token = req.cookies.get("tb_token")?.value;
//   if (!token) return null;
//   try {
//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET || "supersecret"
//     ) as JwtPayload;
//     if (!decoded?.sub) return null;
//     const u = await prisma.user.findUnique({
//       where: { id: decoded.sub },
//       select: { id: true, role: true },
//     });
//     return u;
//   } catch {
//     return null;
//   }
// }

// // ---- Generator password kuat ----
// function generateStrongPassword(len = 12) {
//   const lower = "abcdefghjkmnpqrstuvwxyz";
//   const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
//   const nums = "23456789";
//   const syms = "!@#$%^&*()-_=+?";
//   const all = lower + upper + nums + syms;

//   // pastikan ada campuran
//   const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
//   const base = [pick(lower), pick(upper), pick(nums), pick(syms)];

//   while (base.length < len) base.push(pick(all));

//   // shuffle sederhana
//   for (let i = base.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [base[i], base[j]] = [base[j], base[i]];
//   }
//   return base.join("");
// }

// export async function POST(req: NextRequest) {
//   const prisma = await db();
//   try {
//     const me = await getAuthUser(req);
//     if (!me || me.role !== "ADMIN") {
//       return NextResponse.json(
//         { ok: false, message: "Tidak berizin" },
//         { status: 403 }
//       );
//     }

//     // Mode: single atau all?
//     const sp = req.nextUrl.searchParams;
//     const allFlag = sp.get("all") === "true";
//     const body = (await req.json().catch(() => ({}))) as {
//       pelangganId?: string;
//       all?: boolean;
//     };
//     const pelangganId = body?.pelangganId || sp.get("pelangganId") || undefined;
//     const doAll = allFlag || !!body?.all;

//     if (!doAll && !pelangganId) {
//       return NextResponse.json(
//         {
//           ok: false,
//           message:
//             "pelangganId wajib diisi untuk reset per pelanggan, atau set all=true untuk reset massal.",
//         },
//         { status: 400 }
//       );
//     }

//     if (doAll) {
//       // ambil semua pelanggan aktif yang punya user
//       const list = await prisma.pelanggan.findMany({
//         where: { deletedAt: null, statusAktif: true, userId: { not: null } },
//         select: {
//           id: true,
//           nama: true,
//           userId: true,
//           user: { select: { username: true } },
//         },
//       });

//       if (list.length === 0) {
//         return NextResponse.json({
//           ok: false,
//           data: [],
//           message: "Tidak ada pelanggan aktif yang memiliki user.",
//         });
//       }

//       const results: {
//         pelangganId: string;
//         nama: string;
//         username: string;
//         newPassword: string;
//       }[] = [];
//       // siapkan operasi batch
//       const ops: any[] = [];

//       // kumpulkan userId untuk hapus sesi
//       const userIds: string[] = [];

//       for (const row of list) {
//         if (!row.userId) continue;
//         const newPass = generateStrongPassword(12);
//         const hash = await bcrypt.hash(newPass, 10);

//         userIds.push(row.userId);
//         // update hash user
//         ops.push(
//           prisma.user.update({
//             where: { id: row.userId },
//             data: { passwordHash: hash },
//           })
//         );
//         // update plaintext pelanggan
//         ops.push(
//           prisma.pelanggan.update({
//             where: { id: row.id },
//             data: { passwordPlain: newPass },
//           })
//         );

//         // audit walog (opsional)
//         ops.push(
//           prisma.waLog.create({
//             data: {
//               tipe: "RESET_PASSWORD",
//               tujuan: row.user?.username || "-",
//               status: "OK",
//               payload: JSON.stringify({
//                 scope: "ALL",
//                 pelangganId: row.id,
//                 at: new Date().toISOString(),
//               }),
//             },
//           })
//         );

//         results.push({
//           pelangganId: row.id,
//           nama: row.nama,
//           username: row.user?.username || "",
//           newPassword: newPass,
//         });
//       }

//       // hapus sesi lama (sekali saja di luar loop)
//       if (userIds.length > 0) {
//         ops.push(
//           prisma.session.deleteMany({ where: { userId: { in: userIds } } })
//         );
//       }

//       await prisma.$transaction(ops);

//       return NextResponse.json({
//         ok: true,
//         count: results.length,
//         data: results,
//         message: `Berhasil reset password ${results.length} pelanggan.`,
//       });
//     }

//     // ---- Single pelanggan ----
//     const pel = await prisma.pelanggan.findUnique({
//       where: { id: String(pelangganId) },
//       select: {
//         id: true,
//         nama: true,
//         userId: true,
//         user: { select: { id: true, username: true } },
//       },
//     });

//     if (!pel) {
//       return NextResponse.json(
//         { ok: false, message: "Pelanggan tidak ditemukan" },
//         { status: 404 }
//       );
//     }
//     if (!pel.userId) {
//       return NextResponse.json(
//         { ok: false, message: "Pelanggan belum memiliki user untuk di-reset." },
//         { status: 409 }
//       );
//     }

//     const newPass = generateStrongPassword(12);
//     const hash = await bcrypt.hash(newPass, 10);

//     await prisma.$transaction([
//       prisma.user.update({
//         where: { id: pel.userId },
//         data: { passwordHash: hash },
//       }),
//       prisma.pelanggan.update({
//         where: { id: pel.id },
//         data: { passwordPlain: newPass },
//       }),
//       prisma.session.deleteMany({ where: { userId: pel.userId } }),
//       prisma.waLog.create({
//         data: {
//           tipe: "RESET_PASSWORD",
//           tujuan: pel.user?.username || "-",
//           status: "OK",
//           payload: JSON.stringify({
//             scope: "SINGLE",
//             pelangganId: pel.id,
//             at: new Date().toISOString(),
//           }),
//         },
//       }),
//     ]);

//     return NextResponse.json({
//       ok: true,
//       data: {
//         pelangganId: pel.id,
//         nama: pel.nama,
//         username: pel.user?.username,
//         newPassword: newPass, // dikembalikan sekali agar admin bisa salin
//       },
//       message: "Password berhasil di-reset.",
//     });
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, message: e?.message ?? "Server error" },
//       { status: 500 }
//     );
//   }
// }

// app/api/pelanggan/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { warehouseUpsertCpiu } from "@/lib/warehouse-users";

/* ---------------------------
   Helpers
   --------------------------- */

type JwtPayload = { sub?: string };

async function getAuthUser(req: NextRequest) {
    const prisma = await db();
    const token = req.cookies.get("tb_token")?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "supersecret"
        ) as JwtPayload;
        if (!decoded?.sub) return null;
        const u = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: { id: true, role: true },
        });
        return u;
    } catch {
        return null;
    }
}

function generateStrongPassword(len = 12) {
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
    const nums = "23456789";
    const syms = "!@#$%^&*()-_=+?";
    const all = lower + upper + nums + syms;

    const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
    const base = [pick(lower), pick(upper), pick(nums), pick(syms)];

    while (base.length < len) base.push(pick(all));

    for (let i = base.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [base[i], base[j]] = [base[j], base[i]];
    }
    return base.join("");
}

/** Ambil companyId dari cookie (sama seperti endpoint pelanggan) */
function getCompanyIdFromCookie(req: NextRequest): string | null {
    return req.cookies.get("tb_company")?.value ?? null;
}

/* ===================== POST handler ===================== */

export async function POST(req: NextRequest) {
    const prisma = await db();
    try {
        const me = await getAuthUser(req);
        if (!me || me.role !== "ADMIN") {
            return NextResponse.json(
                { ok: false, message: "Tidak berizin" },
                { status: 403 }
            );
        }

        // Mode: single atau all?
        const sp = req.nextUrl.searchParams;
        const allFlag = sp.get("all") === "true";
        const body = (await req.json().catch(() => ({}))) as {
            pelangganId?: string;
            all?: boolean;
        };
        const pelangganId =
            body?.pelangganId || sp.get("pelangganId") || undefined;
        const doAll = allFlag || !!body?.all;

        if (!doAll && !pelangganId) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "pelangganId wajib diisi untuk reset per pelanggan, atau set all=true untuk reset massal.",
                },
                { status: 400 }
            );
        }

        const companyId = getCompanyIdFromCookie(req);
        if (!companyId) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Company ID (cookie tb_company) tidak ditemukan",
                },
                { status: 400 }
            );
        }

        if (doAll) {
            // ambil semua pelanggan aktif yg punya user
            const list = await prisma.pelanggan.findMany({
                where: {
                    deletedAt: null,
                    statusAktif: true,
                    userId: { not: null },
                },
                select: {
                    id: true,
                    nama: true,
                    userId: true,
                    passwordPlain: true,
                    user: { select: { username: true, passwordHash: true } },
                },
            });

            if (list.length === 0) {
                return NextResponse.json({
                    ok: false,
                    data: [],
                    message: "Tidak ada pelanggan aktif yang memiliki user.",
                });
            }

            // Simpan old values agar bisa rollback jika sink gagal
            const oldMap: Record<
                string,
                {
                    userId: string;
                    oldPasswordHash?: string | null;
                    oldPasswordPlain?: string | null;
                    username: string;
                }
            > = {};

            // Build update ops
            const ops: any[] = [];
            const results: {
                pelangganId: string;
                nama: string;
                username: string;
                newPassword: string;
            }[] = [];

            for (const row of list) {
                if (!row.userId) continue;
                const newPass = generateStrongPassword(12);
                const newHash = await bcrypt.hash(newPass, 10);

                oldMap[row.userId] = {
                    userId: row.userId,
                    oldPasswordHash: row.user?.passwordHash ?? null,
                    oldPasswordPlain: row.passwordPlain ?? null,
                    username: row.user?.username ?? "",
                };

                ops.push(
                    prisma.user.update({
                        where: { id: row.userId },
                        data: { passwordHash: newHash },
                    })
                );
                ops.push(
                    prisma.pelanggan.update({
                        where: { id: row.id },
                        data: { passwordPlain: newPass },
                    })
                );

                results.push({
                    pelangganId: row.id,
                    nama: row.nama,
                    username: row.user?.username ?? "",
                    newPassword: newPass,
                });
            }

            // lakukan semua perubahan DB (tanpa hapus session)
            await prisma.$transaction(ops);

            // now sink to Warehouse per-account
            const sinkErrors: { username: string; err: any }[] = [];
            for (const r of results) {
                try {
                    // get hash we just set (safer to compute again)
                    const u = await prisma.user.findUnique({
                        where: { username: r.username },
                        select: { passwordHash: true },
                    });
                    const hashToSend = u?.passwordHash ?? undefined;
                    await warehouseUpsertCpiu({
                        email: r.username,
                        companyId,
                        passwordPlain: r.newPassword,
                        passwordHash: hashToSend,
                        isActive: true,
                    });
                } catch (err) {
                    sinkErrors.push({ username: r.username, err });
                    console.error(
                        "[WAREHOUSE ERROR] upsert during reset-all for",
                        r.username,
                        err
                    );
                    break; // you may decide to continue; here kita abort on first error to rollback
                }
            }

            if (sinkErrors.length > 0) {
                // rollback manual: restore old hashes/plain
                const restoreOps: any[] = [];
                for (const uid of Object.keys(oldMap)) {
                    const info = oldMap[uid];
                    restoreOps.push(
                        prisma.user.update({
                            where: { id: uid },
                            data: {
                                passwordHash: info.oldPasswordHash ?? undefined,
                            },
                        })
                    );
                    // find pelanggan id(s) that reference this userId
                    // we saved old passwordPlain at oldMap; to be safe, restore pelanggan by userId
                    restoreOps.push(
                        prisma.pelanggan.updateMany({
                            where: { userId: uid },
                            data: {
                                passwordPlain: info.oldPasswordPlain ?? null,
                            },
                        })
                    );
                }
                try {
                    await prisma.$transaction(restoreOps);
                } catch (e) {
                    console.error(
                        "Rollback failed after warehouse sink error:",
                        e
                    );
                    // still return 502 with info
                }

                return NextResponse.json(
                    {
                        ok: false,
                        message:
                            "Sink ke Warehouse gagal saat reset massal. Perubahan dikembalikan.",
                        detail: sinkErrors.map((s) => ({
                            username: s.username,
                            message: String(s.err?.message ?? s.err),
                        })),
                    },
                    { status: 502 }
                );
            }

            // semua sink berhasil -> sekarang hapus session untuk semua user yang direset
            const userIds = Object.keys(oldMap);
            if (userIds.length > 0) {
                try {
                    await prisma.session.deleteMany({
                        where: { userId: { in: userIds } },
                    });
                } catch (e) {
                    console.error(
                        "Failed to delete sessions after successful warehouse sink (mass):",
                        e
                    );
                }
            }

            return NextResponse.json({
                ok: true,
                count: results.length,
                data: results,
                message: `Berhasil reset password ${results.length} pelanggan dan sink ke Warehouse.`,
            });
        }

        // ---- Single pelanggan ----
        const pel = await prisma.pelanggan.findUnique({
            where: { id: String(pelangganId) },
            select: {
                id: true,
                nama: true,
                userId: true,
                passwordPlain: true,
                user: {
                    select: { id: true, username: true, passwordHash: true },
                },
            },
        });

        if (!pel) {
            return NextResponse.json(
                { ok: false, message: "Pelanggan tidak ditemukan" },
                { status: 404 }
            );
        }
        if (!pel.userId) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Pelanggan belum memiliki user untuk di-reset.",
                },
                { status: 409 }
            );
        }

        const newPass = generateStrongPassword(12);
        const newHash = await bcrypt.hash(newPass, 10);

        // simpan old values untuk kemungkinan rollback
        const oldUserHash = pel.user?.passwordHash ?? null;
        const oldPlain = pel.passwordPlain ?? null;
        const username = pel.user?.username ?? "";

        // update DB (tanpa delete session)
        await prisma.$transaction([
            prisma.user.update({
                where: { id: pel.userId },
                data: { passwordHash: newHash },
            }),
            prisma.pelanggan.update({
                where: { id: pel.id },
                data: { passwordPlain: newPass },
            }),
            prisma.waLog.create({
                data: {
                    tipe: "RESET_PASSWORD",
                    tujuan: username || "-",
                    status: "OK",
                    payload: JSON.stringify({
                        scope: "SINGLE",
                        pelangganId: pel.id,
                        at: new Date().toISOString(),
                    }),
                },
            }),
        ]);

        // sink to Warehouse
        try {
            await warehouseUpsertCpiu({
                email: username,
                companyId,
                passwordPlain: newPass,
                passwordHash: newHash,
                isActive: true,
            });
        } catch (err) {
            console.error(
                "[WAREHOUSE ERROR] upsert during reset-single",
                username,
                err
            );
            // rollback manual: restore old hash & plain
            try {
                await prisma.$transaction([
                    prisma.user.update({
                        where: { id: pel.userId },
                        data: { passwordHash: oldUserHash ?? undefined },
                    }),
                    prisma.pelanggan.update({
                        where: { id: pel.id },
                        data: { passwordPlain: oldPlain ?? null },
                    }),
                ]);
            } catch (e) {
                console.error(
                    "Rollback failed after warehouse error (single):",
                    e
                );
            }
            return NextResponse.json(
                {
                    ok: false,
                    message: "Sink ke Warehouse gagal. Perubahan dikembalikan.",
                    detail: String(err?.message ?? err),
                },
                { status: 502 }
            );
        }

        // warehouse ok -> hapus session user ini
        try {
            await prisma.session.deleteMany({ where: { userId: pel.userId } });
        } catch (e) {
            console.error(
                "Failed to delete session after successful warehouse sink (single):",
                e
            );
        }

        return NextResponse.json({
            ok: true,
            data: {
                pelangganId: pel.id,
                nama: pel.nama,
                username,
                newPassword: newPass,
            },
            message:
                "Password berhasil di-reset dan disinkronkan ke Warehouse.",
        });
    } catch (e: any) {
        console.error("POST /api/pelanggan/reset-password error:", e);
        return NextResponse.json(
            { ok: false, message: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
