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

/** sanitize fallback filename */
function safeName(n?: string) {
    return String(n ?? `render-${Date.now()}`)
        .replace(/[\\/:*?"<>|]+/g, "_")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * renderKwitansiToJPG
 * - tplUrl: absolute URL to the print page (e.g. https://app.example.com/print/kwitansi/ID?payId=...)
 * - outName: desired output filename
 * - persist: true => save to disk and return api url (string). false => return { base64, filename }
 * - headers?: optional headers to forward (e.g. { cookie, "x-company-id": ... })
 */
export async function renderKwitansiToJPG(opts: {
    tplUrl: string;
    outName: string;
    persist?: boolean;
    headers?: Record<string, string>;
}): Promise<RenderOut> {
    const { tplUrl, outName, persist = true, headers } = opts;

    const relSegments = ["payment", "kwitansi", "img"];
    const absDir = resolveUploadPath(...relSegments);
    const absPath = resolveUploadPath(...relSegments, outName);
    const apiUrl = `/api/file/${relSegments.join("/")}/${outName}`;

    const browser = await getBrowser();
    const page = await browser.newPage();

    page.on("console", (msg) => {
        try {
            console.log("[kwitansi:console]", msg.text());
        } catch {}
    });
    page.on("pageerror", (err) => console.error("[kwitansi:error]", err));

    try {
        // viewport friendly for mobile-like receipt
        await page.setViewport({
            width: 380,
            height: 1000,
            deviceScaleFactor: 2,
        });

        // set extra HTTP headers if provided
        if (headers && Object.keys(headers).length > 0) {
            try {
                await page.setExtraHTTPHeaders(
                    headers as Record<string, string>
                );
            } catch (e) {
                console.warn(
                    "[kwitansi] setExtraHTTPHeaders failed:",
                    (e as any)?.message ?? e
                );
            }

            // If cookie header is present, set cookies on the page so Next's server-side render can read them
            const cookieHeader = headers["cookie"] || headers["Cookie"];
            if (cookieHeader) {
                try {
                    // Use tplUrl as url when setting cookies (puppeteer accepts url)
                    const urlForCookie = tplUrl;
                    const parts = cookieHeader
                        .split(";")
                        .map((s) => s.trim())
                        .filter(Boolean);
                    for (const p of parts) {
                        const idx = p.indexOf("=");
                        const name =
                            idx > -1 ? p.slice(0, idx).trim() : p.trim();
                        const value = idx > -1 ? p.slice(idx + 1).trim() : "";
                        if (!name) continue;
                        try {
                            await page.setCookie({
                                name,
                                value,
                                url: urlForCookie,
                                path: "/",
                            });
                        } catch (e) {
                            // ignore individual cookie failures
                        }
                    }
                } catch (e) {
                    // ignore cookie parse errors
                }
            }
        }

        // navigate
        await page.goto(tplUrl, { waitUntil: "networkidle2", timeout: 60_000 });

        // wait for paper selector (best-effort)
        await page
            .waitForSelector(".paper", { visible: true, timeout: 20_000 })
            .catch(() => {});

        // wait for fonts ready (best-effort)
        await page
            .evaluate(() => (document as any).fonts?.ready)
            .catch(() => {});

        // enforce white background and clear performance marks/measures to avoid "negative timestamp" issues
        await page
            .evaluate(() => {
                try {
                    (document.body as HTMLElement).style.background = "#ffffff";
                } catch {}
                try {
                    // @ts-ignore
                    performance.clearMarks?.();
                    // @ts-ignore
                    performance.clearMeasures?.();
                } catch {}
            })
            .catch(() => {});

        // screenshot target element if present, otherwise full page
        const el = await page.$(".paper");
        const buffer = el
            ? await el.screenshot({ type: "jpeg", quality: 90 })
            : await page.screenshot({
                  type: "jpeg",
                  quality: 90,
                  fullPage: true,
              });

        if (!persist) {
            return {
                base64: Buffer.from(buffer).toString("base64"),
                filename: safeName(outName),
                mimeType: "image/jpeg",
            };
        }

        // persist to disk and return api url path
        await fs.mkdir(absDir, { recursive: true });
        await fs.writeFile(absPath, buffer);
        return apiUrl;
    } finally {
        try {
            await page.close();
        } catch {}
    }
}
