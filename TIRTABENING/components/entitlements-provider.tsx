// // components/entitlements-provider.tsx
// "use client";

// import React, {
//     createContext,
//     useContext,
//     useEffect,
//     useMemo,
//     useState,
// } from "react";

// type Ctx = {
//     loading: boolean;
//     features: Set<string>;
//     menus: Set<string>;
//     canFeature: (code: string) => boolean;
//     canAnyFeature: (codes: string[]) => boolean;
//     canMenu: (routeOrCode: string) => boolean;
//     refresh: () => Promise<void>;
// };

// const EntitlementsCtx = createContext<Ctx>({
//     loading: true,
//     features: new Set(),
//     menus: new Set(),
//     canFeature: () => false,
//     canAnyFeature: () => false,
//     canMenu: () => false,
//     refresh: async () => {},
// });

// function norm(s: any) {
//     return String(s ?? "")
//         .trim()
//         .toUpperCase();
// }

// // simpan offering (paket) tenant — kamu bebas pilih sumbernya
// function getOffering(): string {
//     if (typeof window === "undefined") return "basic";
//     return localStorage.getItem("tb_offering") || "basic"; // "basic" | "pro" | ...
// }

// const PRODUCT_CODE =
//     process.env.NEXT_PUBLIC_PRODUCT_CODE ||
//     process.env.PRODUCT_CODE ||
//     "TIRTABENING";

// export function EntitlementsProvider({
//     children,
// }: {
//     children: React.ReactNode;
// }) {
//     const [loading, setLoading] = useState(true);
//     const [features, setFeatures] = useState<Set<string>>(new Set());
//     const [menus, setMenus] = useState<Set<string>>(new Set());

//     const fetchMatrix = async () => {
//         setLoading(true);
//         try {
//             const pkg = getOffering();
//             const url = `/api/public/catalog/offerings/${encodeURIComponent(
//                 PRODUCT_CODE
//             )}/${encodeURIComponent(pkg)}/matrix?include=features,menus`;

//             const res = await fetch(url, { cache: "no-store" });
//             const json = await res.json().catch(() => ({}));

//             if (!res.ok || json?.ok === false) {
//                 setFeatures(new Set());
//                 setMenus(new Set());
//                 setLoading(false);
//                 return;
//             }

//             const feat = new Set<string>();
//             for (const f of json?.data?.features || json?.features || []) {
//                 const active =
//                     f?.enabled === undefined
//                         ? f?.is_active !== false
//                         : !!f.enabled;
//                 const code = norm(f?.feature_code || f?.code);
//                 if (code && active) feat.add(code);
//             }

//             const mset = new Set<string>();
//             for (const m of json?.data?.menus || json?.menus || []) {
//                 const active =
//                     m?.enabled === undefined
//                         ? m?.is_active !== false
//                         : !!m.enabled;
//                 // kamu bisa pakai route_path atau menu_code—sesuaikan dengan panel
//                 const key = norm(m?.menu_code || m?.route_path || m?.path);
//                 if (key && active) mset.add(key);
//             }

//             setFeatures(feat);
//             setMenus(mset);
//         } catch {
//             setFeatures(new Set());
//             setMenus(new Set());
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchMatrix();
//     }, []);

//     const value = useMemo<Ctx>(
//         () => ({
//             loading,
//             features,
//             menus,
//             canFeature: (code: string) => features.has(norm(code)),
//             canAnyFeature: (codes: string[]) =>
//                 codes.some((c) => features.has(norm(c))),
//             canMenu: (routeOrCode: string) => menus.has(norm(routeOrCode)),
//             refresh: fetchMatrix,
//         }),
//         [loading, features, menus]
//     );

//     return (
//         <EntitlementsCtx.Provider value={value}>
//             {children}
//         </EntitlementsCtx.Provider>
//     );
// }

// export function useEntitlements() {
//     return useContext(EntitlementsCtx);
// }
// components/entitlements-provider.tsx
// "use client";

// import React, {
//     createContext,
//     useContext,
//     useEffect,
//     useMemo,
//     useRef,
//     useState,
// } from "react";

// type Ctx = {
//     loading: boolean;
//     offering: string;
//     features: Set<string>; // berisi kode fitur yg AKTIF utk paket
//     canFeature: (code: string) => boolean;
//     canAnyFeature: (codes: string[]) => boolean;
//     refresh: () => Promise<void>;
// };

// const CtxDefault: Ctx = {
//     loading: true,
//     offering: "basic",
//     features: new Set(),
//     canFeature: () => false,
//     canAnyFeature: () => false,
//     refresh: async () => {},
// };

