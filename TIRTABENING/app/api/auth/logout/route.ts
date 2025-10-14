// import { NextResponse } from "next/server";
// function build() {
//   const res = NextResponse.json({ ok: true, message: "Logout berhasil" });
//   // Hapus sesi user
//   res.cookies.set("tb_session", "", {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: process.env.NODE_ENV === "production",
//     path: "/",
//     expires: new Date(0),
//   });
//   // (Kalau kamu masih pakai JWT lama, hapus juga)
//   res.cookies.set("tb_token", "", {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: process.env.NODE_ENV === "production",
//     path: "/",
//     expires: new Date(0),
//   });
//   return res;
// }

// export async function POST() {
//   return build();
// }
// export async function GET() {
//   return build();
// }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ALLOW_DELETE = new Set([
    "tb_session",
    "tb_token",
    "tb_tenant",
    "tb_offering",
    // jangan masukkan "tb_company"
]);

function shouldDelete(name: string) {
    if (ALLOW_DELETE.has(name)) return true;
    if (name.startsWith("tb_addons__")) return true;
    return false; // selain itu, JANGAN dihapus
}

function expire(name: string, httpOnly = true) {
    return {
        httpOnly,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/", // harus sama dengan saat set
        expires: new Date(0),
    };
}

function build() {
    const res = NextResponse.json({ ok: true, message: "Logout berhasil" });
    const jar = cookies();

    for (const c of jar.getAll()) {
        // biarkan tb_company dan cookie lain yang tidak kita kenal
        if (c.name === "tb_company") continue;
        if (shouldDelete(c.name)) {
            res.cookies.set(
                c.name,
                "",
                expire(c.name, c.name !== "tb_offering")
            );
        }
    }

    // jaga-jaga: hard delete nama pasti
    for (const name of ALLOW_DELETE) {
        res.cookies.set(name, "", expire(name, name !== "tb_offering"));
    }

    return res;
}

export async function POST() {
    return build();
}
export async function GET() {
    return build();
}
