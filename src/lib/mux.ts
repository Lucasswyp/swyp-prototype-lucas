// Server-side Mux helpers (never import from a client component: they read
// the secret token).

const MUX_API = "https://api.mux.com";

export function muxStreamUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function muxPosterUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1`;
}

export async function muxRequest<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const id = process.env.MUX_TOKEN_ID;
  const secret = process.env.MUX_TOKEN_SECRET;
  if (!id || !secret) throw new Error("Mux is niet geconfigureerd.");

  const res = await fetch(`${MUX_API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mux ${res.status}`);
  return (await res.json()) as T;
}

export interface MuxUpload {
  id: string;
  url?: string;
  status: "waiting" | "asset_created" | "errored" | "cancelled" | "timed_out";
  asset_id?: string;
}

export interface MuxAsset {
  id: string;
  status: "preparing" | "ready" | "errored";
  passthrough?: string;
  duration?: number;
  aspect_ratio?: string;
  playback_ids?: { id: string; policy: string }[];
}
