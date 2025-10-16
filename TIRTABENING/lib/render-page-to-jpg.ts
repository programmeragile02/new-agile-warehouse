// import { getBrowser } from "./puppeteer-singleton";
// import path from "node:path";
// import fs from "node:fs/promises";
// import { resolveUploadPath } from "./uploads";

// export async function renderPageToJPG(opts: {
//   tplUrl: string;
//   outName: string;
//   subdir?: string; // default: "billing/img"
//   selector?: string; // default: ".paper"
// }) {
//   const { tplUrl, outName, subdir = "billing/img", selector = ".paper" } = opts;

//   // const imgDir = path.join(process.cwd(), "public", "uploads", subdir);
//   // await fs.mkdir(imgDir, { recursive: true });
//   // const outPath = path.join(imgDir, outName);
//   // const publicUrl = `/uploads/${subdir}/${outName}`;

//   const relSegments = subdir.split("/").filter(Boolean);
//   const absDir = resolveUploadPath(...relSegments);
//   await fs.mkdir(absDir, { recursive: true });
//   const absPath = resolveUploadPath(...relSegments, outName);
//   const apiUrl = `/api/file/${relSegments.join("/")}/${outName}`;

//   const browser = await getBrowser();
//   const page = await browser.newPage();

//   page.on("console", (m) => console.log("[render:console]", m.text()));
//   page.on("pageerror", (e) => console.error("[render:error]", e));

//   try {
//     await page.setViewport({ width: 380, height: 1200, deviceScaleFactor: 2 });
//     await page.goto(tplUrl, { waitUntil: "networkidle2", timeout: 60_000 });
//     try {
//       await page.waitForSelector(selector, { visible: true, timeout: 20_000 });
//     } catch {}
//     try {
//       await page.evaluate(() => (document as any).fonts?.ready);
//     } catch {}
//     await page.evaluate(() => {
//       document.body.style.background = "#ffffff";
//     });

//     const el = await page.$(selector);
//     const buffer = el
//       ? await el.screenshot({ type: "jpeg", quality: 90 })
//       : await page.screenshot({ type: "jpeg", quality: 90, fullPage: true });

//     await fs.writeFile(absPath, buffer);
//     return apiUrl;
//   } finally {
//     try {
//       await page.close();
//     } catch {}
//   }
// }

// lib/render-page-to-jpg.ts
// import { getBrowser } from "./puppeteer-singleton";
// import fs from "node:fs/promises";
// import path from "node:path";
// import { resolveUploadPath } from "./uploads";

// type RenderOpts = {
//   tplUrl: string;
//   outName: string;
//   subdir?: string; // hanya dipakai jika persist=true
//   selector?: string; // default ".paper"
//   persist?: boolean; // default false → EPHEMERAL (return base64)
// };

// /** Render halaman umum (tagihan, dll) ke JPG. */
// export async function renderPageToJPG(
//   opts: RenderOpts
// ): Promise<string | { base64: string; filename: string }> {
//   const {
//     tplUrl,
//     outName,
//     subdir = "billing/img",
//     selector = ".paper",
//     persist = false,
//   } = opts;

//   const relSegments = subdir.split("/").filter(Boolean);
//   const absDir = resolveUploadPath(...relSegments);
//   const absPath = resolveUploadPath(...relSegments, outName);
//   const apiUrl = `/api/file/${relSegments.join("/")}/${outName}`;

//   const browser = await getBrowser();
//   const page = await browser.newPage();

//   page.on("console", (m) => console.log("[render:console]", m.text()));
//   page.on("pageerror", (e) => console.error("[render:error]", e));

//   try {
//     await page.setViewport({ width: 380, height: 1200, deviceScaleFactor: 2 });
//     await page.goto(tplUrl, { waitUntil: "networkidle2", timeout: 60_000 });

//     try {
//       await page.waitForSelector(selector, { visible: true, timeout: 20_000 });
//     } catch {}
//     try {
//       await page.evaluate(() => (document as any).fonts?.ready);
//     } catch {}

//     await page.evaluate(() => {
//       document.body.style.background = "#ffffff";
//     });

//     const el = await page.$(selector);
//     const buffer = el
//       ? await el.screenshot({ type: "jpeg", quality: 85 })
//       : await page.screenshot({ type: "jpeg", quality: 85, fullPage: true });

//     if (!persist) {
//       return { base64: buffer.toString("base64"), filename: outName };
//     }

//     await fs.mkdir(absDir, { recursive: true });
//     await fs.writeFile(absPath, buffer);
//     return apiUrl;
//   } finally {
//     try {
//       await page.close();
//     } catch {}
//   }
// }

// import { getBrowser } from "./puppeteer-singleton";
// import fs from "node:fs/promises";
// import { resolveUploadPath } from "./uploads";

// export type RenderOut =
//     | string
//     | {
//           base64: string;
//           filename: string;
//           mimeType: "image/jpeg";
//       };

// export async function renderPageToJPG(opts: {
//     tplUrl: string;
//     outName: string;
//     subdir?: string; // default: "billing/img"
//     selector?: string; // default: ".paper"
//     persist?: boolean; // default: true
// }): Promise<RenderOut> {
//     const {
//         tplUrl,
//         outName,
//         subdir = "billing/img",
//         selector = ".paper",
//         persist = true,
//     } = opts;

//     const relSegments = subdir.split("/").filter(Boolean);
//     const absDir = resolveUploadPath(...relSegments);
//     const absPath = resolveUploadPath(...relSegments, outName);
//     const apiUrl = `/api/file/${relSegments.join("/")}/${outName}`;

