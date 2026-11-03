// Is de app in beeld of naar de achtergrond (of gesloten)? Combineert de browser (tabblad
// verborgen) en de iPhone-app (Capacitor), want de app meldt "naar de achtergrond" niet altijd
// via de browser. Roept de functie alleen aan als de stand echt verandert.

// Hoe lang je weg mag zijn voordat de app bij terugkomen helemaal opnieuw begint. Korter dan dit
// blijft alles precies zoals je het achterliet.
export const APP_RESUME_REFRESH_MS = 30 * 60 * 1000;

export function onAppActiveChange(callback: (active: boolean) => void): () => void {
  let last: boolean | null = null;
  const emit = (active: boolean) => {
    if (last === active) return;
    last = active;
    callback(active);
  };

  const onVisibility = () => emit(document.visibilityState !== "hidden");
  const onPageHide = () => emit(false);
  const onPageShow = () => emit(document.visibilityState !== "hidden");
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);

  let cancelled = false;
  let removeNative: (() => void) | undefined;
  import("@capacitor/core")
    .then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform() || cancelled) return;
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("appStateChange", ({ isActive }) => emit(isActive));
      if (cancelled) handle.remove();
      else removeNative = () => handle.remove();
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    removeNative?.();
  };
}
