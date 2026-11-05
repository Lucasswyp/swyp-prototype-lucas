// Opstartafbeeldingen voor Swyp op het beginscherm van een iPhone. Zonder deze toont iOS eerst een wit
// scherm. Eén per schermmaat (breedte x hoogte in CSS-pixels, dichtheid), staand.
export interface StartupSize {
  w: number;
  h: number;
  ratio: number;
}

export const STARTUP_SIZES: StartupSize[] = [
  { w: 430, h: 932, ratio: 3 },
  { w: 428, h: 926, ratio: 3 },
  { w: 402, h: 874, ratio: 3 },
  { w: 393, h: 852, ratio: 3 },
  { w: 390, h: 844, ratio: 3 },
  { w: 414, h: 896, ratio: 3 },
  { w: 414, h: 896, ratio: 2 },
  { w: 414, h: 736, ratio: 3 },
  { w: 375, h: 812, ratio: 3 },
  { w: 375, h: 667, ratio: 2 },
];

export const startupFile = (s: StartupSize) => `${s.w * s.ratio}x${s.h * s.ratio}`;

export function parseStartupFile(file: string): { width: number; height: number } | null {
  const m = /^(\d{3,4})x(\d{3,4})\.png$/.exec(file) ?? /^(\d{3,4})x(\d{3,4})$/.exec(file);
  if (!m) return null;
  const width = Number(m[1]);
  const height = Number(m[2]);
  const known = STARTUP_SIZES.some((s) => s.w * s.ratio === width && s.h * s.ratio === height);
  return known ? { width, height } : null;
}

/** Voor de <link rel="apple-touch-startup-image"> tags. */
export const startupImageLinks = STARTUP_SIZES.map((s) => ({
  url: `/startup/${startupFile(s)}`,
  media: `(device-width: ${s.w}px) and (device-height: ${s.h}px) and (-webkit-device-pixel-ratio: ${s.ratio}) and (orientation: portrait)`,
}));
