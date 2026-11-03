import { readFileSync } from "node:fs";
import { join } from "node:path";

// Het echte logo (public/brand) als data-URL, voor de gegenereerde plaatjes
// (favicon, app-icoon, deelplaatje). Alleen op de server gebruiken.
const cache = new Map<string, string>();

export function brandDataUrl(file: "swyp-logo.png" | "swyp-icon.png" | "swyp-logo-compact.png") {
  let url = cache.get(file);
  if (!url) {
    const buf = readFileSync(join(process.cwd(), "public", "brand", file));
    url = `data:image/png;base64,${buf.toString("base64")}`;
    cache.set(file, url);
  }
  return url;
}

export const BRAND_BG = "#0B0A2E";
