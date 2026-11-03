import { test as base, expect } from "@playwright/test";

// Elke test laadt de feed. Zonder dit haalt elke run de volledige video's op bij
// Supabase Storage en Mux, en dat telde op tot een overschrijding van de gratis
// limiet voor "cached egress". De tests controleren de pagina, niet de beelden.
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.route(/\.(mp4|mov|m4v|webm|m3u8|m4s|ts)(\?|$)/i, (route) => route.abort());
    await page.route(/^https:\/\/(stream|image)\.mux\.com\//, (route) => route.abort());
    await provide(page);
  },
});

export { expect };
