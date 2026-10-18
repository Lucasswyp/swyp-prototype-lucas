"use client";

import { useState } from "react";

const VIDEO_FILE = /\.(mov|mp4|m4v|webm)(\?|#|$)/i;

interface AdThumbProps {
  posterUrl?: string | null;
  videoUrl?: string | null;
  fallbackImageUrl?: string | null;
  className?: string;
}

// Miniatuur van een video. Een poster is meestal een plaatje, maar bij video's
// die zonder Mux zijn geüpload is het poster-bestand soms zelf de video. Dan
// tonen we het eerste beeld van de video; voor een stream (m3u8) zonder
// plaatje valt het terug op de productafbeelding.
export function AdThumb({ posterUrl, videoUrl, fallbackImageUrl, className = "absolute inset-0 h-full w-full object-cover" }: AdThumbProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const posterIsImage = !!posterUrl && !VIDEO_FILE.test(posterUrl) && !imgFailed;
  if (posterIsImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={posterUrl!} alt="" className={className} onError={() => setImgFailed(true)} />;
  }

  const fileUrl = [posterUrl, videoUrl].find((u): u is string => !!u && VIDEO_FILE.test(u));
  if (fileUrl) {
    return <video src={`${fileUrl.split("#")[0]}#t=0.1`} preload="metadata" muted playsInline className={className} />;
  }

  if (fallbackImageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fallbackImageUrl} alt="" className={className} />;
  }
  return null;
}
