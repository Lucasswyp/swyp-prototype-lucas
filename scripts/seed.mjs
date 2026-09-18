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

const PASSWORD = "Swyp2026!";

const businesses = [
  {
    email: "norr@swyp.test",
    name: "NØRR",
    category: "Fashion",
    location: "Amsterdam",
    website: "norr.com",
    description: "Scandinavisch geïnspireerd streetwear-merk. Minimalistisch design, premium materialen.",
    logo_url: "https://images.unsplash.com/photo-1626379616459-b2ce1d9decbc?w=200&q=80&auto=format&fit=crop",
    banner_url: "https://images.unsplash.com/photo-1611817757591-c3f345024273?w=1200&q=80&auto=format&fit=crop",
    verified: true,
    followers: 48200,
    product: {
      name: "Essential Oversized Hoodie",
      description: "Zwaargewicht biologisch katoen, oversized fit, ongebleekt garen.",
      image_url: "https://images.unsplash.com/photo-1611817757591-c3f345024273?w=800&q=80&auto=format&fit=crop",
      price: 54.95,
      old_price: 69.95,
      category: "Fashion",
      url: "https://norr.com/products/essential-hoodie",
      highlights: ["100% biologisch katoen", "Oversized fit", "Gemaakt in Portugal"],
    },
    video_url: "https://videos.pexels.com/video-files/7680449/7680449-uhd_2732_1440_25fps.mp4",
    caption: "Gemaakt om in weg te zakken. Essential Hoodie, nu -20%.",
    reward: { title: "10% korting", description: "10% korting op je volgende bestelling.", token_cost: 150 },
  },
  {
    email: "bloom@swyp.test",
    name: "Bloom & Bean",
    category: "Food",
    location: "Utrecht",
    website: "bloomandbean.nl",
    description: "Specialty coffee roastery met eigen kwekerspartners in Ethiopië en Colombia.",
    logo_url: "https://images.unsplash.com/photo-1511426420268-4cfdd3763b77?w=200&q=80&auto=format&fit=crop",
    banner_url: "https://images.unsplash.com/photo-1513663580958-665b7ef55d1b?w=1200&q=80&auto=format&fit=crop",
    verified: true,
    followers: 19400,
    product: {
      name: "Specialty Coffee Subscription",
      description: "Elke maand 2 zakken vers gebrande specialty koffie, direct van de kweker.",
      image_url: "https://images.unsplash.com/photo-1511426420268-4cfdd3763b77?w=800&q=80&auto=format&fit=crop",
      price: 19.95,
      category: "Food",
      url: "https://bloomandbean.nl/subscription",
      highlights: ["Vers gebrand", "Direct trade", "Pauzeer wanneer je wilt"],
    },
    video_url: "https://videos.pexels.com/video-files/7657786/7657786-hd_1080_1920_25fps.mp4",
    caption: "Vers gebrand, direct van de kweker naar jouw bus.",
    reward: { title: "Gratis koffie", description: "Eén gratis specialty koffie naar keuze.", token_cost: 250 },
  },
  {
    email: "hotel@swyp.test",
    name: "Hotel Lumen",
    category: "Travel",
    location: "Amsterdam",
    website: "hotellumen.com",
    description: "Boutique hotel aan de Amsterdamse grachten. 42 kamers, rooftop bar, spa.",
    logo_url: "https://images.unsplash.com/photo-1554647286-f365d7defc2d?w=200&q=80&auto=format&fit=crop",
    banner_url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80&auto=format&fit=crop",
    verified: true,
    followers: 31800,
    product: {
      name: "Deluxe Canal Suite (1 nacht)",
      description: "42m² suite met grachtzicht, kingsize bed en regendouche.",
      image_url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80&auto=format&fit=crop",
      price: 189,
      old_price: 239,
      category: "Travel",
      url: "https://hotellumen.com/suites",
      highlights: ["Grachtzicht", "Late check-out mogelijk", "Ontbijt inbegrepen"],
    },
    video_url: "https://videos.pexels.com/video-files/7507166/7507166-uhd_2732_1440_25fps.mp4",
    caption: "Wakker worden met uitzicht op de gracht.",
    reward: { title: "Late check-out", description: "Check tot 15:00 uur uit.", token_cost: 300 },
  },
  {
    email: "formafit@swyp.test",
    name: "FormaFit",
    category: "Fitness",
    location: "Eindhoven",
    website: "formafit.nl",
    description: "Sportschoolketen en supplementenmerk voor structurele progressie.",
    logo_url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&q=80&auto=format&fit=crop",
    banner_url: "https://images.unsplash.com/photo-1593164842264-854604db2260?w=1200&q=80&auto=format&fit=crop",
    verified: false,
    followers: 12300,
    product: {
      name: "Performance Whey 1kg",
      description: "24g eiwit per shake, low-sugar, gefermenteerd voor betere opname.",
      image_url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80&auto=format&fit=crop",
      price: 34.95,
      category: "Fitness",
      url: "https://formafit.nl/whey",
      highlights: ["24g eiwit per shake", "Low sugar", "5 smaken"],
    },
    video_url: "https://videos.pexels.com/video-files/18941351/18941351-hd_1080_1920_50fps.mp4",
    caption: "24g eiwit, elke shake. Bouw door.",
    reward: { title: "Gratis supplement sample", description: "Gratis proefverpakking bij een bestelling.", token_cost: 220 },
  },
];

for (const b of businesses) {
  console.log(`\n=== ${b.name} ===`);

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  let authUser = existingUsers?.users.find((u) => u.email === b.email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: b.email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    authUser = data.user;
    console.log(`created auth user ${b.email}`);
  } else {
    console.log(`auth user ${b.email} already exists`);
  }

  const { data: existingBiz } = await supabase
    .from("businesses")
    .select("id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  let businessId = existingBiz?.id;
  if (!businessId) {
    const { data: biz, error } = await supabase
      .from("businesses")
      .insert({
        auth_user_id: authUser.id,
        name: b.name,
        category: b.category,
        location: b.location,
        website: b.website,
        description: b.description,
        logo_url: b.logo_url,
        banner_url: b.banner_url,
        verified: b.verified,
        followers: b.followers,
      })
      .select("id")
      .single();
    if (error) throw error;
    businessId = biz.id;
    console.log(`created business row`);
  } else {
    console.log(`business row already exists`);
  }

  const { data: existingProducts } = await supabase
    .from("products")
    .select("id")
    .eq("business_id", businessId);

  if (!existingProducts || existingProducts.length === 0) {
    const { data: product, error: pErr } = await supabase
      .from("products")
      .insert({ business_id: businessId, ...b.product })
      .select("id")
      .single();
    if (pErr) throw pErr;

    const { error: adErr } = await supabase.from("ads").insert({
      business_id: businessId,
      product_id: product.id,
      video_url: b.video_url,
      poster_url: b.product.image_url,
      caption: b.caption,
      category: b.category,
      cta_label: "Bekijk product",
    });
    if (adErr) throw adErr;

    const { error: rErr } = await supabase.from("rewards").insert({
      business_id: businessId,
      title: b.reward.title,
      description: b.reward.description,
      image_url: b.product.image_url,
      category: b.category,
      token_cost: b.reward.token_cost,
      stock: 100,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
      redemption_method: "code",
    });
    if (rErr) throw rErr;
    console.log(`seeded starter product + ad + reward`);
  } else {
    console.log(`already has products, skipping starter content`);
  }

  console.log(`login: ${b.email} / ${PASSWORD}`);
}

console.log("\nDone.");
