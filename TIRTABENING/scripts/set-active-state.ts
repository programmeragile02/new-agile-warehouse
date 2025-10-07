import { PrismaClient } from '@prisma/client';

function arg(name: string, def: string | null = null) {
  const pref = `--${name}=`;
  const f = process.argv.find(a => a.startsWith(pref));
  return f ? f.slice(pref.length) : def;
}

async function main() {
  const prisma = new PrismaClient();
  const active = arg('active', '1') === '1';

  await prisma.mst_company.updateMany({
    data: { is_active: active },
  });

  await prisma.$disconnect();
  console.log('set-active-state: done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
