import { useEffect, useRef, useState, type RefObject } from "react";

export function isHlsUrl(url: string | undefined) {
  return !!url && url.includes(".m3u8");
}

// Safari en iOS (ook de app) spelen HLS zelf af en dat werkt daar het beste. Nieuwere versies van
// Chrome en Edge zeggen ook "kan ik wel", maar daar start de video soms nooit; die gebruiken
// daarom hls.js, wat betrouwbaar werkt.
export function canPlayHlsNatively() {
  if (typeof document === "undefined" || typeof navigator === "undefined") return false;
  if (document.createElement("video").canPlayType("application/vnd.apple.mpegurl") === "") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isDesktopSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Android|Edg|Firefox/.test(ua);
  return isIOS || isDesktopSafari;
}

// Attaches an HLS source to a <video> element when the browser can't do it
// itself. Returns whether hls.js is in charge, so callers can skip behaviour
// (like reloading the element on error) that would break its playback.
export function useHlsSource(videoRef: RefObject<HTMLVideoElement | null>, url: string | undefined, enabled: boolean) {
  const [native] = useState(canPlayHlsNatively);
  const needsHlsJs = isHlsUrl(url) && !native;
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!needsHlsJs || !enabled || !video || !url) return;
    let cancelled = false;
    import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !Hls.isSupported()) return;
      const hls = new Hls({
        maxBufferLength: 12,
        capLevelToPlayerSize: true,
        // Meteen op een redelijke kwaliteit beginnen in plaats van eerst vaag en dan scherp.
        abrEwmaDefaultEstimate: 4_000_000,
        startFragPrefetch: true,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
    });
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [needsHlsJs, enabled, url, videoRef]);

  return { needsHlsJs, hlsRef };
}
