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

// 50 individually distinct Pexels stock videos (real, pulled live from
// pexels.com/search/videos), 10 per category, each paired with a matching
// still image for the product card poster/thumbnail.
const VIDEOS = {
  Fashion: {
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80&auto=format&fit=crop",
    urls: [
      "https://videos.pexels.com/video-files/5561960/5561960-sd_360_640_25fps.mp4",
      "https://videos.pexels.com/video-files/10211614/10211614-sd_506_960_25fps.mp4",
      "https://videos.pexels.com/video-files/18156333/18156333-sd_360_640_30fps.mp4",
      "https://videos.pexels.com/video-files/8738298/8738298-sd_360_640_25fps.mp4",
      "https://videos.pexels.com/video-files/10669632/10669632-sd_506_960_25fps.mp4",
      "https://videos.pexels.com/video-files/8478619/8478619-sd_360_640_24fps.mp4",
      "https://videos.pexels.com/video-files/8371251/8371251-sd_506_960_25fps.mp4",
      "https://videos.pexels.com/video-files/9710787/9710787-sd_360_640_25fps.mp4",
      "https://videos.pexels.com/video-files/9544861/9544861-sd_960_506_25fps.mp4",
      "https://videos.pexels.com/video-files/7448490/7448490-sd_360_640_25fps.mp4",
    ],
  },
  Food: {
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80&auto=format&fit=crop",
    urls: [
      "https://videos.pexels.com/video-files/6420982/6420982-sd_506_960_30fps.mp4",
      "https://videos.pexels.com/video-files/7929034/7929034-sd_360_640_24fps.mp4",
      "https://videos.pexels.com/video-files/8479197/8479197-sd_640_360_25fps.mp4",
      "https://videos.pexels.com/video-files/6760617/6760617-sd_640_360_25fps.mp4",
      "https://videos.pexels.com/video-files/8107571/8107571-sd_506_960_25fps.mp4",
      "https://videos.pexels.com/video-files/2081576/2081576-sd_640_360_30fps.mp4",
      "https://videos.pexels.com/video-files/6353432/6353432-sd_360_640_30fps.mp4",
      "https://videos.pexels.com/video-files/4443535/4443535-sd_360_640_20fps.mp4",
      "https://videos.pexels.com/video-files/7246453/7246453-sd_360_640_25fps.mp4",
      "https://videos.pexels.com/video-files/4676745/4676745-sd_506_960_25fps.mp4",
    ],
  },
  Travel: {
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80&auto=format&fit=crop",
    urls: [
      "https://videos.pexels.com/video-files/7815139/7815139-sd_360_640_30fps.mp4",
      "https://videos.pexels.com/video-files/7823396/7823396-sd_360_640_30fps.mp4",
      "https://videos.pexels.com/video-files/4873844/4873844-sd_640_360_25fps.mp4",
      "https://videos.pexels.com/video-files/7823343/7823343-sd_360_640_30fps.mp4",
      "https://videos.pexels.com/video-files/6180830/6180830-sd_640_360_25fps.mp4",
      "https://videos.pexels.com/video-files/7815134/7815134-sd_360_640_30fps.mp4",
      "https://videos.pexels.com/video-files/8865230/8865230-sd_960_506_25fps.mp4",
      "https://videos.pexels.com/video-files/7823346/7823346-sd_360_640_30fps.mp4",
      "https://videos.pexels.com/video-files/8865246/8865246-sd_506_960_25fps.mp4",
      "https://videos.pexels.com/video-files/7824479/7824479-sd_360_640_30fps.mp4",
    ],
  },
  Fitness: {
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&auto=format&fit=crop",
    urls: [
      "https://videos.pexels.com/video-files/4109366/4109366-sd_640_360_25fps.mp4",
      "https://videos.pexels.com/video-files/8436000/8436000-sd_360_640_25fps.mp4",
      "https://videos.pexels.com/video-files/12188774/12188774-sd_640_360_25fps.mp4",
      "https://videos.pexels.com/video-files/6390165/6390165-sd_640_360_25fps.mp4",
      "https://videos.pexels.com/video-files/6286158/6286158-sd_640_360_30fps.mp4",
      "https://videos.pexels.com/video-files/6390402/6390402-sd_640_360_25fps.mp4",
      "https://videos.pexels.com/video-files/8691729/8691729-sd_506_960_24fps.mp4",
      "https://videos.pexels.com/video-files/6390154/6390154-sd_640_360_25fps.mp4",
      "https://videos.pexels.com/video-files/6326955/6326955-sd_960_494_25fps.mp4",
      "https://videos.pexels.com/video-files/4861137/4861137-sd_640_360_25fps.mp4",
    ],
  },
  Tech: {
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&auto=format&fit=crop",
    urls: [
      "https://videos.pexels.com/video-files/11041433/11041433-sd_640_360_30fps.mp4",
      "https://videos.pexels.com/video-files/3761657/3761657-sd_360_640_25fps.mp4",
      "https://videos.pexels.com/video-files/8632598/8632598-sd_360_640_25fps.mp4",
      "https://videos.pexels.com/video-files/7047257/7047257-sd_640_360_25fps.mp4",
      "https://videos.pexels.com/video-files/6963374/6963374-sd_360_640_30fps.mp4",
      "https://videos.pexels.com/video-files/12893579/12893579-sd_360_640_24fps.mp4",
      "https://videos.pexels.com/video-files/12954605/12954605-sd_640_360_24fps.mp4",
      "https://videos.pexels.com/video-files/4359114/4359114-sd_360_640_25fps.mp4",
      "https://videos.pexels.com/video-files/9365198/9365198-sd_360_640_25fps.mp4",
      "https://videos.pexels.com/video-files/5118468/5118468-sd_640_360_25fps.mp4",
    ],
  },
};

