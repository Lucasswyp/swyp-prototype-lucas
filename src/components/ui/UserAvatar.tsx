import { cn } from "@/lib/utils";

// Profielfoto van een gebruiker, of de beginletter als er geen foto is.
export function UserAvatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/10", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-heading font-bold text-white/70"
          style={{ fontSize: size * 0.42 }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}
