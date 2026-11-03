// Instagram Reels, TikTok en YouTube Shorts gebruiken allemaal staand 9:16 (1080 x 1920).
// Zo'n video vult in Swyp het hele scherm. Een ander formaat (vierkant, 4:5, liggend) wordt
// niet afgesneden maar volledig getoond, met een vervaagde achtergrond eromheen.

export const IDEAL_VIDEO_RATIO = 9 / 16;
// Hoeveel een video mag afwijken van 9:16 om nog schermvullend te zijn (telefoons verschillen
// een paar procent in verhouding).
const TOLERANCE = 0.12;

export type VideoFit = "cover" | "contain";

export function videoFit(width: number, height: number): VideoFit {
  if (!width || !height) return "cover";
  const deviation = Math.abs(width / height - IDEAL_VIDEO_RATIO) / IDEAL_VIDEO_RATIO;
  return deviation <= TOLERANCE ? "cover" : "contain";
}

/** Korte uitleg voor het uploadscherm. */
export function describeVideoFormat(width: number, height: number): { ok: boolean; text: string } {
  if (!width || !height) return { ok: true, text: "" };
  if (videoFit(width, height) === "cover") {
    return { ok: true, text: `Goed formaat (${width} × ${height}): vult het hele scherm, net als Instagram Reels en TikTok.` };
  }
  const landscape = width > height;
  return {
    ok: false,
    text: `Dit is ${landscape ? "een liggende of vierkante" : "geen 9:16"} video (${width} × ${height}). Hij wordt zonder af te snijden getoond met een vervaagde rand. Staand 9:16 (1080 × 1920) vult het scherm het mooist.`,
  };
}

// Langste toegestane video: één minuut, net als een korte Reel.
export const MAX_VIDEO_SECONDS = 60;
// Kleine marge voor afrondingen in het videobestand.
export const MAX_VIDEO_SECONDS_TOLERANCE = 1;

export function isVideoTooLong(durationSeconds: number): boolean {
  return Number.isFinite(durationSeconds) && durationSeconds > MAX_VIDEO_SECONDS + MAX_VIDEO_SECONDS_TOLERANCE;
}

/**
 * Achtergrond voor een video die niet het hele scherm vult: het poster-plaatje, maar piepklein
 * opgevraagd (Mux kan dat) en dan opgerekt. Voor andere plaatjes geen achtergrond.
 */
export function backdropUrl(posterUrl: string | undefined | null): string | null {
  if (!posterUrl || !posterUrl.includes("image.mux.com")) return null;
  const sep = posterUrl.includes("?") ? "&" : "?";
  return `${posterUrl}${sep}width=48`;
}
