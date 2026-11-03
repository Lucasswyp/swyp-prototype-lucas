import { useEffect, useRef, useState, type RefObject } from "react";

export function isHlsUrl(url: string | undefined) {
  return !!url && url.includes(".m3u8");
}

// Welke afspeler gebruiken we voor een stream (HLS)?
//  - hls.js zodra de browser dat kan (MediaSource). Dat geeft ons controle over wat er alvast wordt
//    geladen, en dat is wat het scrollen vlot maakt. Dat geldt nu ook voor iPhones met iOS 17.1 of
//    nieuwer, die ManagedMediaSource hebben. Een iPhone-speler laadt zelf maar heel weinig vooruit.
//  - De ingebouwde speler alleen als dat niet kan (oudere iPhones).
// Chrome en Edge zeggen ook "kan ik wel" voor ingebouwd afspelen, maar daar start de video soms nooit.
export function canPlayHlsNatively() {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  const w = window as unknown as { MediaSource?: unknown; ManagedMediaSource?: unknown };
  if (w.MediaSource || w.ManagedMediaSource) return false;
  return document.createElement("video").canPlayType("application/vnd.apple.mpegurl") !== "";
}

// Attaches an HLS source to a <video> element when the browser can't do it
// itself. Returns whether hls.js is in charge, so callers can skip behaviour
// (like reloading the element on error) that would break its playback.
// bufferSeconds: hoeveel seconden vooruit er geladen wordt. De video die speelt en de eerstvolgende
// krijgen ruim, verder weg klaarstaande video's alleen de eerste paar seconden: dan staan er
// meerdere video's meteen klaar zonder dat alles volledig wordt gedownload.
export function useHlsSource(
  videoRef: RefObject<HTMLVideoElement | null>,
  url: string | undefined,
  enabled: boolean,
  bufferSeconds = 12
) {
  const [native] = useState(canPlayHlsNatively);
  const needsHlsJs = isHlsUrl(url) && !native;
  const hlsRef = useRef<{ destroy: () => void; config: { maxBufferLength: number } } | null>(null);
  const bufferRef = useRef(bufferSeconds);
  useEffect(() => {
    bufferRef.current = bufferSeconds;
    if (hlsRef.current) hlsRef.current.config.maxBufferLength = bufferSeconds;
  }, [bufferSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!needsHlsJs || !enabled || !video || !url) return;
    let cancelled = false;
    let watchdog: number | undefined;
    import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !Hls.isSupported()) return;
      // Valt hls.js uit of start de video niet, dan terug naar de ingebouwde speler als die er is:
      // liever een iets tragere video dan een video die niet start.
      const fallBackToNative = () => {
        if (cancelled || !video || !url) return;
        hlsRef.current?.destroy();
        hlsRef.current = null;
        if (video.canPlayType("application/vnd.apple.mpegurl") !== "") {
          video.src = url;
          video.load();
        }
      };
      // Safari met ManagedMediaSource wil dit uitgeschakeld hebben.
      video.disableRemotePlayback = true;
      const hls = new Hls({
        maxBufferLength: bufferRef.current,
        capLevelToPlayerSize: true,
        // Meteen op een redelijke kwaliteit beginnen in plaats van eerst vaag en dan scherp.
        abrEwmaDefaultEstimate: 4_000_000,
        startFragPrefetch: true,
      });
      hlsRef.current = hls;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) fallBackToNative();
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      // Na 10 seconden nog helemaal niets binnen? Dan opnieuw proberen met de ingebouwde speler.
      watchdog = window.setTimeout(() => {
        if (!cancelled && video.readyState === 0 && video.error === null) fallBackToNative();
      }, 10_000);
    });
    return () => {
      cancelled = true;
      if (watchdog) window.clearTimeout(watchdog);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [needsHlsJs, enabled, url, videoRef]);

  return { needsHlsJs, hlsRef };
}
