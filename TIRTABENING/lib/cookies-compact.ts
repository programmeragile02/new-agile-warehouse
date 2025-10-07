// lib/cookies-compat.ts
import { cookies } from "next/headers";

/** Selalu mengembalikan CookieStore, baik Next 13/14 (sync) maupun 15 (async). */
export async function getCookieStore() {
  const c = cookies() as unknown as Promise<ReturnType<typeof cookies>> | ReturnType<typeof cookies>;
  // @ts-ignore - detect promise
  return typeof (c as any)?.then === "function" ? await (c as any) : (c as any);
}
