// Haptische feedback (trilling) in de iOS-app. Doet niets op het web, en ook
// niets in een oudere app-versie die de plugin nog niet heeft: die fout wordt
// stil opgevangen, zodat de webapp nooit stukgaat op een oude build.
type Kind = "tap" | "success" | "select";

async function run(kind: Kind) {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (kind === "tap") await Haptics.impact({ style: ImpactStyle.Light });
    else if (kind === "select") await Haptics.selectionChanged();
    else await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Plugin ontbreekt of het toestel kan het niet: geen probleem.
  }
}

/** Korte tik: liken, opslaan. */
export const hapticTap = () => void run("tap");
/** Succes: tokens verdiend, video verstuurd. */
export const hapticSuccess = () => void run("success");
/** Lichte selectie: een emoji kiezen. */
export const hapticSelect = () => void run("select");
