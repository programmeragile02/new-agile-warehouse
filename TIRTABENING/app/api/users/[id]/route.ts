// // app/api/users/[id]/route.ts

// import { NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import bcrypt from "bcryptjs";
// const select = {
//   id: true,
//   username: true,
//   name: true,
//   phone: true,
//   role: true,
//   isActive: true,
//   createdAt: true,
//   updatedAt: true,
// };

// export async function PUT(_: Request, { params }: { params: { id: string } }) {
//   const prisma = await db();
//   const id = params.id;
//   const body = await _.json().catch(() => ({} as any));
//   const { username, password, name, role, phone } = body as {
//     username?: string;
//     password?: string;
//     name?: string;
//     role?: "ADMIN" | "PETUGAS" | "WARGA";
//     phone?: string | null;
//   };

//   // cegah edit username 'admin' jadi non-unik/aneh via delete+create
//   const current = await prisma.user.findUnique({ where: { id } });
//   if (!current)
//     return NextResponse.json(
//       { message: "User tidak ditemukan" },
//       { status: 404 }
//     );

//   let passwordHash: string | undefined;
//   if (typeof password === "string" && password.length > 0) {
//     passwordHash = await bcrypt.hash(password, 10);
//   }

//   // kalau ganti username, pastikan unik
//   if (username && username !== current.username) {
//     const exists = await prisma.user.findUnique({ where: { username } });
//     if (exists) {
//       return NextResponse.json(
//         { message: "Username sudah dipakai" },
//         { status: 400 }
//       );
//     }
//   }

//   const updated = await prisma.user.update({
//     where: { id },
//     data: {
//       username: username ?? undefined,
//       passwordHash,
//       name: name ?? undefined,
//       role: role ?? undefined,
//       phone: phone ?? undefined,
//     },
//     select,
//   });

//   return NextResponse.json(updated);
// }

// export async function PATCH(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   const prisma = await db();
//   const id = params.id;
//   const body = await req.json().catch(() => ({} as any));
//   const { action, isActive } = body as {
//     action?: "toggle";
//     isActive?: boolean;
//   };

//   const user = await prisma.user.findUnique({ where: { id } });
//   if (!user)
//     return NextResponse.json(
//       { message: "User tidak ditemukan" },
//       { status: 404 }
//     );
//   if (
//     user.username === "admin" &&
//     action === "toggle" &&
//     user.isActive &&
//     isActive === false
//   ) {
//     // masih boleh toggle admin? Kalau tidak, batasi:
//     // return NextResponse.json({ message: "User admin tidak bisa dinonaktifkan" }, { status: 400 })
//   }

//   const nextActive = typeof isActive === "boolean" ? isActive : !user.isActive;

//   const updated = await prisma.user.update({
//     where: { id },
//     data: { isActive: nextActive },
//     select,
//   });
//   return NextResponse.json(updated);
// }

// export async function DELETE(
//   _: Request,
//   { params }: { params: { id: string } }
// ) {
//   const prisma = await db();
//   const id = params.id;
//   const user = await prisma.user.findUnique({ where: { id } });
//   if (!user)
//     return NextResponse.json(
//       { message: "User tidak ditemukan" },
//       { status: 404 }
//     );
//   if (user.username === "admin") {
//     return NextResponse.json(
//       { message: 'User "admin" tidak boleh dihapus' },
//       { status: 400 }
//     );
//   }

//   // Soft delete (sesuai schema kamu punya kolom deletedAt)
//   const deleted = await prisma.user.update({
//     where: { id },
//     data: { deletedAt: new Date(), isActive: false },
//     select,
//   });
//   return NextResponse.json(deleted);
// }

// import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import { db } from "@/lib/db";
// import { getTenantContextOrThrow } from "@/lib/tenant-context";
// import {
//     warehouseSetCpiuActive,
//     warehouseUpsertCpiu,
// } from "@/lib/warehouse-users";
// export const runtime = "nodejs";

// const select = {
//     id: true,
//     username: true,
//     name: true,
//     phone: true,
//     role: true,
//     isActive: true,
//     createdAt: true,
//     updatedAt: true,
// };

