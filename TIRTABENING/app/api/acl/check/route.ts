// app/api/acl/check/route.ts
import { NextResponse } from "next/server";
import { checkAclForCurrentUser } from "@/lib/acl";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const path = url.searchParams.get("path") || "/";
        const actionParam = (
            url.searchParams.get("action") || "view"
        ).toLowerCase();

        if (!["view", "add", "edit", "delete"].includes(actionParam)) {
            return NextResponse.json(
                { ok: false, error: "Invalid action" },
                { status: 400 }
            );
        }

        const allowed = await checkAclForCurrentUser(path, actionParam as any);
        return NextResponse.json({ ok: true, allowed });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}
