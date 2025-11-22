import { getTenantPrismaOrThrow } from "@/lib/tenant-context";

async function main() {
  const prisma = await getTenantPrismaOrThrow(process.env.NEXT_PUBLIC_PRODUCT_CODE!);
  for (const name of ["ADMIN", "PETUGAS", "WARGA"]) {
    await prisma.appRole.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} default`, isActive: true },
    });
  }
}
main();