// export async function PUT(
//     req: Request,
//     { params }: { params: { id: string } }
// ) {
//     const prisma = await db();
//     const id = params.id;
//     const body = await req.json().catch(() => ({} as any));
//     const { username, password, name, role, phone } = body as {
//         username?: string;
//         password?: string;
//         name?: string;
//         role?: "ADMIN" | "PETUGAS" | "WARGA";
//         phone?: string | null;
//     };

//     const user = await prisma.user.findUnique({ where: { id } });
//     if (!user)
//         return NextResponse.json(
//             { message: "User tidak ditemukan" },
//             { status: 404 }
//         );

//     if (username && username !== user.username) {
//         return NextResponse.json(
//             { message: "Perubahan username/email tidak diizinkan" },
//             { status: 400 }
//         );
//     }

//     let passwordHash: string | undefined;
//     if (typeof password === "string" && password.length > 0) {
//         passwordHash = await bcrypt.hash(password, 10);
//     }

//     const updated = await prisma.user.update({
//         where: { id },
//         data: {
//             passwordHash,
//             name: name ?? undefined,
//             role: role ?? undefined,
//             phone: phone ?? undefined,
//         },
//         select,
//     });

//     // Sinkron password baru bila ada
//     if (passwordHash) {
//         try {
//             const tenant = await getTenantContextOrThrow(
//                 process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING"
//             );
//             await warehouseUpsertCpiu({
//                 email: user.username,
//                 companyId: tenant.companyId,
//                 passwordPlain: password!,
//                 passwordHash,
//                 isActive: updated.isActive,
//             });
//         } catch (e) {
//             // best-effort: log saja (atau kirim notifikasi)
//             console.error("CPIU upsert (PUT) error:", e);
//         }
//     }

//     return NextResponse.json(updated);
// }

// export async function PATCH(
//     req: Request,
//     { params }: { params: { id: string } }
// ) {
//     const prisma = await db();
//     const id = params.id;
//     const body = await req.json().catch(() => ({} as any));
//     const { action, isActive } = body as {
//         action?: "toggle";
//         isActive?: boolean;
//     };

//     const user = await prisma.user.findUnique({ where: { id } });
//     if (!user)
//         return NextResponse.json(
//             { message: "User tidak ditemukan" },
//             { status: 404 }
//         );

//     if (
//         user.username === "admin" &&
//         action === "toggle" &&
//         user.isActive &&
//         isActive === false
//     ) {
//         // masih boleh toggle admin? Kalau tidak, batasi:
//         // return NextResponse.json({ message: "User admin tidak bisa dinonaktifkan" }, { status: 400 })
//     }

//     const nextActive =
//         typeof isActive === "boolean" ? isActive : !user.isActive;

//     const updated = await prisma.user.update({
//         where: { id },
//         data: { isActive: nextActive },
//         select,
//     });

//     try {
//         const tenant = await getTenantContextOrThrow(
//             process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING"
//         );
//         await warehouseSetCpiuActive({
//             email: user.username,
//             companyId: tenant.companyId,
//             isActive: nextActive,
//         });
//     } catch (e) {
//         console.error("CPIU setActive (PATCH) error:", e);
//     }

//     return NextResponse.json(updated);
// }

// export async function DELETE(
//     _: Request,
//     { params }: { params: { id: string } }
// ) {
//     const prisma = await db();
//     const id = params.id;
//     const user = await prisma.user.findUnique({ where: { id } });
//     if (!user)
//         return NextResponse.json(
//             { message: "User tidak ditemukan" },
//             { status: 404 }
//         );
//     if (user.username === "admin") {
//         return NextResponse.json(
//             { message: 'User "admin" tidak boleh dihapus' },
//             { status: 400 }
//         );
//     }

//     const deleted = await prisma.user.update({
//         where: { id },
//         data: { deletedAt: new Date(), isActive: false },
//         select,
//     });

//     try {
//         const tenant = await getTenantContextOrThrow(
//             process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING"
//         );
//         await warehouseSetCpiuActive({
//             email: user.username,
//             companyId: tenant.companyId,
//             isActive: false,
//         });
//     } catch (e) {
//         console.error("CPIU setActive (DELETE) error:", e);
//     }

//     return NextResponse.json(deleted);
// }

// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getTenantContextOrThrow } from "@/lib/tenant-context";
import {
    warehouseSetCpiuActive,
    warehouseUpsertCpiu,
} from "@/lib/warehouse-users";
export const runtime = "nodejs";

