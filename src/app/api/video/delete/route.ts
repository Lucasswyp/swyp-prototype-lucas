import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { muxRequest } from "@/lib/mux";
import { muxPlaybackIdFromUrl } from "@/lib/muxAsset";

export const runtime = "nodejs";

// Haalt de video van een advertentie bij Mux weg, zodat die geen van de (gratis) plekken meer
// inneemt. Alleen de eigenaar van de advertentie kan dit, en alleen voor zijn eigen video.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

  const { data: business } = await supabase.from("businesses").select("id").eq("auth_user_id", userData.user.id).maybeSingle();
  if (!business) return NextResponse.json({ error: "Alleen bedrijven kunnen video's verwijderen." }, { status: 403 });

  if (!(await checkRateLimit(`video-delete:${business.id}:${getClientIp(request)}`, 60, 60 * 60))) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer het later opnieuw." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { adId?: unknown };
  const adId = typeof body.adId === "string" ? body.adId : "";
  if (!/^[0-9a-fA-F-]{36}$/.test(adId)) return NextResponse.json({ error: "Ongeldige advertentie." }, { status: 400 });

  // Alleen een advertentie van dit bedrijf.
  const { data: ad } = await supabase.from("ads").select("video_url, business_id").eq("id", adId).maybeSingle();
  if (!ad || ad.business_id !== business.id) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

  const playbackId = muxPlaybackIdFromUrl(ad.video_url);
  if (!playbackId) return NextResponse.json({ ok: true, skipped: true }); // geen Mux-video, niets weg te halen

  try {
    const playback = await muxRequest<{ data: { object?: { id?: string; type?: string } } }>(`/video/v1/playback-ids/${playbackId}`);
    const assetId = playback.data.object?.type === "asset" ? playback.data.object.id : undefined;
    if (!assetId) return NextResponse.json({ ok: true, skipped: true });
    await muxRequest(`/video/v1/assets/${assetId}`, { method: "DELETE" }).catch((err: unknown) => {
      // Mux antwoordt op een gelukte verwijdering zonder inhoud; dat telt hier als gelukt.
      if (!(err instanceof Error) || !/Unexpected end of JSON|Mux 404/.test(err.message)) throw err;
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Mux video verwijderen mislukt:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Verwijderen bij de videodienst is mislukt. Probeer het later opnieuw." }, { status: 502 });
  }
}
