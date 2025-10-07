// import { PrismaClient } from "@prisma/client";
// import "server-only";

// const globalForPrisma = globalThis as unknown as {
//   __tenantPrismas?: Map<string, PrismaClient>;
// };

// globalForPrisma.__tenantPrismas ??= new Map();

// export function prismaFor(dbUrl: string): PrismaClient {
//   const key = dbUrl;
//   const cached = globalForPrisma.__tenantPrismas!.get(key);
//   if (cached) return cached;

//   const client = new PrismaClient({ datasources: { db: { url: dbUrl } } });
//   globalForPrisma.__tenantPrismas!.set(key, client);
//   return client;
// }

// import { PrismaClient } from "@prisma/client";
// const cache = new Map<string, PrismaClient>();
// export function prismaFor(dbUrl: string) {
//   let cli = cache.get(dbUrl);
//   if (!cli) {
//     cli = new PrismaClient({ datasources: { db: { url: dbUrl } } });
//     cache.set(dbUrl, cli);
//   }
//   return cli;
// }

// lib/prisma-tenant.ts
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