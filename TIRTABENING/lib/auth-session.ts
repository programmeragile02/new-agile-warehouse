import "server-only";
import crypto from "crypto";
const secret = (process.env.AUTH_SECRET ?? "dev-secret") as string;

function hmac(str: string) {
  return crypto.createHmac("sha256", secret).update(str).digest("base64url");
}

export function encodeCookie<T extends object>(payload: T) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = hmac(data);
  return `${data}.${sig}`;
}

export function decodeCookie<T = any>(cookie?: string | null): T | null {
  if (!cookie) return null;
  const [data, sig] = cookie.split(".");
  if (!data || !sig) return null;
  if (hmac(data) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}
