import { cn } from "@/lib/utils";

// Het echte Swyp-logo, uitgesneden uit de merkgids (public/brand). De bestanden
// hebben een transparante achtergrond en zijn voor een donkere achtergrond.
export const LOGO_RATIO = 992 / 364;
const ICON_RATIO = 420 / 376;

/** Alleen het icoon (S met pijl), voor kleine plekken zoals de topbalk. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- statisch merkbestand, geen optimalisatie nodig
    <img
      src="/brand/swyp-icon.png"
      alt=""
      aria-hidden="true"
      width={Math.round(size * ICON_RATIO)}
      height={size}
      draggable={false}
      className={cn("shrink-0 select-none object-contain", className)}
      style={{ height: size, width: "auto" }}
    />
  );
}

const widths = { sm: 96, md: 128, lg: 184 } as const;

/** Het volledige woordlogo "Swyp". */
export function Logo({
  size = "md",
  showWordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}) {
  const width = widths[size];
  if (!showWordmark) return <LogoMark size={Math.round(width / 3)} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- statisch merkbestand, geen optimalisatie nodig
    <img
      src="/brand/swyp-logo.png"
      alt="Swyp"
      width={width}
      height={Math.round(width / LOGO_RATIO)}
      draggable={false}
      className={cn("shrink-0 select-none", className)}
      style={{ width, height: "auto" }}
    />
  );
}
