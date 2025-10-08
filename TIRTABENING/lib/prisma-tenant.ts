import { PrismaClient } from "@prisma/client";
import "server-only";

const globalForPrisma = globalThis as unknown as {
  __tenantPrismas?: Map<string, PrismaClient>;
};
globalForPrisma.__tenantPrismas ??= new Map();

export function prismaFor(dbUrl: string) {
  const cache = globalForPrisma.__tenantPrismas!;
  const exist = cache.get(dbUrl);
  if (exist) return exist;
  const cli = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  cache.set(dbUrl, cli);
  return cli;
}