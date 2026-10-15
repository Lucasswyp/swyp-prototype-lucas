import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { muxRequest, muxPosterUrl, muxStreamUrl, type MuxAsset, type MuxUpload } from "@/lib/mux";

// Polled by the upload form until Mux has finished processing the video.
export async function GET(request: Request) {
  const uploadId = new URL(request.url).searchParams.get("uploadId");
  if (!uploadId || !/^[A-Za-z0-9]+$/.test(uploadId)) {
    return NextResponse.json({ error: "Ongeldige upload." }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  try {
    const upload = (await muxRequest<{ data: MuxUpload }>(`/video/v1/uploads/${uploadId}`)).data;
    if (upload.status === "errored" || upload.status === "cancelled" || upload.status === "timed_out") {
      return NextResponse.json({ status: "errored" });
    }
    if (!upload.asset_id) {
      return NextResponse.json({ status: "uploading" });
    }

    const asset = (await muxRequest<{ data: MuxAsset }>(`/video/v1/assets/${upload.asset_id}`)).data;
    // The upload was created for one business; never reveal another's asset.
    if (asset.passthrough !== business.id) {
      return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
    }
    if (asset.status === "errored") {
      return NextResponse.json({ status: "errored" });
    }
    const playbackId = asset.playback_ids?.[0]?.id;
    if (asset.status !== "ready" || !playbackId) {
      return NextResponse.json({ status: "processing" });
    }
    return NextResponse.json({
      status: "ready",
      videoUrl: muxStreamUrl(playbackId),
      posterUrl: muxPosterUrl(playbackId),
      duration: asset.duration ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Status ophalen is mislukt." }, { status: 502 });
  }
}
