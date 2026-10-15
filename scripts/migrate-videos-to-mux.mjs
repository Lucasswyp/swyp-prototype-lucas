// Moves every ad video that still lives in Supabase Storage over to Mux and
// points ads.video_url at the HLS stream. Safe to re-run: ads that already
// use a .m3u8 URL are skipped. Without --apply it only lists what it would do.
//
//   node scripts/migrate-videos-to-mux.mjs           (dry run)
//   node scripts/migrate-videos-to-mux.mjs --apply   (uploads and updates ads)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    })
);

const apply = process.argv.includes("--apply");
const auth = "Basic " + Buffer.from(`${env.MUX_TOKEN_ID}:${env.MUX_TOKEN_SECRET}`).toString("base64");
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function mux(path, init = {}) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(`https://api.mux.com${path}`, {
      ...init,
      headers: { Authorization: auth, "Content-Type": "application/json" },
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 20000));
      continue;
    }
    if (!res.ok) throw new Error(`Mux ${res.status} on ${path}`);
    return res.status === 204 ? {} : res.json();
  }
  throw new Error(`Mux kept rate-limiting ${path}`);
}

async function migrate(ad) {
  const file = Buffer.from(await (await fetch(ad.video_url)).arrayBuffer());
  const upload = (
    await mux("/video/v1/uploads", {
      method: "POST",
      body: JSON.stringify({
        cors_origin: "https://swyp-prototype-lucas.vercel.app",
        new_asset_settings: { playback_policies: ["public"], video_quality: "basic", passthrough: ad.business_id },
      }),
    })
  ).data;
  const put = await fetch(upload.url, { method: "PUT", body: file });
  if (!put.ok) throw new Error(`PUT ${put.status}`);

  for (let i = 0; i < 100; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const u = (await mux(`/video/v1/uploads/${upload.id}`)).data;
    if (!u.asset_id) continue;
    const asset = (await mux(`/video/v1/assets/${u.asset_id}`)).data;
    if (asset.status === "errored") throw new Error("Mux could not process the video");
    if (asset.status === "ready") {
      const playbackId = asset.playback_ids[0].id;
      const { error } = await supabase
        .from("ads")
        .update({ video_url: `https://stream.mux.com/${playbackId}.m3u8` })
        .eq("id", ad.id)
        .eq("video_url", ad.video_url);
      if (error) throw error;
      return playbackId;
    }
  }
  throw new Error("Timed out waiting for Mux");
}

const { data: ads, error } = await supabase.from("ads").select("id, business_id, video_url");
if (error) throw error;
const todo = ads.filter((a) => a.video_url && !a.video_url.includes(".m3u8"));
console.log(`${ads.length} ads, ${todo.length} still on the old host${apply ? "" : " (dry run, pass --apply to migrate)"}`);

if (apply) {
  let done = 0;
  let failed = 0;
  const queue = [...todo];
  await Promise.all(
    Array.from({ length: 1 }, async () => {
      while (queue.length) {
        const ad = queue.shift();
        try {
          await migrate(ad);
          done++;
        } catch (e) {
          failed++;
          console.error(`ad ${ad.id}: ${e.message}`);
        }
        console.log(`progress ${done + failed}/${todo.length}`);
      }
    })
  );
  console.log(`migrated ${done}, failed ${failed}`);
}
