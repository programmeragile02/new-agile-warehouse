import { NextResponse } from "next/server";
import { getOnboardingState } from "@/lib/onboarding";
import { db } from "@/lib/db";

export async function GET() {
    const prisma = await db();

    const setting = await prisma.setting.findUnique({ where: { id: 1 } });
    const onboardingCompleted = setting?.onboardingCompleted ?? false;

    const { completedKeys, progressPct } = await getOnboardingState();

    return NextResponse.json({
        completedKeys,
        progressPct,
        onboardingCompleted,
    });
}
