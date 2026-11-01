import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAlgoliaWriteClient, SEARCH_INDEX_NAME, type SearchRecord } from "@/lib/algolia";

export const runtime = "nodejs";
export const maxDuration = 60;

// Two ways in: Vercel's daily cron (Hobby plan caps cron frequency at once a
// day, so relying on that alone means a just-approved ad can take up to 24h
// to become searchable) signs requests with CRON_SECRET; the admin ads-review
// page instead calls this with the browser's own session cookie right after
// approving/rejecting an ad, so search catches up within seconds — that path
// re-checks is_admin() server-side rather than trusting the client.
async function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) return true;

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: companies }, { data: products }, { data: rewards }, { data: ads }] = await Promise.all([
    admin.from("businesses").select("id, name, category, location, description, logo_url, banner_url, verified, followers"),
    admin.from("products").select("id, business_id, name, description, category, price, old_price, image_url, rating, highlights, url"),
    admin.from("rewards").select("id, business_id, title, description, category, token_cost, money_value, image_url"),
    // Only approved ads are searchable — a business's pending/rejected
    // submission shouldn't be discoverable before (or instead of) review.
    admin.from("ads").select("id, business_id, product_id, caption, category, video_url, poster_url, cta_label, moderation_status").eq("moderation_status", "approved"),
  ]);

  // Ads whose campaign is paused, over budget or ended must not be searchable.
  const { data: liveIds } = await admin.rpc("live_ad_ids");
  const live = new Set((liveIds ?? []) as string[]);

  // Verborgen bedrijven (zie supabase/hide_demo.sql) horen niet in de zoekindex.
  const hiddenIds = new Set(((await admin.from("businesses").select("id").eq("hidden", true)).data ?? []).map((b) => b.id));
  const isVisible = (businessId: string) => !hiddenIds.has(businessId);

  const companyById = new Map((companies ?? []).map((c) => [c.id, c]));

  const records: SearchRecord[] = [
    ...(companies ?? []).filter((c) => isVisible(c.id)).map((c): SearchRecord => ({
      objectID: `company-${c.id}`,
      type: "company",
      name: c.name,
      category: c.category ?? "",
      location: c.location ?? "",
      description: c.description ?? "",
      logoUrl: c.logo_url ?? "",
      bannerUrl: c.banner_url ?? "",
      verified: c.verified ?? false,
      followers: c.followers ?? 0,
    })),
    ...(products ?? []).filter((p) => isVisible(p.business_id)).map((p): SearchRecord => {
      const company = companyById.get(p.business_id);
      return {
        objectID: `product-${p.id}`,
        type: "product",
        name: p.name,
        description: p.description ?? "",
        category: p.category ?? "",
        price: Number(p.price),
        oldPrice: p.old_price ? Number(p.old_price) : undefined,
        imageUrl: p.image_url ?? "",
        rating: Number(p.rating ?? 4.5),
        highlights: p.highlights ?? [],
        url: p.url ?? undefined,
        companyId: p.business_id,
        companyName: company?.name ?? "",
        companyLogoUrl: company?.logo_url ?? "",
        companyVerified: company?.verified ?? false,
      };
    }),
    ...(rewards ?? []).filter((r) => isVisible(r.business_id)).map((r): SearchRecord => {
      const company = companyById.get(r.business_id);
      return {
        objectID: `reward-${r.id}`,
        type: "reward",
        title: r.title,
        description: r.description ?? undefined,
        category: r.category ?? "",
        tokenCost: r.token_cost,
        moneyValue: r.money_value ? Number(r.money_value) : undefined,
        imageUrl: r.image_url ?? "",
        companyId: r.business_id,
        companyName: company?.name ?? "",
        companyLogoUrl: company?.logo_url ?? "",
      };
    }),
    ...(ads ?? []).filter((a) => live.has(a.id) && isVisible(a.business_id)).map((a): SearchRecord => {
      const company = companyById.get(a.business_id);
      return {
        objectID: `ad-${a.id}`,
        type: "ad",
        caption: a.caption ?? "",
        category: a.category ?? "",
        videoUrl: a.video_url,
        posterUrl: a.poster_url ?? "",
        ctaLabel: a.cta_label ?? "Bekijk product",
        productId: a.product_id,
        companyId: a.business_id,
        companyName: company?.name ?? "",
        companyLogoUrl: company?.logo_url ?? "",
        companyVerified: company?.verified ?? false,
      };
    }),
  ];

  const client = createAlgoliaWriteClient();
  await client.setSettings({
    indexName: SEARCH_INDEX_NAME,
    indexSettings: {
      searchableAttributes: [
        "name",
        "title",
        "caption",
        "companyName",
        "description",
        "category",
        "location",
      ],
      attributesForFaceting: ["type", "category"],
    },
  });
  // replaceAllObjects (not saveObjects) — atomically swaps in a fresh index
  // built from this exact record set, so an ad that got unapproved or a
  // product a business deleted since the last run actually disappears from
  // search instead of lingering as a stale hit forever.
  await client.replaceAllObjects({
    indexName: SEARCH_INDEX_NAME,
    objects: records as unknown as Record<string, unknown>[],
  });

  return NextResponse.json({ indexed: records.length });
}
