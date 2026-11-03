"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { isUsableImageUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";

// Een plaatje dat nooit kapot oogt: is de link leeg, een videobestand of laadt hij niet, dan staat
// er een rustige placeholder.
export function SafeImage({ src, alt = "", className }: { src?: string | null; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!isUsableImageUrl(src) || failed) {
    return (
      <div role="img" aria-label={alt} className={cn("flex items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.02] text-white/25", className)}>
        <Package size={22} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} loading="lazy" />;
}