// const EntitlementsCtx = createContext<Ctx>(CtxDefault);

// /* ------------- helpers ------------- */

// const PRODUCT_CODE =
//     process.env.NEXT_PUBLIC_PRODUCT_CODE ||
//     process.env.PRODUCT_CODE ||
//     "TIRTABENING";

// const norm = (s: unknown) =>
//     String(s ?? "")
//         .trim()
//         .toLowerCase();

// function readOffering(): string {
//     // 1) cookie
//     try {
//         const c = document.cookie
//             .split("; ")
//             .find((x) => x.startsWith("tb_offering="));
//         if (c) {
//             const v = decodeURIComponent(c.split("=")[1] || "");
//             if (v) return v;
//         }
//     } catch {}
//     // 2) localStorage
//     try {
//         const v = localStorage.getItem("tb_offering");
//         if (v) return v;
//     } catch {}
//     return "basic";
// }

// /** exact atau wildcard eksplisit: "wa.*" mengizinkan "wa.notif.tagihan" */
// function matchFeature(granted: string, wanted: string) {
//     if (granted === wanted) return true;
//     if (granted.endsWith(".*")) {
//         const base = granted.slice(0, -2); // buang .*
//         return wanted === base || wanted.startsWith(base + ".");
//     }
//     return false;
// }

// /* ------------- provider ------------- */

// export function EntitlementsProvider({
//     children,
// }: {
//     children: React.ReactNode;
// }) {
//     const [loading, setLoading] = useState(true);
//     const [offering, setOffering] = useState<string>("basic");
//     const [featureSet, setFeatureSet] = useState<Set<string>>(new Set());
//     const lastOfferingRef = useRef<string>("");

//     const load = async (force?: boolean) => {
//         setLoading(true);
//         try {
//             // baca offering terkini
//             const cur = readOffering();
//             if (
//                 !force &&
//                 cur === lastOfferingRef.current &&
//                 featureSet.size > 0
//             ) {
//                 setLoading(false);
//                 return;
//             }
//             lastOfferingRef.current = cur;
//             setOffering(cur);

//             const url = `/api/public/catalog/offerings/${encodeURIComponent(
//                 PRODUCT_CODE
//             )}/${encodeURIComponent(cur)}/matrix?include=features`;

//             const res = await fetch(url, { cache: "no-store" });
//             const json = await res.json().catch(() => ({}));

//             if (!res.ok || json?.ok === false) {
//                 setFeatureSet(new Set());
//                 setLoading(false);
//                 return;
//             }

//             const features = (json?.data?.features ||
//                 json?.features ||
//                 []) as Array<{
//                 feature_code?: string;
//                 code?: string;
//                 is_active?: boolean;
//                 enabled?: boolean;
//             }>;

//             const next = new Set<string>();
//             for (const f of features) {
//                 const code = norm(f?.feature_code ?? f?.code);
//                 if (!code) continue;

//                 // aktif kalau enabled === true ATAU (enabled undefined dan is_active !== false)
//                 const enabled =
//                     typeof f.enabled === "boolean"
//                         ? f.enabled
//                         : f.is_active !== false;

//                 if (!enabled) continue;

//                 // simpan apa adanya (boleh menyertakan wildcard eksplisit *. LARANG simpan parent generik)
//                 next.add(code);
//             }

//             setFeatureSet(next);
//         } catch {
//             setFeatureSet(new Set());
//         } finally {
//             setLoading(false);
//         }
//     };

//     // initial load
//     useEffect(() => {
//         load(true);
//         // perubahan paket via localStorage trigger refresh
//         const onStorage = (e: StorageEvent) => {
//             if (e.key === "tb_offering") load(true);
//         };
//         window.addEventListener("storage", onStorage);
//         return () => window.removeEventListener("storage", onStorage);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     const canFeature = useMemo(() => {
//         return (code: string) => {
//             const wanted = norm(code);
//             if (!wanted) return false;
//             // cek exact & wildcard eksplisit (*. )
//             for (const g of featureSet) {
//                 if (matchFeature(g, wanted)) return true;
//             }
//             return false;
//         };
//     }, [featureSet]);

//     const canAnyFeature = useMemo(() => {
//         return (codes: string[]) => codes.some((c) => canFeature(c));
//     }, [canFeature]);

//     const value: Ctx = {
//         loading,
//         offering,
//         features: featureSet,
//         canFeature,
//         canAnyFeature,
//         refresh: () => load(true),
//     };

//     return (
//         <EntitlementsCtx.Provider value={value}>
//             {children}
//         </EntitlementsCtx.Provider>
//     );
// }

