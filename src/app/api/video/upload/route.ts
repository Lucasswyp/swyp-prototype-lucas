import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { muxRequest, type MuxUpload } from "@/lib/mux";

// Hands a signed-in business a one-time Mux upload URL. The browser then
// uploads the file straight to Mux, so the video never passes through us.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();
  if (!business) {
    return NextResponse.json({ error: "Alleen bedrijven kunnen video's uploaden." }, { status: 403 });
  }

  const allowed = await checkRateLimit(`video-upload:${business.id}:${getClientIp(request)}`, 20, 60 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel uploads. Probeer het over een uur opnieuw." }, { status: 429 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  try {
    const upload = await muxRequest<{ data: MuxUpload }>("/video/v1/uploads", {
      method: "POST",
      body: {
        cors_origin: origin,
        new_asset_settings: {
          playback_policies: ["public"],
          video_quality: "basic",
          passthrough: business.id,
        },
      },
    });
    return NextResponse.json({ uploadId: upload.data.id, url: upload.data.url });
  } catch {
    return NextResponse.json({ error: "Upload voorbereiden is mislukt." }, { status: 502 });
  }
}
