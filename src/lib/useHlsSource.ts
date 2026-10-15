import { useEffect, useRef, useState, type RefObject } from "react";

export function isHlsUrl(url: string | undefined) {
  return !!url && url.includes(".m3u8");
}

// Safari and iOS WebViews play HLS natively; Chrome and others need hls.js.
export function canPlayHlsNatively() {
  if (typeof document === "undefined") return false;
  return document.createElement("video").canPlayType("application/vnd.apple.mpegurl") !== "";
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
      const hls = new Hls({ maxBufferLength: 10, capLevelToPlayerSize: true });
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
