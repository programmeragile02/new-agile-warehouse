const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/** Ambil daftar aksi dari backend */
export async function fetchActions(entity: string, position?: string) {
  const url = new URL(`${API}/${entity}/actions`);
  if (position) url.searchParams.set("position", position);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Jalankan satu aksi */
export async function runAction(entity: string, key: string, body?: any) {
  const isGet = !body || Object.keys(body || {}).length === 0;
  const url = `${API}/${entity}/actions/${key}`;
  const res = await fetch(url, {
    method: isGet ? "GET" : "POST",
    headers: isGet ? undefined : { "Content-Type": "application/json" },
    body: isGet ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // untuk aksi export bisa diubah ke blob
}
