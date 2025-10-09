import { NextResponse } from "next/server";
import { getOnboardingState } from "@/lib/onboarding";

export async function GET() {
    const state = await getOnboardingState();
    return NextResponse.json(state);
}
