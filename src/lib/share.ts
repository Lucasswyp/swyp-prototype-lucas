/** Shared "Delen" behavior — was three different implementations across the
 * app (one real, one a fake toast that copied nothing, one with no handler
 * at all). Uses the native share sheet where available (native app, mobile
 * Safari) and falls back to clipboard everywhere else. */
export async function shareLink(url: string, text?: string): Promise<"shared" | "copied" | "failed"> {
  if (navigator.share) {
    try {
      await navigator.share({ url, text });
      return "shared";
    } catch {
      // User cancelled the share sheet, or the platform rejected it —
      // clipboard is still a reasonable fallback either way.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
