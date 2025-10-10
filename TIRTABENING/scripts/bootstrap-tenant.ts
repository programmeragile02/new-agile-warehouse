// scripts/bootstrap-tenant.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ulid } from 'ulid';

function arg(name: string, def: string | null = null) {
  const p = `--${name}=`;
  const f = process.argv.find(a => a.startsWith(p));
  return f ? f.slice(p.length) : def;
}

async function main() {
  const prisma = new PrismaClient();

  const companyId  = arg('companyId')!;            // contoh: TIRTABENING_365939
  let companyPassHash = arg('companyPassHash');     // hash dari Warehouse; boleh kosong
  const adminUser  = arg('adminUser')!;            // ini masuk ke User.username
  const adminPass  = arg('adminPass')!;

  if (!companyPassHash && adminPass) {
    companyPassHash = await bcrypt.hash(adminPass, 12);
  }

  // 1) Upsert MstCompany by unique company_id
  await prisma.mstCompany.upsert({
    where: { company_id: companyId },        // <-- ini valid karena @unique
    update: {
      password: companyPassHash!,
      updated_at: new Date(),
    },
    create: {
      // per schema kamu, PK id tidak dipakai relasi; yang unik adalah company_id
      // jika ingin ada kolom id juga, Prisma akan generate otomatis jika kamu set @id — di schema ini id @db.Char(26) adalah PK
      id: ulid(),                 
      company_id: companyId,
      password:   companyPassHash!,
      name:       'Default Company',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  // 2) Upsert admin User by username + set companyId = company_id (relasi ke MstCompany.company_id)
  const adminHash = await bcrypt.hash(adminPass, 12);

  await prisma.user.upsert({
    where: { username: adminUser },
    update: {
      passwordHash: adminHash,
      isActive: true,
      role: 'ADMIN',
      name: 'Administrator',
      companyId: companyId,                  // <-- link ke MstCompany.company_id
      mustChangePassword: true,
      updatedAt: new Date(),
    },
    create: {
      username: adminUser,
      passwordHash: adminHash,
      name: 'Administrator',
      role: 'ADMIN',
      isActive: true,
      companyId: companyId,                  // <-- link ke MstCompany.company_id
      mustChangePassword: true,
      // createdAt/updatedAt diisi Prisma
    },
  });

  await prisma.$disconnect();
  console.log('bootstrap-tenant: done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