// export function useEntitlements() {
//     return useContext(EntitlementsCtx);
// }

"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type Ctx = {
  loading: boolean;
  offering: string;
  features: Set<string>;
  canFeature: (code: string) => boolean;
  canAnyFeature: (codes: string[]) => boolean;
  refresh: () => Promise<void>;
};

const CtxDefault: Ctx = {
  loading: true,
  offering: "basic",
  features: new Set(),
  canFeature: () => false,
  canAnyFeature: () => false,
  refresh: async () => {},
};
const EntitlementsCtx = createContext<Ctx>(CtxDefault);

const PRODUCT_CODE =
  process.env.NEXT_PUBLIC_PRODUCT_CODE || process.env.PRODUCT_CODE || "TIRTABENING";

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

function readCookie(name: string): string | undefined {
  try {
    const c = document.cookie.split("; ").find((x) => x.startsWith(name + "="));
    if (!c) return;
    return decodeURIComponent(c.split("=")[1] || "");
  } catch {
    return;
  }
}
function readOffering() {
  return readCookie("tb_offering") || "basic";
}
function readCompany() {
  return readCookie("tb_company") || "";
}
function readAddons(companyId: string): Set<string> {
  if (!companyId) return new Set();
  try {
    const raw = readCookie(`tb_addons__${companyId}`) || "[]";
    const arr = JSON.parse(raw) as string[];
    return new Set(arr.map(norm)); // simpan lowercase internal
  } catch {
    // back-compat utk cookie lama (encoded)
    try {
      const arr = JSON.parse(decodeURIComponent(readCookie(`tb_addons__${companyId}`) || "[]")) as string[];
      return new Set(arr.map(norm));
    } catch {
      return new Set();
    }
  }
}

// wildcard: "export.excel.*" mengizinkan "export.excel.laporan.status.pembayaran"
function match(granted: string, wanted: string) {
  if (granted === wanted) return true;
  if (granted.endsWith(".*")) {
    const base = granted.slice(0, -2);
    return wanted === base || wanted.startsWith(base + ".");
  }
  return false;
}

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState("basic");
  const [featureSet, setFeatureSet] = useState<Set<string>>(new Set());
  const lastKeyRef = useRef<string>("");

  const load = async (force?: boolean) => {
    setLoading(true);
    try {
      const company = readCompany();
      const offer = readOffering();
      const addons = readAddons(company); // ⬅️ diambil dulu; tidak bergantung matrix
      const key = `${company}|${offer}`;

      if (!force && key === lastKeyRef.current && featureSet.size > 0) {
        setLoading(false);
        return;
      }
      lastKeyRef.current = key;
      setOffering(offer);

      // --- Ambil fitur dari paket (matrix). Walau error, add-on tetap digabung. ---
      let fromPackage = new Set<string>();
      try {
        const url = `/api/public/catalog/offerings/${encodeURIComponent(
          PRODUCT_CODE
        )}/${encodeURIComponent(offer)}/matrix?include=features`;
        const res = await fetch(url, { cache: "no-store" }).catch(() => null as any);
        if (res && res.ok) {
          const json = await res.json().catch(() => ({}));
          const feats = (json?.data?.features || json?.features || []) as Array<any>;
          const next = new Set<string>();
          for (const f of feats) {
            const code = norm(f?.feature_code ?? f?.code);
            if (!code) continue;
            const enabled = typeof f?.enabled === "boolean" ? f.enabled : f?.is_active !== false;
            if (enabled) next.add(code);
          }
          fromPackage = next;
        }
      } catch {
        // abaikan; fromPackage tetap kosong
      }

      // --- UNION paket + add-on (semua sudah lowercase) ---
      const merged = new Set<string>([...fromPackage, ...addons]);
      setFeatureSet(merged);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "tb_offering" || e.key === "tb_company" || e.key.startsWith("tb_addons__")) {
        load(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canFeature = useMemo(
    () => (code: string) => {
      const wanted = norm(code);
      for (const g of featureSet) if (match(g, wanted)) return true;
      return false;
    },
    [featureSet]
  );

  const canAnyFeature = useMemo(() => (codes: string[]) => codes.some((c) => canFeature(c)), [canFeature]);

  return (
    <EntitlementsCtx.Provider
      value={{ loading, offering, features: featureSet, canFeature, canAnyFeature, refresh: () => load(true) }}
    >
      {children}
    </EntitlementsCtx.Provider>
  );
}

export function useEntitlements() {
  return useContext(EntitlementsCtx);
}