//     const browser = await getBrowser();
//     const page = await browser.newPage();

//     page.on("console", (m) => console.log("[render:console]", m.text()));
//     page.on("pageerror", (e) => console.error("[render:error]", e));

//     try {
//         await page.setViewport({
//             width: 380,
//             height: 1200,
//             deviceScaleFactor: 2,
//         });
//         await page.goto(tplUrl, { waitUntil: "networkidle2", timeout: 60_000 });
//         await page
//             .waitForSelector(selector, { visible: true, timeout: 20_000 })
//             .catch(() => {});
//         await page
//             .evaluate(() => (document as any).fonts?.ready)
//             .catch(() => {});
//         await page.evaluate(() => {
//             document.body.style.background = "#ffffff";
//         });

//         const el = await page.$(selector);
//         const buffer = el
//             ? await el.screenshot({ type: "jpeg", quality: 90 })
//             : await page.screenshot({
//                   type: "jpeg",
//                   quality: 90,
//                   fullPage: true,
//               });

//         if (!persist) {
//             return {
//                 base64: Buffer.from(buffer).toString("base64"),
//                 filename: outName,
//                 mimeType: "image/jpeg",
//             };
//         }

//         await fs.mkdir(absDir, { recursive: true });
//         await fs.writeFile(absPath, buffer);
//         return apiUrl;
//     } finally {
//         try {
//             await page.close();
//         } catch {}
//     }
// }

// lib/render-page-to-jpg.ts
import { getBrowser } from "./puppeteer-singleton";
import fs from "node:fs/promises";
import { resolveUploadPath } from "./uploads";

export type RenderOut =
    | string
    | {
          base64: string;
          filename: string;
          mimeType: "image/jpeg";
      };

function safeFilename(name: string | undefined) {
    const n = String(name ?? "")
        .replace(/[\u0000-\u001F\\/:*?"<>|]+/g, "_")
        .replace(/\s+/g, " ")
        .trim();
    return n || `render-${Date.now()}.jpg`;
}

export async function renderPageToJPG(opts: {
    tplUrl: string;
    outName?: string;
    subdir?: string; // default: "billing/img"
    selector?: string; // default: ".paper"
    persist?: boolean; // default: true
    headers?: Record<string, string>; // <-- baru: forward headers (cookie, x-company-id, etc)
}): Promise<RenderOut> {
    const {
        tplUrl,
        outName,
        subdir = "billing/img",
        selector = ".paper",
        persist = true,
        headers,
    } = opts;

    const filename = safeFilename(outName);
    const relSegments = subdir.split("/").filter(Boolean);
    const absDir = resolveUploadPath(...relSegments);
    const absPath = resolveUploadPath(...relSegments, filename);
    const apiUrl = `/api/file/${relSegments.join("/")}/${filename}`;

    const browser = await getBrowser();
    const page = await browser.newPage();

    page.on("console", (m) => console.log("[render:console]", m.text()));
    page.on("pageerror", (e) => console.error("[render:error]", e));

    try {
        await page.setViewport({
            width: 380,
            height: 1200,
            deviceScaleFactor: 2,
        });

        // <<-- set extra headers (forward cookies/auth/company header)
        if (headers && Object.keys(headers).length > 0) {
            try {
                await page.setExtraHTTPHeaders(headers);
            } catch (e) {
                console.warn("[render] setExtraHTTPHeaders failed", e);
            }
        }

        await page.goto(tplUrl, { waitUntil: "networkidle2", timeout: 60_000 });

        await page
            .waitForSelector(selector, { visible: true, timeout: 20_000 })
            .catch(() => {});
        await Promise.race([
            page.evaluate(() => (document as any).fonts?.ready),
            new Promise((res) => setTimeout(res, 2000)),
        ]).catch(() => {});

        // clear performance marks/measures to avoid negative timestamp errors
        await page
            .evaluate(() => {
                try {
                    (performance as any).clearMarks?.();
                    (performance as any).clearMeasures?.();
                } catch (e) {}
            })
            .catch(() => {});

        await page
            .evaluate(() => {
                try {
                    (document.body as HTMLElement).style.background = "#ffffff";
                } catch (e) {}
            })
            .catch(() => {});

        const el = await page.$(selector);

        let buffer: Buffer;
        try {
            if (el) {
                const b = await el.screenshot({ type: "jpeg", quality: 90 });
                buffer = Buffer.from(b);
            } else {
                const b = await page.screenshot({
                    type: "jpeg",
                    quality: 90,
                    fullPage: true,
                });
                buffer = Buffer.from(b);
            }
        } catch (err: any) {
            console.error("[render:screenshot failed]", err?.message ?? err);
            // fallback attempt
            try {
                const b = await page.screenshot({
                    type: "jpeg",
                    quality: 80,
                    fullPage: true,
                });
                buffer = Buffer.from(b);
            } catch (err2: any) {
                console.error(
                    "[render:screenshot fallback failed]",
                    err2?.message ?? err2
                );
                throw err2;
            }
        }

        if (!persist) {
            return {
                base64: buffer.toString("base64"),
                filename,
                mimeType: "image/jpeg",
            };
        }

        await fs.mkdir(absDir, { recursive: true });
        await fs.writeFile(absPath, buffer);

        return apiUrl;
    } finally {
        try {
            await page.close();
        } catch {}
    }
}
