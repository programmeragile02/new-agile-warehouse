import { NextResponse } from "next/server";

function readCookie(headers: Headers, name: string) {
    const cookie = headers.get("cookie") || "";
    const part = cookie.split("; ").find((x) => x.startsWith(name + "="));
    return part ? decodeURIComponent(part.split("=")[1] || "") : "";
}

export async function GET(req: Request) {
    const company = readCookie(req.headers, "tb_company");
    const raw = readCookie(req.headers, `tb_addons__${company}`) || "[]";
    let addons: string[] = [];
    try {
        addons = JSON.parse(raw);
    } catch {}
    const offering = readCookie(req.headers, "tb_offering");

    return NextResponse.json({ ok: true, company, offering, addons });
}
