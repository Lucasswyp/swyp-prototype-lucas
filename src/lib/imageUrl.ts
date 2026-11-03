// Een productfoto moet een plaatje zijn. Vroeger kon daar per ongeluk het videobestand zelf staan
// (een .mov uit de opslag); dat laat een kapot plaatje zien en kan honderden MB's ophalen.
const VIDEO_FILE = /\.(mov|mp4|m4v|webm|m3u8)(\?|#|$)/i;

export function isUsableImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) return false;
  return !VIDEO_FILE.test(url);
}

/** Het eerste bruikbare plaatje uit de lijst, of een lege tekst. */
export function firstUsableImage(...urls: (string | null | undefined)[]): string {
  return urls.find(isUsableImageUrl) ?? "";
}
