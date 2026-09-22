"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";
import { createProduct, createAd, createCampaign, uploadAdVideo } from "@/lib/data";
import { formatEuro, cn } from "@/lib/utils";
import type { CampaignObjective, Category, Product } from "@/types";
import { interestOptions } from "@/data/seed";

const objectives: CampaignObjective[] = [
  "Brand awareness",
  "Engagement",
  "Website traffic",
  "Sales",
  "Store visits",
];

const categories: Category[] = ["Fashion", "Food", "Tech", "Fitness", "Travel", "Beauty", "Events", "Days Out", "Restaurants"];

const steps = ["Doel", "Advertentie", "Targeting", "Budget", "Reward", "Preview", "Publiceren"];

export default function CreateCampaignPage() {
  const router = useRouter();
  const { businessId, business } = useBusiness();
  const { products, refresh } = useData();
  const ownProducts = products.filter((p) => p.companyId === businessId);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<CampaignObjective>("Sales");

  // Ad / product
  const [mode, setMode] = useState<"existing" | "new">(ownProducts.length > 0 ? "existing" : "new");
  const [productId, setProductId] = useState(ownProducts[0]?.id ?? "");
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    oldPrice: undefined as number | undefined,
    category: business.category as Category,
    url: "",
    imageUrl: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Bekijk product");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(35);
  const [gender, setGender] = useState<"Alle" | "Man" | "Vrouw">("Alle");
  const [location, setLocation] = useState("Nederland");
  const [radiusKm, setRadiusKm] = useState(50);
  const [interests, setInterests] = useState<Category[]>([business.category as Category]);
  const [dailyBudget, setDailyBudget] = useState(75);
  const [totalBudget, setTotalBudget] = useState(2250);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() =>
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  // Matches award_interaction()'s own per-action bounds/defaults in
  // supabase/rewards.sql — the server clamps into this same range
  // regardless of what's set here, so showing anything outside it would
  // just be a number the business never actually gets charged/pays out.
  const [rewardWatch, setRewardWatch] = useState(15);
  const [rewardLike, setRewardLike] = useState(4);
  const [rewardSave, setRewardSave] = useState(8);
  const [rewardClick, setRewardClick] = useState(10);
  const [published, setPublished] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const selectedExistingProduct: Product | undefined = ownProducts.find((p) => p.id === productId);
  const previewProduct =
    mode === "existing"
      ? selectedExistingProduct
      : ({ ...newProduct, id: "new", companyId: businessId, rating: 5, highlights: [] } as Product);

  function toggleInterest(cat: Category) {
    setInterests((s) => (s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat]));
  }

  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  async function handlePublish() {
    if (!videoFile) {
      setUploadError("Upload eerst een video.");
      return;
    }
    setPublishing(true);
    setUploadError(null);
    try {
      setUploading(true);
      const videoUrl = await uploadAdVideo(businessId, videoFile);
      setUploading(false);

      let finalProductId = productId;
      let posterUrl = selectedExistingProduct?.imageUrl ?? "";
      if (mode === "new") {
        const created = await createProduct(businessId, {
          name: newProduct.name,
          description: newProduct.description,
          imageUrl: newProduct.imageUrl || videoUrl,
          price: newProduct.price,
          oldPrice: newProduct.oldPrice,
          category: newProduct.category,
          url: newProduct.url,
        });
        finalProductId = created.id;
        posterUrl = created.imageUrl;
      }

      const adId = await createAd(businessId, {
        productId: finalProductId,
        videoUrl,
        posterUrl,
        caption,
        category: mode === "new" ? newProduct.category : selectedExistingProduct?.category ?? business.category,
        ctaLabel,
      });

      const campaignName = name || `${mode === "new" ? newProduct.name : selectedExistingProduct?.name} campagne`;
      const campaignId = await createCampaign(businessId, {
        name: campaignName,
        objective,
        status: "Active",
        adId,
        dailyBudget,
        totalBudget,
        startDate,
        endDate,
        targeting: { ageMin, ageMax, gender, location, radiusKm, interests },
        rewardRules: { watch80: rewardWatch, like: rewardLike, save: rewardSave, click: rewardClick },
      });

      refresh();
      setPublished(campaignId);
      setStep(6);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Er ging iets mis bij het publiceren.");
    } finally {
      setPublishing(false);
      setUploading(false);
    }
  }

  const canGoToStep2 = mode === "existing" ? !!productId : newProduct.name && newProduct.price > 0 && newProduct.url;
  const canGoToStep3 = !!videoFile && !!caption;

  if (published) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <Check size={30} className="text-emerald-400" />
        </div>
        <h1 className="font-heading text-2xl font-bold mb-2">Campagne live!</h1>
        <p className="text-white/50 text-sm mb-8">
          Je campagne is gepubliceerd met je eigen video en zichtbaar voor alle Swyp-gebruikers.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => router.push("/business/campaigns")}>
            Naar overzicht
          </Button>
          <Button onClick={() => router.push(`/business/campaigns/${published}`)}>Bekijk analytics</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-1">Nieuwe campagne</h1>
      <p className="text-white/50 text-sm mb-6">Stap {step + 1} van {steps.length}: {steps[step]}</p>

      <div className="flex gap-1.5 mb-8">
        {steps.map((s, i) => (
          <div key={s} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-gradient-to-r from-violet to-magenta" : "bg-white/10")} />
        ))}
      </div>

      <Card className="p-6 mb-6">
        {step === 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Campagnenaam</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bv. Herfstcollectie Launch"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm mb-6 outline-none focus:border-violet"
            />
            <label className="block text-sm font-medium mb-3">Campagnedoel</label>
            <div className="grid grid-cols-2 gap-2.5">
              {objectives.map((o) => (
                <button
                  key={o}
                  onClick={() => setObjective(o)}
                  className={cn(
                    "rounded-xl border p-3.5 text-left text-sm font-medium",
                    objective === o ? "border-transparent bg-gradient-to-r from-violet to-magenta" : "border-white/10 bg-white/5 text-white/70"
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="flex gap-2">
              <button
                onClick={() => setMode("existing")}
                className={cn("rounded-full px-4 py-1.5 text-sm border", mode === "existing" ? "bg-white text-indigo border-transparent" : "border-white/15 text-white/60")}
                disabled={ownProducts.length === 0}
              >
                Bestaand product
              </button>
              <button
                onClick={() => setMode("new")}
                className={cn("rounded-full px-4 py-1.5 text-sm border", mode === "new" ? "bg-white text-indigo border-transparent" : "border-white/15 text-white/60")}
              >
                Nieuw product
              </button>
            </div>

            {mode === "existing" ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {ownProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProductId(p.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left",
                      productId === p.id ? "border-magenta bg-magenta/10" : "border-white/10 bg-white/5"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-white/40 truncate">{formatEuro(p.price)}</p>
                    </div>
                  </button>
                ))}
                {ownProducts.length === 0 && (
                  <p className="text-sm text-white/40">Je hebt nog geen producten. Kies &quot;Nieuw product&quot;.</p>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5 text-white/60">Productnaam</label>
                  <input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5 text-white/60">Omschrijving</label>
                  <input
                    value={newProduct.description}
                    onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-white/60">Prijs (€)</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-white/60">Categorie</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value as Category }))}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-slate">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5 text-white/60">Link naar jouw winkel (echte URL)</label>
                  <input
                    value={newProduct.url}
                    onChange={(e) => setNewProduct((p) => ({ ...p, url: e.target.value }))}
                    placeholder="https://jouwwinkel.nl/product"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5 text-white/60">Productfoto URL (optioneel)</label>
                  <input
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                  />
                </div>
              </div>
            )}

            <div className="border-t border-white/10 pt-5">
              <label className="block text-sm font-medium mb-2">Video uploaden</label>
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 cursor-pointer hover:border-violet/50">
                {videoPreview ? (
                  <video src={videoPreview} className="h-40 rounded-lg" muted controls />
                ) : (
                  <>
                    <Upload size={24} className="text-white/40" />
                    <span className="text-sm text-white/50">Klik om een video te kiezen (mp4, verticaal aanbevolen)</span>
                  </>
                )}
                <input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-white/60">Caption</label>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Korte, pakkende tekst bij de video"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-white/60">CTA-tekst</label>
                <input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">Leeftijd: {ageMin} – {ageMax}</label>
              <div className="flex gap-3">
                <input type="range" min={16} max={65} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} className="flex-1" />
                <input type="range" min={16} max={65} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} className="flex-1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Geslacht</label>
              <div className="flex gap-2">
                {(["Alle", "Man", "Vrouw"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={cn("rounded-full px-4 py-1.5 text-sm border", gender === g ? "bg-white text-indigo border-transparent" : "border-white/15 text-white/60")}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Locatie</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Radius (km)</label>
                <input type="number" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Interesses</label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleInterest(cat)}
                    className={cn("rounded-full px-3 py-1.5 text-xs font-medium border", interests.includes(cat) ? "bg-white text-indigo border-transparent" : "border-white/15 text-white/60")}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Dagbudget (€)</label>
              <input type="number" value={dailyBudget} onChange={(e) => setDailyBudget(Number(e.target.value))} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Totaalbudget (€)</label>
              <input type="number" value={totalBudget} onChange={(e) => setTotalBudget(Number(e.target.value))} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Startdatum</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Einddatum</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Watch 80%", value: rewardWatch, set: setRewardWatch, min: 10, max: 25 },
              { label: "Like", value: rewardLike, set: setRewardLike, min: 1, max: 8 },
              { label: "Save", value: rewardSave, set: setRewardSave, min: 3, max: 15 },
              { label: "Click", value: rewardClick, set: setRewardClick, min: 5, max: 20 },
            ].map((r) => (
              <div key={r.label}>
                <label className="block text-sm font-medium mb-2">
                  {r.label} <span className="text-white/40 font-normal">({r.min}-{r.max})</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={r.min}
                    max={r.max}
                    value={r.value}
                    onChange={(e) => r.set(Math.max(r.min, Math.min(r.max, Number(e.target.value))))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet"
                  />
                  <TokenBadge amount={r.value} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 5 && previewProduct && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-[280px] h-[500px] rounded-3xl overflow-hidden border border-white/10 bg-slate">
              {videoPreview && (
                <video src={videoPreview} className="absolute inset-0 h-full w-full object-cover" muted autoPlay loop playsInline />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
              <div className="absolute left-3 right-3 bottom-4 text-white">
                <div className="flex items-center gap-1.5 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={business.logoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                  <span className="text-xs font-bold">{business.name}</span>
                </div>
                <p className="text-xs mb-2 line-clamp-2">{caption}</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-heading font-extrabold text-sm">{formatEuro(previewProduct.price)}</span>
                  {previewProduct.oldPrice && (
                    <span className="text-xs text-white/50 line-through">{formatEuro(previewProduct.oldPrice)}</span>
                  )}
                </div>
                <span className="inline-block rounded-full bg-white text-indigo text-xs font-bold px-3 py-1.5">
                  {ctaLabel} →
                </span>
              </div>
            </div>
            {uploadError && <p className="text-sm text-red-300">{uploadError}</p>}
            {uploading && <p className="text-sm text-white/50">Video wordt geüpload...</p>}
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="secondary" disabled={step === 0 || publishing} onClick={() => setStep((s) => s - 1)}>
          Vorige
        </Button>
        {step < 5 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={(step === 1 && (!canGoToStep2 || !canGoToStep3))}
          >
            Volgende
          </Button>
        ) : (
          <Button onClick={handlePublish} disabled={publishing}>
            {publishing ? "Bezig met publiceren..." : "Publiceer campagne"}
          </Button>
        )}
      </div>
    </div>
  );
}
