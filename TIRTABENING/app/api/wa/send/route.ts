import { callWaSender } from "../_utils";
export const runtime = "nodejs";

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    return callWaSender("/send", {
        method: "POST",
        body: JSON.stringify(body),
    });
}