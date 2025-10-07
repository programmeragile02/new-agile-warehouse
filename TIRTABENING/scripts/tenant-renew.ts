import { PrismaClient } from '@prisma/client';

function arg(name: string, def: string | null = null) {
  const pref = `--${name}=`;
  const f = process.argv.find(a => a.startsWith(pref));
  return f ? f.slice(pref.length) : def;
}

async function main() {
  const prisma = new PrismaClient();
  const endDate = arg('endDate', null);

  await prisma.mst_company.updateMany({
    data: { license_end_at: endDate as any },
  });

  await prisma.$disconnect();
  console.log('tenant-renew: done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});