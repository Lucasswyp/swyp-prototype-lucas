import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Known-working stock assets reused cyclically — finding 50 genuinely unique
// stock videos is out of scope for a functional test seed; this is purely to
// verify the feed, scrolling and category filtering hold up with volume.
const ASSETS = [
  {
    video: "https://videos.pexels.com/video-files/7680449/7680449-uhd_2732_1440_25fps.mp4",
    image: "https://images.unsplash.com/photo-1611817757591-c3f345024273?w=800&q=80&auto=format&fit=crop",
    category: "Fashion",
  },
  {
    video: "https://videos.pexels.com/video-files/7657786/7657786-hd_1080_1920_25fps.mp4",
    image: "https://images.unsplash.com/photo-1511426420268-4cfdd3763b77?w=800&q=80&auto=format&fit=crop",
    category: "Food",
  },
  {
    video: "https://videos.pexels.com/video-files/7507166/7507166-uhd_2732_1440_25fps.mp4",
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80&auto=format&fit=crop",
    category: "Travel",
  },
  {
    video: "https://videos.pexels.com/video-files/18941351/18941351-hd_1080_1920_50fps.mp4",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&auto=format&fit=crop",
    category: "Fitness",
  },
];

const ADJECTIVES = ["Nieuwe", "Populaire", "Limited", "Exclusieve", "Best verkochte", "Seizoens", "Premium", "Handgemaakte"];
const NOUNS = ["Hoodie", "Sneaker", "Rugzak", "Zonnebril", "Horloge", "Jas", "Tas", "Trainingspak", "Cap", "Sjaal"];
const BUSINESS_NAMES = ["NØRR", "Bloom & Bean", "Hotel Lumen", "FormaFit"];

function pick(arr, i) {
  return arr[i % arr.length];
}

(async () => {
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, name, category")
    .in("name", BUSINESS_NAMES);
  if (error) throw error;
  if (!businesses || businesses.length === 0) {
    console.error("Geen demo-bedrijven gevonden. Draai eerst scripts/seed.mjs.");
    process.exit(1);
  }

  let created = 0;
  for (let i = 0; i < 50; i++) {
    const business = pick(businesses, i);
    const asset = pick(ASSETS, i);
    const name = `${pick(ADJECTIVES, i)} ${pick(NOUNS, i + 3)} ${i + 1}`;
    const price = Math.round((15 + ((i * 7) % 80)) * 100) / 100;
    const hasDiscount = i % 3 === 0;

    const { data: product, error: pErr } = await supabase
      .from("products")
      .insert({
        business_id: business.id,
        name,
        description: `Testproduct #${i + 1} voor ${business.name}, gebruikt om de feed te vullen tijdens het testen.`,
        image_url: asset.image,
        price,
        old_price: hasDiscount ? Math.round(price * 1.3 * 100) / 100 : null,
        category: asset.category,
        url: "https://example.com/product",
        highlights: ["Testdata", "Gegenereerd voor feed-test"],
      })
      .select("id")
      .single();
    if (pErr) {
      console.error("product insert failed", pErr.message);
      continue;
    }

    const { error: adErr } = await supabase.from("ads").insert({
      business_id: business.id,
      product_id: product.id,
      video_url: asset.video,
      poster_url: asset.image,
      caption: `${name} — swipe voor meer.`,
      category: asset.category,
      cta_label: "Bekijk product",
    });
    if (adErr) {
      console.error("ad insert failed", adErr.message);
      continue;
    }
    created++;
  }

  console.log(`Klaar — ${created} testproducten + advertenties toegevoegd.`);
})();
