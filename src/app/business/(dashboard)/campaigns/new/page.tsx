"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";
import { createProduct, updateProduct, createAd, createCampaign, uploadAdVideo, uploadAdImage, FIXED_REWARDS } from "@/lib/data";
import { PhotoUpload } from "@/components/business/PhotoUpload";
import { NumberField } from "@/components/ui/NumberField";
import { CTA_DEFAULT_COLOR, CTA_PRESETS, ctaTextColor, normalizeCtaColor } from "@/lib/ctaColor";
import { CTA_DEFAULT_LABEL, ctaLabelForObjective, isPresetCtaLabel } from "@/lib/ctaLabels";
import { CtaLabelPicker } from "@/components/business/CtaLabelPicker";
import { MAX_VIDEO_SECONDS, describeVideoFormat, isVideoTooLong, videoFit } from "@/lib/videoFit";
import { USE_MUX, uploadVideoToMux, type UploadProgress } from "@/lib/muxUpload";
import { formatPrice, cn } from "@/lib/utils";
import type { CampaignObjective, Category, Product } from "@/types";
import { interestOptions } from "@/data/seed";

const objectives: CampaignObjective[] = [
  "Brand awareness",
  "Engagement",
  "Website traffic",
  "Sales",
  "Store visits",
  "App downloads",
];

const categories: Category[] = ["Fashion", "Food", "Tech", "Fitness", "Travel", "Beauty", "Events", "Days Out", "Restaurants"];

