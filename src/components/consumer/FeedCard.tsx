"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import { Heart, Bookmark, Share2, Info, Play, Pause } from "lucide-react";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { SwypToken } from "@/components/ui/SwypToken";
import { formatEuro, cn } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";
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
  /** Immediately before/after the active card — worth preloading so the
   * swipe to it doesn't start from zero bytes buffered. */
  isNear?: boolean;
  onSkip: () => void;
}

export function FeedCard({ ad, company, product, isActive, isNear, onSkip }: FeedCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [watchPct, setWatchPct] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [celebration, setCelebration] = useState<{ label: string; big: boolean } | null>(null);

  const x = useMotionValue(0);
  const activeSinceRef = useRef<number | null>(null);
  const watch80FiredRef = useRef(false);

  const { likedAdIds, savedProductIds, toggleSave, awardWatch80, awardLike } = useWallet();
  const markWatched = useAppStore((s) => s.markWatched);
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const liked = optimisticLiked || likedAdIds.has(ad.id);
  const saved = savedProductIds.has(product.id);
  const { requireAuth, isLoggedIn } = useConsumerAuth();

  useEffect(() => {
    if (isActive) {
      activeSinceRef.current = Date.now();
      watch80FiredRef.current = false;
    } else {
      activeSinceRef.current = null;
    }
  }, [isActive]);

  // Routine rewards get a quick, modest pop (~350ms) — reserving the bigger
  // celebration for genuine milestones (a streak week, a new-account bonus)
  // keeps celebratory feedback honest instead of dressing up a 3-token like
  // as if it were a real win (the "losses disguised as wins" slot-machine
  // pattern research flagged as the line not to cross).
  const flashReward = useCallback((label: string, big = false) => {
    setCelebration({ label, big });
    window.setTimeout(() => setCelebration(null), big ? 1100 : 350);
  }, []);

  const flashToast = useCallback((label: string) => {
    setToast(label);
    window.setTimeout(() => setToast(null), 1400);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive || paused) {
      video.pause();
      setBuffering(false);
      return;
    }

    // Show the spinner right away if we're not already mid-playback —
    // "playing" clears it as soon as frames actually start moving.
    if (video.paused) setBuffering(true);

    // .play() can silently no-op or reject if the browser hasn't buffered
    // enough yet (common on a slow connection right after a swipe, since
    // preload only starts in earnest once a card is active/near). Nothing
    // retries on its own, so a video can sit stuck on frame 0 forever.
    // Instead, keep attempting play() on every readiness signal until
    // video.paused actually goes false, then stop.
    let cancelled = false;

    function attemptPlay() {
      if (cancelled || !video || video.paused === false) return;
      video.play().catch(() => {
        // Ignored — the next readiness/timer tick will try again.
      });
    }

    function onPlaying() {
      setBuffering(false);
    }
    function onWaiting() {
      setBuffering(true);
    }
    function onError() {
      // A real media error (interrupted download, decode hiccup — more
      // common on a real device's variable connection than on a desktop
      // test) leaves the element in a broken state that play() alone can't
      // recover from. load() resets it so the next attemptPlay() has a
      // clean start instead of retrying against a dead element forever.
      if (cancelled || !video) return;
      video.load();
      window.setTimeout(attemptPlay, 300);
    }

    attemptPlay();
    video.addEventListener("canplay", attemptPlay);
    video.addEventListener("loadeddata", attemptPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("error", onError);
    video.addEventListener("stalled", onError);

    // Belt-and-suspenders: browsers don't always fire the above events when
    // expected on stock video CDNs, so poll for as long as this card stays
    // active. On a throttled connection (e.g. iOS Low Power Mode, which can
    // delay a request's start well past any fixed timeout) the request may
    // never even reach readyState HAVE_NOTHING -> HAVE_CURRENT_DATA on its
    // own, so this never gives up on its own — only cleanup (card leaves
    // view / unmounts) stops it.
    let stuckTicks = 0;
    const retryInterval = window.setInterval(() => {
      attemptPlay();
      // If we've been sitting at readyState 0 (no data at all) for ~6s
      // straight, the connection likely never got going rather than being
      // merely slow — force a fresh request instead of continuing to poll
      // a socket that's stalled before it started.
      if (video.paused && video.readyState === 0) {
        stuckTicks += 1;
        if (stuckTicks >= 8) {
          stuckTicks = 0;
          video.load();
          window.setTimeout(attemptPlay, 300);
        }
      } else {
        stuckTicks = 0;
      }
    }, 800);

    return () => {
      cancelled = true;
      video.removeEventListener("canplay", attemptPlay);
      video.removeEventListener("loadeddata", attemptPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("error", onError);
      video.removeEventListener("stalled", onError);
      window.clearInterval(retryInterval);
    };
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
    // Watching plays freely as a guest — earning Tokens for it requires an account.
    if (!isLoggedIn) return;
    markWatched(ad.id, pct);
    if (pct >= 80 && !watch80FiredRef.current) {
      watch80FiredRef.current = true;
      const elapsedMs = activeSinceRef.current ? Date.now() - activeSinceRef.current : 0;
      logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "watch80" });
      awardWatch80(ad.id, elapsedMs).then((result) => {
        if (!result.awarded || !result.points) return;
        flashReward(`+${result.points} SWYP`, result.streakBonus === 30);
      });
    }
  }

  const seekFromClientX = useCallback((clientX: number) => {
    const track = progressTrackRef.current;
    const video = videoRef.current;
    if (!track || !video || !video.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setWatchPct(ratio * 100);
  }, []);

  function handleScrubStart(e: React.PointerEvent) {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setScrubbing(true);
    seekFromClientX(e.clientX);
  }

  function handleScrubMove(e: React.PointerEvent) {
    if (!scrubbing) return;
    e.stopPropagation();
    seekFromClientX(e.clientX);
  }

  function handleScrubEnd(e: React.PointerEvent) {
    e.stopPropagation();
    setScrubbing(false);
  }

  function handleTap() {
    setPaused((p) => !p);
    setShowPauseIcon(true);
    window.setTimeout(() => setShowPauseIcon(false), 500);
  }

  function handleLike() {
    if (!requireAuth()) return;
    if (liked) return; // one-time reward — already claimed, nothing more to toggle
    setOptimisticLiked(true); // instant visual feedback, reconciled from the server response below
    logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "like" });
    awardLike(ad.id).then((result) => {
      if (result.awarded && result.points) {
        flashReward(`+${result.points} SWYP`);
      } else if (!result.awarded && result.reason !== "already_awarded") {
        setOptimisticLiked(false); // genuine failure — revert the optimistic fill
      }
    });
  }

  function handleSave() {
    if (!requireAuth()) return;
    const wasSaved = saved;
    toggleSave(product.id, ad.id).then((result) => {
      if (result?.awarded && result.points) flashReward(`+${result.points} SWYP`);
    });
    if (!wasSaved) {
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
          preload={isActive || isNear ? "auto" : "none"}
          onTimeUpdate={handleTimeUpdate}
          onClick={handleTap}
          className="h-full w-full object-cover"
        />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

      <AnimatePresence>
        {isActive && buffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-9 w-9 rounded-full border-2 border-white/25 border-t-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* watch progress — draggable to seek */}
      <div
        className="absolute top-[calc(env(safe-area-inset-top)+0.5rem)] left-3 right-3 z-20 flex h-6 -translate-y-2.5 items-center touch-none"
        onPointerDown={handleScrubStart}
        onPointerMove={handleScrubMove}
        onPointerUp={handleScrubEnd}
        onPointerCancel={handleScrubEnd}
      >
        <div
          ref={progressTrackRef}
          className={cn(
            "relative w-full rounded-full bg-white/20 overflow-visible transition-[height]",
            scrubbing ? "h-1.5" : "h-1"
          )}
        >
          <div
            className="h-full rounded-full bg-white transition-[width] duration-150"
            style={{ width: `${Math.min(100, watchPct)}%` }}
          />
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(0,0,0,0.4)] transition-transform",
              scrubbing ? "h-4 w-4 scale-110" : "h-2.5 w-2.5"
            )}
            style={{ left: `${Math.min(100, watchPct)}%` }}
          />
        </div>
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
        {celebration && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: celebration.big ? -80 : -60, scale: celebration.big ? 1.15 : 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: celebration.big ? 0.5 : 0.25, ease: "easeOut" }}
            className={cn(
              "pointer-events-none absolute right-8 top-1/3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet to-magenta font-bold shadow-lg",
              celebration.big ? "px-4 py-2.5 text-base" : "px-3 py-1.5 text-sm"
            )}
          >
            <SwypToken size={celebration.big ? 18 : 14} /> {celebration.big ? `🔥 Week compleet! ${celebration.label}` : celebration.label}
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
      <div className="absolute right-3 bottom-[calc(env(safe-area-inset-bottom)+12.5rem)] flex flex-col items-center gap-5 z-10">
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
      <div className="absolute left-3 right-20 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-10 text-white">
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
