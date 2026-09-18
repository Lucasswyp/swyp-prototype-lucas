"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import { Heart, Bookmark, Share2, Info, Play, Pause } from "lucide-react";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { SwypToken } from "@/components/ui/SwypToken";
import { formatEuro, cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { logInteraction } from "@/lib/data";
import { getDeviceId } from "@/lib/deviceId";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import type { Ad, Company, Product } from "@/types";

interface FeedCardProps {
  ad: Ad;
  company: Company;
  product: Product;
  isActive: boolean;
  onSkip: () => void;
}

export function FeedCard({ ad, company, product, isActive, onSkip }: FeedCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [floatingReward, setFloatingReward] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [watchPct, setWatchPct] = useState(0);

  const x = useMotionValue(0);

  const liked = useAppStore((s) => !!s.likedAds[ad.id]);
  const saved = useAppStore((s) => !!s.savedProductIds[product.id]);
  const toggleLike = useAppStore((s) => s.toggleLike);
  const toggleSave = useAppStore((s) => s.toggleSave);
  const recordWatchProgress = useAppStore((s) => s.recordWatchProgress);
  const { requireAuth } = useConsumerAuth();

  const flashReward = useCallback((label: string) => {
    setFloatingReward(label);
    window.setTimeout(() => setFloatingReward(null), 900);
  }, []);

  const flashToast = useCallback((label: string) => {
    setToast(label);
    window.setTimeout(() => setToast(null), 1400);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive && !paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive, paused]);

  useEffect(() => {
    if (!isActive) return;
    logInteraction({
      deviceId: getDeviceId(),
      businessId: company.id,
      adId: ad.id,
      productId: product.id,
      eventName: "impression",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, ad.id]);

  useEffect(() => {
    // Reset this card's local playback UI when it scrolls out of view, so it
    // starts fresh next time the user swipes back to it.
    if (isActive) return;
    if (videoRef.current) videoRef.current.currentTime = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaused(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWatchPct(0);
  }, [isActive]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    setWatchPct(pct);
    const [crossedWatch80, crossedComplete] = recordWatchProgress(ad.id, pct, ad.rewardRules);
    if (crossedWatch80) {
      logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "watch80" });
    }
    if (crossedComplete) {
      logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "complete" });
    }
  }

  function handleTap() {
    setPaused((p) => !p);
    setShowPauseIcon(true);
    window.setTimeout(() => setShowPauseIcon(false), 500);
  }

  function handleLike() {
    if (!requireAuth()) return;
    const rewarded = toggleLike(ad.id, ad.rewardRules.like);
    if (rewarded) {
      flashReward(`+${ad.rewardRules.like} SWYP`);
      logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "like" });
    }
  }

  function handleSave() {
    if (!requireAuth()) return;
    const rewarded = toggleSave(product.id, ad.id, ad.rewardRules.save);
    if (rewarded) {
      flashReward(`+${ad.rewardRules.save} SWYP`);
      logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "save" });
    }
  }

  function handleClickThrough() {
    logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "click" });
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 110) {
      handleLike();
      x.set(0);
    } else if (info.offset.x < -110) {
      flashToast("Feed aangepast — minder van dit soort content");
      x.set(0);
      onSkip();
    } else {
      x.set(0);
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate select-none">
      <motion.div
        style={{ x }}
        drag="x"
        dragElastic={0.6}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        className="h-full w-full"
      >
        <video
          ref={videoRef}
          src={ad.videoUrl}
          poster={ad.posterUrl}
          muted
          loop
          playsInline
          preload={isActive ? "auto" : "none"}
          onTimeUpdate={handleTimeUpdate}
          onClick={handleTap}
          className="h-full w-full object-cover"
        />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

      {/* watch progress */}
      <div className="absolute top-2 left-3 right-3 h-1 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full bg-white transition-[width] duration-150"
          style={{ width: `${Math.min(100, watchPct)}%` }}
        />
      </div>

      <AnimatePresence>
        {showPauseIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="rounded-full bg-black/40 p-5">
              {paused ? <Play size={32} fill="white" /> : <Pause size={32} fill="white" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {floatingReward && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="pointer-events-none absolute right-8 top-1/3 flex items-center gap-1 rounded-full bg-gradient-to-r from-violet to-magenta px-3 py-1.5 text-sm font-bold shadow-lg"
          >
            <SwypToken size={14} /> {floatingReward}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-xs font-medium whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* right action rail */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
        <button onClick={handleLike} className="flex flex-col items-center gap-1" aria-pressed={liked} aria-label="Like">
          <motion.span whileTap={{ scale: 1.3 }} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
            <Heart size={24} className={liked ? "fill-magenta text-magenta" : "text-white"} />
          </motion.span>
        </button>
        <button onClick={handleSave} className="flex flex-col items-center gap-1" aria-pressed={saved} aria-label="Opslaan">
          <motion.span whileTap={{ scale: 1.3 }} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
            <Bookmark size={22} className={saved ? "fill-white text-white" : "text-white"} />
          </motion.span>
        </button>
        <button
          onClick={() => flashToast("Link gekopieerd naar klembord")}
          className="flex flex-col items-center gap-1"
          aria-label="Delen"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
            <Share2 size={21} className="text-white" />
          </span>
        </button>
        <Link
          href={`/app/product/${product.id}`}
          onClick={handleClickThrough}
          className="flex flex-col items-center gap-1"
          aria-label="Meer info"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
            <Info size={21} className="text-white" />
          </span>
        </Link>
      </div>

      {/* bottom info */}
      <div className="absolute left-3 right-20 bottom-8 z-10 text-white">
        <Link href={`/app/company/${company.id}`} className="flex items-center gap-2 mb-2 w-fit">
          <CompanyAvatar src={company.logoUrl} name={company.name} verified={company.verified} size={30} />
          <span className="font-heading font-bold text-sm">{company.name}</span>
        </Link>
        <p className="text-sm leading-snug mb-2 line-clamp-2">{ad.caption}</p>
        <Link href={`/app/product/${product.id}`} onClick={handleClickThrough} className="block">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold">{product.name}</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-heading text-lg font-extrabold">{formatEuro(product.price)}</span>
            {product.oldPrice && (
              <span className="text-sm text-white/50 line-through">{formatEuro(product.oldPrice)}</span>
            )}
            {product.oldPrice && (
              <span className="rounded-full bg-magenta/20 text-magenta text-xs font-bold px-2 py-0.5">
                -{Math.round((1 - product.price / product.oldPrice) * 100)}%
              </span>
            )}
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-white text-indigo text-sm font-bold px-4 py-2"
            )}
          >
            {ad.ctaLabel} →
          </span>
        </Link>
      </div>
    </div>
  );
}
