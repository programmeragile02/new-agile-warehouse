import { db } from "@/lib/db";

export async function POST() {
    const prisma = await db();

    await prisma.setting.update({
        where: { id: 1 },
        data: {
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
        },
    });

    return Response.json({ success: true });
}
