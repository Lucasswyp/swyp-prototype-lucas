"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Bookmark, Share2, Info, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeedButtonStyle } from "@/lib/feedButtonStyle";

interface Props {
  liked: boolean;
  saved: boolean;
  productHref: string;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onInfo: () => void;
  onMore: () => void;
}

// De knoppen rechts in de feed, in twee ontwerpen (zie lib/feedButtonStyle.ts).
export function FeedActionRail({ liked, saved, productHref, onLike, onSave, onShare, onInfo, onMore }: Props) {
  const [style] = useFeedButtonStyle();

  if (style === "b") {
    // Ontwerp B: één glazen kapsel, grotere iconen, met een klein label eronder.
    const item = "flex w-12 flex-col items-center gap-0.5 rounded-2xl py-1.5 active:bg-white/10";
    const label = "text-[10px] font-semibold leading-none text-white/85";
    return (
      <div className="absolute right-2.5 bottom-[calc(env(safe-area-inset-bottom)+11rem)] z-10 flex flex-col items-center gap-0.5 rounded-[1.75rem] border border-white/15 bg-black/30 px-1 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <button onClick={onLike} className={item} aria-pressed={liked} aria-label="Like">
          <motion.span whileTap={{ scale: 1.25 }} className="flex h-9 items-center">
            <Heart size={28} strokeWidth={2.2} className={cn("drop-shadow", liked ? "fill-magenta text-magenta" : "text-white")} />
          </motion.span>
          <span className={label}>{liked ? "Geliket" : "Like"}</span>
        </button>
        <button onClick={onSave} className={item} aria-pressed={saved} aria-label="Opslaan">
          <motion.span whileTap={{ scale: 1.25 }} className="flex h-9 items-center">
            <Bookmark size={27} strokeWidth={2.2} className={cn("drop-shadow", saved ? "fill-white text-white" : "text-white")} />
          </motion.span>
          <span className={label}>{saved ? "Bewaard" : "Bewaar"}</span>
        </button>
        <button onClick={onShare} className={item} aria-label="Delen">
          <span className="flex h-9 items-center">
            <Share2 size={26} strokeWidth={2.2} className="text-white drop-shadow" />
          </span>
          <span className={label}>Deel</span>
        </button>
        <span className="my-1 h-px w-7 bg-white/15" aria-hidden />
        <Link href={productHref} onClick={onInfo} className={item} aria-label="Meer info">
          <span className="flex h-8 items-center">
            <Info size={23} strokeWidth={2.2} className="text-white drop-shadow" />
          </span>
          <span className={label}>Info</span>
        </Link>
        <button onClick={onMore} className={item} aria-label="Meer opties">
          <span className="flex h-8 items-center">
            <MoreVertical size={23} strokeWidth={2.2} className="text-white drop-shadow" />
          </span>
          <span className={label}>Meer</span>
        </button>
      </div>
    );
  }

  // Ontwerp A: losse ronde knoppen (zoals het was).
  return (
    <div className="absolute right-3 bottom-[calc(env(safe-area-inset-bottom)+12.5rem)] flex flex-col items-center gap-5 z-10">
      <button onClick={onLike} className="flex flex-col items-center gap-1" aria-pressed={liked} aria-label="Like">
        <motion.span whileTap={{ scale: 1.3 }} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
          <Heart size={24} className={liked ? "fill-magenta text-magenta" : "text-white"} />
        </motion.span>
      </button>
      <button onClick={onSave} className="flex flex-col items-center gap-1" aria-pressed={saved} aria-label="Opslaan">
        <motion.span whileTap={{ scale: 1.3 }} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
          <Bookmark size={22} className={saved ? "fill-white text-white" : "text-white"} />
        </motion.span>
      </button>
      <button onClick={onShare} className="flex flex-col items-center gap-1" aria-label="Delen">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
          <Share2 size={21} className="text-white" />
        </span>
      </button>
      <Link href={productHref} onClick={onInfo} className="flex flex-col items-center gap-1" aria-label="Meer info">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
          <Info size={21} className="text-white" />
        </span>
      </Link>
      <button onClick={onMore} className="flex flex-col items-center gap-1" aria-label="Meer opties">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
          <MoreVertical size={21} className="text-white" />
        </span>
      </button>
    </div>
  );
}
