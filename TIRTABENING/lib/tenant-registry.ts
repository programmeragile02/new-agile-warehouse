import "server-only";

export type TenantInfo = {
  companyId: string;
  productCode: string;
  dbUrl: string;
  packageCode?: string;
  appUrl?: string;
  subscriptionInstanceId?: string;
};

export async function resolveTenant(
  companyId: string,
  productCode: string
): Promise<TenantInfo | null> {
  const base = process.env.WAREHOUSE_BASE!;
  const key = process.env.WAREHOUSE_API_KEY!;
  if (!base || !key) throw new Error("WAREHOUSE_BASE/WAREHOUSE_API_KEY missing");

  const url =
    `${base.replace(/\/+$/, "")}` +
    `/api/tenants/resolve?company_id=${encodeURIComponent(companyId)}` +
    `&product_code=${encodeURIComponent(productCode)}`;

  const res = await fetch(url, {
    headers: { "X-API-KEY": key },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const j = await res.json().catch(() => null);
  if (!j?.ok) return null;

  return {
    companyId: j.data.company_id,
    productCode: j.data.product_code,
    dbUrl: j.data.db_url,            
    packageCode: j.data.package_code ?? undefined,
    appUrl: j.data.app_url ?? undefined,
    subscriptionInstanceId: j.data.subscription_instance_id ?? undefined,
  };
}