const select = {
    id: true,
    username: true,
    name: true,
    phone: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};

/**
 * NOTE: gunakan 'context' (atau ctx) untuk mengambil params agar konsisten
 * dengan requirement Next.js yang menyarankan tidak langsung mengakses
 * property dari parameter destructured `params`.
 */

export async function PUT(req: Request, context: { params: { id: string } }) {
    const prisma = await db();
    const id = context.params.id; // <-- aman
    const body = await req.json().catch(() => ({} as any));
    const { username, password, name, role, phone } = body as {
        username?: string;
        password?: string;
        name?: string;
        role?: "ADMIN" | "PETUGAS" | "WARGA";
        phone?: string | null;
    };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        return NextResponse.json(
            { message: "User tidak ditemukan" },
            { status: 404 }
        );
    }

    // Lock perubahan email/username demi konsistensi CPIU (kalau mau bolehin, buat flow khusus)
    if (username && username !== user.username) {
        return NextResponse.json(
            {
                message:
                    "Perubahan username/email tidak diizinkan lewat endpoint ini",
            },
            { status: 400 }
        );
    }

    let passwordHash: string | undefined;
    if (typeof password === "string" && password.length > 0) {
        passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
        where: { id },
        data: {
            // username tidak diubah
            passwordHash,
            name: name ?? undefined,
            role: role ?? undefined,
            phone: phone ?? undefined,
        },
        select,
    });

    // Sync ke Warehouse kalau ada password baru / perubahan status lain yang relevan
    try {
        const tenant = await getTenantContextOrThrow(
            process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING"
        );

        if (passwordHash) {
            await warehouseUpsertCpiu({
                email: user.username,
                companyId: tenant.companyId,
                passwordPlain: password || undefined,
                passwordHash,
                isActive: updated.isActive,
            });
        } else {
            // Tidak ada password baru => tidak upsert password. Jika ingin syncronize name/phone,
            // buat endpoint khusus atau modifikasi warehouseUpsertCpiu untuk menerima perubahan non-password.
        }
    } catch (e) {
        console.error("CPIU upsert (PUT) error:", e);
        // jangan gagalkan update tenant kalau warehouse down — cukup log
    }

    return NextResponse.json(updated);
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
    const prisma = await db();
    const id = context.params.id;
    const body = await req.json().catch(() => ({} as any));
    const { action, isActive } = body as {
        action?: "toggle";
        isActive?: boolean;
    };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
        return NextResponse.json(
            { message: "User tidak ditemukan" },
            { status: 404 }
        );

    if (
        user.username === "admin" &&
        action === "toggle" &&
        user.isActive &&
        isActive === false
    ) {
        // optional: batasi nonaktifkan admin
    }

    const nextActive =
        typeof isActive === "boolean" ? isActive : !user.isActive;

    const updated = await prisma.user.update({
        where: { id },
        data: { isActive: nextActive },
        select,
    });

    // Sync status aktif ke CPIU (best effort)
    try {
        const tenant = await getTenantContextOrThrow(
            process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING"
        );
        await warehouseSetCpiuActive({
            email: user.username,
            companyId: tenant.companyId,
            isActive: nextActive,
        });
    } catch (e) {
        console.error("CPIU setActive (PATCH) error:", e);
    }

    return NextResponse.json(updated);
}

export async function DELETE(
    _req: Request,
    context: { params: { id: string } }
) {
    const prisma = await db();
    const id = context.params.id;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
        return NextResponse.json(
            { message: "User tidak ditemukan" },
            { status: 404 }
        );
    if (user.username === "admin") {
        return NextResponse.json(
            { message: 'User "admin" tidak boleh dihapus' },
            { status: 400 }
        );
    }

    // Soft delete + nonaktif
    const deleted = await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
        select,
    });

    // Sinkron: set is_active=false di CPIU (best effort)
    try {
        const tenant = await getTenantContextOrThrow(
            process.env.NEXT_PUBLIC_PRODUCT_CODE || "TIRTABENING"
        );
        await warehouseSetCpiuActive({
            email: user.username,
            companyId: tenant.companyId,
            isActive: false,
        });
    } catch (e) {
        console.error("CPIU setActive (DELETE) error:", e);
    }

    return NextResponse.json(deleted);
}
