import { PrismaClient } from '@prisma/client';

function arg(name: string, def: string | null = null) {
  const pref = `--${name}=`;
  const f = process.argv.find(a => a.startsWith(pref));
  return f ? f.slice(pref.length) : def;
}

function featuresFor(pkgCode?: string) {
  const code = String(pkgCode || '').toUpperCase();
  switch (code) {
    case 'BASIC':
      return [{ key:'ADV_REPORT', enabled:false }, { key:'MULTI_BRANCH', enabled:false }];
    case 'PREMIUM':
      return [{ key:'ADV_REPORT', enabled:true  }, { key:'MULTI_BRANCH', enabled:false }];
    case 'ULTIMATE':
      return [{ key:'ADV_REPORT', enabled:true  }, { key:'MULTI_BRANCH', enabled:true  }];
    default:
      return [];
  }
}

async function main() {
  const prisma = new PrismaClient();
  const pkgCode = arg('pkgCode', '');

  const items = featuresFor(pkgCode);
  for (const it of items) {
    await prisma.feature_flags.upsert({
      where: { key: it.key },
      update: { enabled: it.enabled },
      create: { key: it.key, enabled: it.enabled },
    });
  }

  await prisma.$disconnect();
  console.log('set-package-flags: done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
