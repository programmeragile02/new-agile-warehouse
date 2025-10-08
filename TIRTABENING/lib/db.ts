import "server-only";
import { prismaFor } from "./prisma-tenant";
import { getTenantContextOrThrow } from "./tenant-context";

export async function db() {
  const productCode = process.env.NEXT_PUBLIC_PRODUCT_CODE!;
  const { dbUrl } = await getTenantContextOrThrow(productCode);
  return prismaFor(dbUrl);
}
