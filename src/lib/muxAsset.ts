// De afspeel-id van een Mux-video uit zijn stream-adres ("https://stream.mux.com/<id>.m3u8").
export function muxPlaybackIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/^https:\/\/stream\.mux\.com\/([A-Za-z0-9]+)\.m3u8(?:\?.*)?$/);
  return m ? m[1] : null;
}

// Het bestandspad van een video in de eigen opslag ("…/ad-videos/<map>/<bestand>").
export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/public\/ad-videos\/(.+?)(?:\?.*)?$/);
  return m ? decodeURIComponent(m[1]) : null;
}
