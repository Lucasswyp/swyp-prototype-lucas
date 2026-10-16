// Haalt de demo-advertenties uit de feed door ze op 'rejected' te zetten
// (er wordt niets verwijderd; terugzetten kan met --restore). Zonder --apply
// doet het script alleen een droge run.
//
//   node scripts/hide-demo-content.mjs                    (droge run)
//   node scripts/hide-demo-content.mjs --apply            (demo verbergen)
//   node scripts/hide-demo-content.mjs --restore --apply  (demo terugzetten)
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

const DEMO_BUSINESSES = ["NØRR", "Bloom & Bean", "Hotel Lumen", "FormaFit"];
const apply = process.argv.includes("--apply");
const restore = process.argv.includes("--restore");
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: demo, error: e1 } = await supabase.from("businesses").select("id, name").in("name", DEMO_BUSINESSES);
if (e1) throw e1;
const ids = demo.map((b) => b.id);

const { data: realAds, error: e2 } = await supabase
  .from("ads")
  .select("id, business_id")
  .not("business_id", "in", `(${ids.join(",")})`)
  .eq("moderation_status", "approved");
if (e2) throw e2;

const from = restore ? "rejected" : "approved";
const to = restore ? "approved" : "rejected";
const { data: target, error: e3 } = await supabase
  .from("ads")
  .select("id")
  .in("business_id", ids)
  .eq("moderation_status", from);
if (e3) throw e3;

console.log(`Demobedrijven: ${demo.map((b) => b.name).join(", ")}`);
console.log(`Echte goedgekeurde ads van andere bedrijven: ${realAds.length}`);
console.log(`Demo-ads die van '${from}' naar '${to}' gaan: ${target.length}`);

if (!restore && realAds.length === 0) {
  console.log("Stop: er is nog geen echte goedgekeurde advertentie, de feed zou leeg zijn.");
  process.exit(apply ? 1 : 0);
}

if (apply) {
  const { error } = await supabase.from("ads").update({ moderation_status: to }).in("business_id", ids).eq("moderation_status", from);
  if (error) throw error;
  console.log("Klaar. Ververs daarna de zoekindex (zie het reindex-endpoint).");
} else {
  console.log("Droge run: niets gewijzigd. Voeg --apply toe om door te voeren.");
}
