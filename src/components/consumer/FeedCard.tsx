"use client";

import posthog from "posthog-js";
import { useHlsSource } from "@/lib/useHlsSource";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import { Heart, Bookmark, Share2, Info, Play, Pause, MoreVertical } from "lucide-react";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { SwypToken } from "@/components/ui/SwypToken";
import { ReportBlockSheet } from "@/components/consumer/ReportBlockSheet";
import { formatEuro, cn } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";
import { useAppStore } from "@/store/useAppStore";
import { logInteraction } from "@/lib/data";
import { getDeviceId } from "@/lib/deviceId";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { shareLink } from "@/lib/share";
import type { ReportReason } from "@/lib/safety";
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
  const { needsHlsJs, hlsRef } = useHlsSource(videoRef, ad.videoUrl, !!(isActive || isNear));
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [watchPct, setWatchPct] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [celebration, setCelebration] = useState<{ label: string; big: boolean } | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; rotate: number }[]>([]);
  // True when the video is fully buffered and ready but still paused —
  // iOS Low Power Mode blocks ALL programmatic video autoplay (muted or
  // not) as a battery-saving measure, so attemptPlay() below can retry
  // forever and never succeed. This surfaces a real, tappable affordance
  // instead of a frozen first frame that looks broken.
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);
  const heartIdRef = useRef(0);
  const lastTapAtRef = useRef(0);

  const x = useMotionValue(0);
  const watch80FiredRef = useRef(false);
  const completeFiredRef = useRef(false);
  // Accumulated *actual playback* time (ms) while this card is active, not
  // paused, and not being scrubbed — unlike a plain wall-clock timer since
  // the card became active, this can't be satisfied by waiting a few seconds
  // and then dragging the scrubber straight to 80%, since a scrub doesn't
  // advance it at all.
  const playedMsRef = useRef(0);
  const lastPlayingTickRef = useRef<number | null>(null);

  const { likedAdIds, savedProductIds, toggleSave, awardWatch80, awardLike, toggleBlock, report } = useWallet();
  const markWatched = useAppStore((s) => s.markWatched);
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const liked = optimisticLiked || likedAdIds.has(ad.id);
  const saved = savedProductIds.has(product.id);
  const { requireAuth, isLoggedIn } = useConsumerAuth();
  const [safetySheetOpen, setSafetySheetOpen] = useState(false);

  function handleReport(reason: ReportReason) {
    return report("ad", ad.id, reason);
  }

  function handleBlock() {
    return toggleBlock(company.id).then(() => onSkip());
  }

  useEffect(() => {
    if (isActive) {
      watch80FiredRef.current = false;
      completeFiredRef.current = false;
      playedMsRef.current = 0;
      lastPlayingTickRef.current = null;
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBuffering(false);
      setNeedsTapToPlay(false);
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
      video.muted = true;
      video.play().catch(() => {
        // Ignored — the next readiness/timer tick will try again.
      });
    }

    function onPlaying() {
      setBuffering(false);
      setNeedsTapToPlay(false);
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
      if (cancelled || !video || hlsRef.current) return;
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
        if (stuckTicks >= 8 && !hlsRef.current) {
          stuckTicks = 0;
          video.load();
          window.setTimeout(attemptPlay, 300);
        }
      } else {
        stuckTicks = 0;
      }
    }, 800);

    // If the video is fully buffered (readyState >= 3, HAVE_FUTURE_DATA —
    // genuinely ready, not just "still loading") but still paused after a
    // beat, every retry above has already failed silently: this is a real
    // policy block (Low Power Mode), not a slow connection, and no amount
    // of further retrying will fix it without a direct tap.
    const tapToPlayTimeout = window.setTimeout(() => {
      if (!cancelled && video.paused && video.readyState >= 3) {
        setNeedsTapToPlay(true);
      }
    }, 1200);

    return () => {
      cancelled = true;
      video.removeEventListener("canplay", attemptPlay);
      video.removeEventListener("loadeddata", attemptPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("error", onError);
      video.removeEventListener("stalled", onError);
      window.clearInterval(retryInterval);
      window.clearTimeout(tapToPlayTimeout);
    };
  }, [isActive, paused, hlsRef]);

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
    setWatchPct(0);
  }, [isActive]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    setWatchPct(pct);

    // Accumulate real playback time: only while genuinely playing forward,
    // never while paused or mid-scrub, so dragging the progress bar straight
    // to 80% can't substitute for actually watching.
    const now = Date.now();
    if (isActive && !paused && !scrubbing) {
      if (lastPlayingTickRef.current !== null) {
        const delta = now - lastPlayingTickRef.current;
        // Cap a single tick's contribution so a backgrounded/throttled tab
        // resuming after a long gap can't credit that whole gap as playback.
        playedMsRef.current += Math.max(0, Math.min(delta, 1000));
      }
      lastPlayingTickRef.current = now;
    } else {
      lastPlayingTickRef.current = null;
    }

    if (pct >= 100 && !completeFiredRef.current) {
      completeFiredRef.current = true;
      logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "complete" });
    }

    // Watching plays freely as a guest — earning Tokens for it requires an account.
    if (!isLoggedIn) return;
    markWatched(ad.id, pct);
    if (pct >= 80 && !watch80FiredRef.current) {
      watch80FiredRef.current = true;
      awardWatch80(ad.id, playedMsRef.current).then((result) => {
        // Only log the analytics event once the server actually confirms a
        // new award — otherwise re-watching an already-awarded ad (no new
        // reward, but this still runs) would keep inflating "watch80" counts
        // relative to "impression", pushing completion rate over 100%.
        if (!result.awarded) return;
        logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "watch80" });
        if (result.points) flashReward(`+${result.points} SWYP`, result.streakBonus === 30);
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

  // Runs the play()/pause() call synchronously inside the tap's own event
  // handler rather than through React state + a useEffect reacting to it a
  // tick later — iOS ties its "was this genuinely user-initiated" check to
  // the gesture's own call stack, and a deferred call loses that standing.
  // Under Low Power Mode specifically, iOS blocks ALL video autoplay outside
  // a direct gesture (muted or not), so this is the only reliable way a tap
  // can un-stick a video that autoplay never managed to start.
  function handleTap() {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.muted = true;
        video.play().catch(() => {});
        setPaused(false);
        setNeedsTapToPlay(false);
      } else {
        video.pause();
        setPaused(true);
      }
    }
    setShowPauseIcon(true);
    window.setTimeout(() => setShowPauseIcon(false), 500);
  }

  // Two hearts at random offsets from the tap point, not one centered one —
  // reads as a livelier "double-tap to like" burst than the single Instagram-
  // style heart everyone's already seen a thousand times.
  function spawnHeartBurst(clientX: number, clientY: number) {
    const rect = videoRef.current?.getBoundingClientRect();
    if (!rect) return;
    const baseX = ((clientX - rect.left) / rect.width) * 100;
    const baseY = ((clientY - rect.top) / rect.height) * 100;
    const newHearts = [0, 1].map(() => ({
      id: heartIdRef.current++,
      x: Math.min(88, Math.max(12, baseX + (Math.random() * 36 - 18))),
      y: Math.min(82, Math.max(18, baseY + (Math.random() * 36 - 18))),
      rotate: Math.random() * 30 - 15,
    }));
    setHearts((h) => [...h, ...newHearts]);
    window.setTimeout(() => {
      setHearts((h) => h.filter((existing) => !newHearts.some((n) => n.id === existing.id)));
    }, 800);
  }

  // Every tap toggles play/pause immediately (see handleTap) — deferring it
  // behind a "wait, is a second tap coming?" timeout, like standard
  // double-tap detection does, would push the play() call outside the
  // gesture's own call stack and break iOS's autoplay-gesture check. A
  // second tap within the window additionally likes; toggling play/pause
  // twice in quick succession nets out to no visible change, same as
  // TikTok/Instagram's own double-tap behavior.
  function handleVideoClick(e: React.MouseEvent<HTMLVideoElement>) {
    const now = Date.now();
    const { clientX, clientY } = e;
    handleTap();
    if (now - lastTapAtRef.current < 300) {
      lastTapAtRef.current = 0;
      spawnHeartBurst(clientX, clientY);
      handleLike();
    } else {
      lastTapAtRef.current = now;
    }
  }

  function handleLike() {
    if (!requireAuth()) return;
    if (liked) return; // one-time reward — already claimed, nothing more to toggle
    setOptimisticLiked(true); // instant visual feedback, reconciled from the server response below
    awardLike(ad.id)
      .then((result) => {
        if (result.awarded) {
          logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "like" });
          if (result.points) flashReward(`+${result.points} SWYP`);
        } else if (result.reason !== "already_awarded") {
          setOptimisticLiked(false); // genuine failure — revert the optimistic fill
        }
      })
      .catch(() => setOptimisticLiked(false));
  }

  function handleSave() {
    if (!requireAuth()) return;
    const wasSaved = saved;
    toggleSave(product.id, ad.id).then((result) => {
      if (result?.awarded) {
        if (!wasSaved) {
          logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "save" });
        }
        if (result.points) flashReward(`+${result.points} SWYP`);
      }
    });
  }

  function handleClickThrough() {
    logInteraction({ deviceId: getDeviceId(), businessId: company.id, adId: ad.id, productId: product.id, eventName: "click" });
    posthog.capture("ad_clicked", { adId: ad.id, productId: product.id });
  }

  async function handleShare() {
    const result = await shareLink(
      `${window.location.origin}/app/product/${product.id}`,
      `Bekijk ${product.name} op Swyp`
    );
    if (result === "copied") flashToast("Link gekopieerd naar klembord");
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
          src={needsHlsJs ? undefined : ad.videoUrl}
          poster={ad.posterUrl}
          muted
          loop
          playsInline
          preload={isActive || isNear ? "auto" : "none"}
          onTimeUpdate={handleTimeUpdate}
          onClick={handleVideoClick}
          className="h-full w-full object-cover"
        />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

      <AnimatePresence>
        {isActive && buffering && !needsTapToPlay && (
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

      {/* Not auto-hiding, unlike showPauseIcon below — this only appears once
          autoplay has been silently blocked for a while (typically iOS Low
          Power Mode), so it needs to stay put until the user actually taps it. */}
      <AnimatePresence>
        {isActive && needsTapToPlay && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleTap}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            aria-label="Video afspelen"
          >
            <div className="rounded-full bg-black/50 p-5">
              <Play size={32} fill="white" />
            </div>
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium">Tik om af te spelen</span>
          </motion.button>
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

      {hearts.map((h) => (
        <div key={h.id} className="pointer-events-none absolute z-20" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 0, rotate: h.rotate }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.3, 1, 0.9], y: -30 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="-translate-x-1/2 -translate-y-1/2"
          >
            <Heart size={64} className="fill-magenta text-magenta drop-shadow-lg" />
          </motion.div>
        </div>
      ))}

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
          onClick={handleShare}
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
        <button
          onClick={() => (requireAuth() ? setSafetySheetOpen(true) : undefined)}
          className="flex flex-col items-center gap-1"
          aria-label="Meer opties"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
            <MoreVertical size={21} className="text-white" />
          </span>
        </button>
      </div>

      <ReportBlockSheet
        open={safetySheetOpen}
        onClose={() => setSafetySheetOpen(false)}
        companyName={company.name}
        onReport={handleReport}
        onBlock={handleBlock}
      />

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