const steps = ["Doel", "Advertentie", "Targeting", "Budget", "Preview", "Publiceren"];

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
  const [ctaLabel, setCtaLabel] = useState<string>(ctaLabelForObjective("Sales"));
  // Zodra het bedrijf zelf een knoptekst kiest, verandert die niet meer mee met het campagnedoel.
  const [ctaTouched, setCtaTouched] = useState(false);
  const [ctaCustom, setCtaCustom] = useState(false);
  const [ctaColor, setCtaColor] = useState<string>(CTA_DEFAULT_COLOR);
  const [videoSize, setVideoSize] = useState<{ w: number; h: number } | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isFree, setIsFree] = useState(false);
  // Geen begin- en einddatum: de campagne start direct en loopt tot het budget op is.
  const [noDates, setNoDates] = useState(false);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

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
  const [published, setPublished] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const selectedExistingProduct: Product | undefined = ownProducts.find((p) => p.id === productId);
  const previewProduct =
    mode === "existing"
      ? selectedExistingProduct
      : ({ ...newProduct, price: isFree ? 0 : newProduct.price, id: "new", companyId: businessId, rating: 5, highlights: [] } as Product);

  function toggleInterest(cat: Category) {
    setInterests((s) => (s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat]));
  }

  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoSize(null);
    setVideoDuration(null);
    setVideoPreview(URL.createObjectURL(file));
  }

  function handleThumbSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
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
      let videoUrl: string;
      let uploadedPoster = "";
      try {
        if (!USE_MUX) throw new Error("mux-disabled");
        const uploaded = await uploadVideoToMux(videoFile, setUploadProgress);
        videoUrl = uploaded.videoUrl;
        uploadedPoster = uploaded.posterUrl;
      } catch (muxErr) {
        // Een te lange video blijft te lang, ook zonder Mux.
        if (muxErr instanceof Error && muxErr.message.startsWith("Deze video is langer")) throw muxErr;
        // Mux unavailable or at its plan limit: the ad must still go live,
        // so fall back to plain storage instead of failing the whole publish.
        // Storage accepts at most 50 MB; for a bigger file say why Mux failed
        // instead of showing a storage error nobody can act on.
        setUploadProgress(null);
        if (videoFile.size > 50 * 1024 * 1024) {
          const reason = muxErr instanceof Error && muxErr.message !== "mux-disabled" ? ` (${muxErr.message})` : "";
          throw new Error(
            `Deze video is ${Math.round(videoFile.size / 1048576)} MB. De videodienst (Mux) werkt nu niet${reason} en zonder die dienst is 50 MB het maximum. Maak de video kleiner of probeer het later opnieuw.`
          );
        }
        videoUrl = await uploadAdVideo(businessId, videoFile);
      }
      if (thumbFile) uploadedPoster = await uploadAdImage(businessId, thumbFile);
      setUploading(false);
      setUploadProgress(null);

      let finalProductId = productId;
      let posterUrl = uploadedPoster || (selectedExistingProduct?.imageUrl ?? "");
      if (mode === "new") {
        const created = await createProduct(businessId, {
          name: newProduct.name,
          description: newProduct.description,
          imageUrl: newProduct.imageUrl || uploadedPoster,
          price: isFree ? 0 : newProduct.price,
          oldPrice: newProduct.oldPrice,
          category: newProduct.category,
          url: newProduct.url,
        });
        finalProductId = created.id;
        posterUrl = uploadedPoster || created.imageUrl;
      }

      const adId = await createAd(businessId, {
        productId: finalProductId,
        videoUrl,
        posterUrl,
        caption,
        category: mode === "new" ? newProduct.category : selectedExistingProduct?.category ?? business.category,
        ctaLabel,
        ctaColor,
      });

      const campaignName = name || `${mode === "new" ? newProduct.name : selectedExistingProduct?.name} campagne`;
      const campaignId = await createCampaign(businessId, {
        name: campaignName,
        objective,
        status: "Active",
        adId,
        dailyBudget,
        totalBudget,
        startDate: noDates ? "" : startDate,
        endDate: noDates ? "" : endDate,
        targeting: { ageMin, ageMax, gender, location, radiusKm, interests },
        rewardRules: { ...FIXED_REWARDS },
      });

      refresh();
      setPublished(campaignId);
      setStep(5);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Er ging iets mis bij het publiceren.");
    } finally {
      setPublishing(false);
      setUploading(false);
      setUploadProgress(null);
    }
  }

  const canGoToStep2 = mode === "existing" ? !!productId : newProduct.name && (isFree || newProduct.price > 0) && newProduct.url;
  const videoTooLong = videoDuration !== null && isVideoTooLong(videoDuration);
  const canGoToStep3 = !!videoFile && !!caption && !videoTooLong;

  if (published) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <Check size={30} className="text-emerald-400" />
        </div>
        <h1 className="font-heading text-2xl font-bold mb-2">Campagne ingediend!</h1>
        <p className="text-white/50 text-sm mb-8">
          Je campagne is aangemaakt met je eigen video. Swyp controleert de video eerst; zodra hij is goedgekeurd is hij zichtbaar voor alle Swyp-gebruikers.
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
                  onClick={() => {
                    setObjective(o);
                    if (!ctaTouched) setCtaLabel(ctaLabelForObjective(o));
                  }}
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
              <div className="flex flex-col gap-4">
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
                    <SafeImage src={p.imageUrl} className="h-14 w-14 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-white/40 truncate">{formatPrice(p.price)}</p>
                    </div>
                  </button>
                ))}
                {ownProducts.length === 0 && (
                  <p className="text-sm text-white/40">Je hebt nog geen producten. Kies &quot;Nieuw product&quot;.</p>
                )}
              </div>
              {selectedExistingProduct && (
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-white/60">
                    Productfoto van &quot;{selectedExistingProduct.name}&quot; wijzigen (optioneel)
                  </label>
                  <PhotoUpload
                    businessId={businessId}
                    imageUrl={selectedExistingProduct.imageUrl}
                    changeLabel="Andere productfoto kiezen"
                    onChange={async (url) => {
                      await updateProduct({ ...selectedExistingProduct, imageUrl: url });
                      refresh();
                    }}
                  />
                  <p className="mt-1.5 text-[11px] text-white/40">De nieuwe foto geldt meteen voor dit product.</p>
                </div>
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
                  <NumberField
                    allowDecimals
                    value={isFree ? 0 : newProduct.price}
                    disabled={isFree}
                    onChange={(price) => setNewProduct((p) => ({ ...p, price }))}
                    placeholder={isFree ? "Gratis" : "0"}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet disabled:opacity-50"
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                    <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
                    Gratis, zonder prijs (app-download, naamsbekendheid)
                  </label>
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
                  <label className="block text-xs font-medium mb-1.5 text-white/60">Link naar jouw winkel, website of App Store (echte URL)</label>
                  <input
                    value={newProduct.url}
                    onChange={(e) => setNewProduct((p) => ({ ...p, url: e.target.value }))}
                    placeholder="https://jouwwinkel.nl/product"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5 text-white/60">Productfoto (optioneel)</label>
                  <PhotoUpload
                    businessId={businessId}
                    imageUrl={newProduct.imageUrl || undefined}
                    onChange={(url) => setNewProduct((p) => ({ ...p, imageUrl: url }))}
                    label="Productfoto uploaden"
                  />
                  <input
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="of plak een link naar een foto (https://...)"
                    className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                  />
                </div>
              </div>
            )}

            <div className="border-t border-white/10 pt-5">
              <label className="block text-sm font-medium mb-1">Video uploaden</label>
              <p className="text-xs text-white/50 mb-2">
                Beste formaat: staand 9:16 (1080 × 1920), precies zoals een Instagram Reel of TikTok. Je kunt dezelfde video
                gebruiken. Houd belangrijke beelden en tekst in het midden: onderaan staan je tekst en knop.
              </p>
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 cursor-pointer hover:border-violet/50">
                {videoPreview ? (
                  <video
                    src={videoPreview}
                    className="h-40 rounded-lg"
                    muted
                    controls
                    onLoadedMetadata={(e) => {
                      setVideoSize({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight });
                      setVideoDuration(e.currentTarget.duration);
                    }}
                  />
                ) : (
                  <>
                    <Upload size={24} className="text-white/40" />
                    <span className="text-sm text-white/50">Klik om een video te kiezen (mp4 of mov, staand 9:16, maximaal 1 minuut)</span>
                  </>
                )}
                <input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
              </label>
              {videoTooLong && videoDuration !== null && (
                <p className="text-xs mt-2 text-red-300">
                  Deze video duurt {Math.round(videoDuration)} seconden. De maximale lengte is {MAX_VIDEO_SECONDS} seconden (1 minuut). Kort hem in en kies hem opnieuw.
                </p>
              )}
              {videoSize && (() => {
                const info = describeVideoFormat(videoSize.w, videoSize.h);
                return info.text ? (
                  <p className={cn("text-xs mt-2", info.ok ? "text-emerald-300" : "text-amber-300")}>{info.text}</p>
                ) : null;
              })()}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Thumbnail van de video (optioneel)</label>
              <p className="text-[11px] text-white/40 mb-2">Dit plaatje zie je voordat de video start. Zonder thumbnail nemen we een beeld uit de video. Staand 9:16 werkt het mooist.</p>
              <div className="flex items-center gap-3">
                {thumbPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbPreview} alt="" className="h-20 w-[45px] rounded-lg object-cover" />
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:border-violet/50">
                  <Upload size={16} className="text-white/50" />
                  {thumbPreview ? "Andere thumbnail kiezen" : "Thumbnail uploaden"}
                  <input type="file" accept="image/*" onChange={handleThumbSelect} className="hidden" />
                </label>
                {thumbPreview && (
                  <button type="button" className="text-xs text-white/50 underline" onClick={() => { setThumbFile(null); setThumbPreview(null); }}>
                    Verwijderen
                  </button>
                )}
              </div>
            </div>

            <div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-white/60">Caption</label>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Korte, pakkende tekst bij de video"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
                />
              </div>
            </div>

            <CtaLabelPicker
              value={ctaLabel}
              custom={ctaCustom}
              onPick={(label) => {
                setCtaLabel(label);
                setCtaCustom(false);
                setCtaTouched(true);
              }}
              onCustom={() => {
                setCtaCustom(true);
                setCtaTouched(true);
                if (isPresetCtaLabel(ctaLabel)) setCtaLabel("");
              }}
              onType={setCtaLabel}
            />

            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Kleur van de knop</label>
              <div className="flex flex-wrap items-center gap-2">
                {CTA_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => setCtaColor(c.hex)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2",
                      normalizeCtaColor(ctaColor) === c.hex ? "border-white" : "border-white/20"
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <label className="flex items-center gap-2 text-xs text-white/60 ml-2">
                  Eigen kleur
                  <input
                    type="color"
                    value={normalizeCtaColor(ctaColor)}
                    onChange={(e) => setCtaColor(e.target.value)}
                    className="h-8 w-10 rounded bg-transparent border border-white/20 cursor-pointer"
                  />
                </label>
              </div>
              <span
                className="inline-flex mt-3 items-center gap-1.5 rounded-full text-sm font-bold px-4 py-2"
                style={{ backgroundColor: normalizeCtaColor(ctaColor), color: ctaTextColor(ctaColor) }}
              >
                {ctaLabel.trim() || CTA_DEFAULT_LABEL} →
              </span>
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
                <NumberField value={radiusKm} onChange={setRadiusKm} ariaLabel="Radius in kilometers" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet" />
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
              <NumberField value={dailyBudget} onChange={setDailyBudget} ariaLabel="Dagbudget" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Totaalbudget (€)</label>
              <NumberField value={totalBudget} onChange={setTotalBudget} ariaLabel="Totaalbudget" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet" />
            </div>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input type="checkbox" checked={noDates} onChange={(e) => setNoDates(e.target.checked)} />
              Geen begin- en einddatum: de campagne start direct en loopt door tot het budget op is
            </label>
            <div>
              <label className="block text-sm font-medium mb-2">Startdatum</label>
              <input type="date" disabled={noDates} value={noDates ? "" : startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet disabled:opacity-40" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Einddatum</label>
              <input type="date" disabled={noDates} value={noDates ? "" : endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet disabled:opacity-40" />
            </div>
          </div>
        )}

        {step === 4 && previewProduct && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-[280px] h-[500px] rounded-3xl overflow-hidden border border-white/10 bg-slate">
              {videoPreview && (
                <video
                  src={videoPreview}
                  poster={thumbPreview ?? undefined}
                  className={cn(
                    "absolute inset-0 h-full w-full",
                    videoSize && videoFit(videoSize.w, videoSize.h) === "contain" ? "object-contain" : "object-cover"
                  )}
                  muted
                  autoPlay
                  loop
                  playsInline
                />
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
                  <span className="font-heading font-extrabold text-sm">{formatPrice(previewProduct.price)}</span>
                  {previewProduct.oldPrice && (
                    <span className="text-xs text-white/50 line-through">{formatPrice(previewProduct.oldPrice)}</span>
                  )}
                </div>
                <span
                  className="inline-block rounded-full text-xs font-bold px-3 py-1.5"
                  style={{ backgroundColor: normalizeCtaColor(ctaColor), color: ctaTextColor(ctaColor) }}
                >
                  {ctaLabel.trim() || CTA_DEFAULT_LABEL} →
                </span>
              </div>
            </div>
            {uploadError && <p className="text-sm text-red-300">{uploadError}</p>}
            {uploading && (
              <p className="text-sm text-white/50">
                {uploadProgress?.stage === "processing"
                  ? "Video wordt verwerkt..."
                  : uploadProgress
                    ? `Video wordt geüpload... ${uploadProgress.percent}%`
                    : "Video wordt geüpload..."}
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="secondary" disabled={step === 0 || publishing} onClick={() => setStep((s) => s - 1)}>
          Vorige
        </Button>
        {step < 4 ? (
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
