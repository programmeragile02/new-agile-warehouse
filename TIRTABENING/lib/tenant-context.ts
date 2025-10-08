import "server-only";
import { decodeCookie } from "@/lib/auth-session";
import { prismaFor } from "@/lib/prisma-tenant";
import { getCookieStore } from "./cookies-compact";

export type TenantCookie = {
  companyId: string;
  productCode: string;
  dbUrl: string;
  packageCode?: string;
};

/** Versi aman Next 15 — PAKAI YANG INI di route handlers/server actions */
export async function getTenantContext(
  expectedProductCode?: string
): Promise<TenantCookie | null> {
  const store = await getCookieStore();
  const raw = store.get("tb_tenant")?.value;
  const ctx = decodeCookie<TenantCookie>(raw);
  if (!ctx) return null;
  if (expectedProductCode && ctx.productCode !== expectedProductCode) return null;
  return ctx;
}

export async function getTenantContextOrThrow(
  expectedProductCode: string
): Promise<TenantCookie> {
  const ctx = await getTenantContext(expectedProductCode);
  if (!ctx) throw new Error("Anda belum login Company / produk tidak sesuai");
  return ctx;
}

export async function getTenantPrismaOrThrow(expectedProductCode: string) {
  const { dbUrl } = await getTenantContextOrThrow(expectedProductCode);
  return prismaFor(dbUrl);
}

/** Session user (HMAC) opsional */
export async function getUserSessionOrNull() {
  const store = await getCookieStore();
  const raw = store.get("tb_session")?.value;
  return decodeCookie<{ uid: string; uname: string; role: string }>(raw);
}
