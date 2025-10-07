import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const companyKey = "TIRTABENING_1234";        // ganti 'xxx' sesuai kebutuhan
  const rawPassword = "admin123";       // password untuk login company (contoh)
  const hash = bcrypt.hashSync(rawPassword, 10);

  // bikin ID 26 char (kolom kamu CHAR(26))
  const id26 = Math.random().toString(36).slice(2).padEnd(26, "x").slice(0, 26);

  // 1) upsert company (by company_id)
  await prisma.mstCompany.upsert({
    where: { company_id: companyKey },
    update: {
      password: hash,
      updated_at: new Date(),
    },
    create: {
      id: id26,
      company_id: companyKey,
      password: hash,
      name: "Default Company",        // opsional
    },
  });

  // 2) link ke user admin kamu (pakai id user di screenshot)
  await prisma.user.update({
    where: { id: "cmg8um6vn00000v3c7uz9m0g4" }, // ganti dengan id user kamu
    data: { companyId: companyKey },
  });

  console.log("✅ Company dibuat & dilink ke user.");
}

main().finally(() => prisma.$disconnect());