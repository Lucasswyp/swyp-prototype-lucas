import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function CompanyAvatar({
  src,
  name,
  verified,
  size = 40,
  className,
}: {
  src: string;
  name: string;
  verified?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={name}
        fill
        sizes={`${size}px`}
        className="rounded-full object-cover border border-white/15"
      />
      {verified && (
        <BadgeCheck
          size={Math.max(14, size * 0.4)}
          className="absolute -bottom-0.5 -right-0.5 text-violet fill-white"
        />
      )}
    </div>
  );
}