const ADJECTIVES = ["Nieuwe", "Populaire", "Limited", "Exclusieve", "Best verkochte", "Seizoens", "Premium", "Handgemaakte", "Aanbevolen", "Trending"];
const NOUNS = {
  Fashion: ["Hoodie", "Sneaker", "Jas", "Tas", "Cap", "Sjaal", "Trainingspak", "Zonnebril", "Horloge", "Riem"],
  Food: ["Koffie", "Ontbijtbox", "Maaltijdbox", "Snackpakket", "Theeselectie", "Chocoladereep", "Sapkuur", "Broodmix", "Kruidenset", "Kookbox"],
  Travel: ["Weekendtrip", "Hotelovernachting", "Citytrip", "Reistas", "Boekingscode", "Vluchtvoucher", "Strandarrangement", "Wellnessdag", "Roadtrip", "Vakantiepakket"],
  Fitness: ["Trainingsschema", "Yogamat", "Proteïnepoeder", "Sportoutfit", "Fitnessabonnement", "Weerstandsband", "Hardloopschoen", "Bidon", "Fitnesshorloge", "Personal Training"],
  Tech: ["Oordopjes", "Powerbank", "Smartwatch", "Telefoonhoes", "Laptopstandaard", "Webcam", "Toetsenbord", "Speaker", "Kabelset", "Muismat"],
};
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

  // Delete the old cycled-video test batch so we don't end up with 100 items.
  const { data: oldProducts } = await supabase
    .from("products")
    .select("id")
    .ilike("description", "Testproduct #%");
  if (oldProducts && oldProducts.length > 0) {
    const ids = oldProducts.map((p) => p.id);
    await supabase.from("ads").delete().in("product_id", ids);
    await supabase.from("products").delete().in("id", ids);
    console.log(`Oude testbatch verwijderd: ${ids.length} producten.`);
  }

  const categories = Object.keys(VIDEOS);
  let created = 0;
  let i = 0;
  for (const category of categories) {
    const { image, urls } = VIDEOS[category];
    for (const videoUrl of urls) {
      const business = pick(businesses, i);
      const name = `${pick(ADJECTIVES, i)} ${pick(NOUNS[category], i)} ${i + 1}`;
      const price = Math.round((15 + ((i * 7) % 80)) * 100) / 100;
      const hasDiscount = i % 3 === 0;

      const { data: product, error: pErr } = await supabase
        .from("products")
        .insert({
          business_id: business.id,
          name,
          description: `Echte stockvideo #${i + 1} (${category}) voor ${business.name}, gebruikt om de feed te vullen tijdens het testen.`,
          image_url: image,
          price,
          old_price: hasDiscount ? Math.round(price * 1.3 * 100) / 100 : null,
          category,
          url: "https://example.com/product",
          highlights: ["Testdata", "Echte video"],
        })
        .select("id")
        .single();
      if (pErr) {
        console.error("product insert failed", pErr.message);
        i++;
        continue;
      }

      const { error: adErr } = await supabase.from("ads").insert({
        business_id: business.id,
        product_id: product.id,
        video_url: videoUrl,
        poster_url: image,
        caption: `${name} — swipe voor meer.`,
        category,
        cta_label: "Bekijk product",
      });
      if (adErr) {
        console.error("ad insert failed", adErr.message);
        i++;
        continue;
      }
      created++;
      i++;
    }
  }

  console.log(`Klaar — ${created} producten + advertenties met unieke video's toegevoegd.`);
})();
