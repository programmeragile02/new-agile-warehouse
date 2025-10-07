import { NextResponse } from "next/server";
export async function DELETE() {
  const res = NextResponse.json({ ok: true, message: "Keluar company" });

  res.cookies.set("tb_tenant", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  // sekalian putus sesi user
  res.cookies.set("tb_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  res.cookies.set("tb_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return res;
}
