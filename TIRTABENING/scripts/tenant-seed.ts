// scripts/tenant-seed.ts
import { PrismaClient } from '@prisma/client';

(async () => {
  const prisma = new PrismaClient();
  // TODO: isi seed tenant khusus jika dibutuhkan
  await prisma.$disconnect();
  console.log('tenant-seed: no-op');
})();
