import Link from "next/link";
import Image from "next/image";
import { Bookmark } from "lucide-react";
import { formatEuro, cn } from "@/lib/utils";
import type { Product, Company } from "@/types";

export function ProductCard({
  product,
  company,
  saved,
  onToggleSave,
  className,
}: {
  product: Product;
  company?: Company;
  saved?: boolean;
  onToggleSave?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("group relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]", className)}>
      <Link href={`/app/product/${product.id}`} className="block">
        <div className="relative aspect-[4/5] w-full">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.oldPrice && (
            <span className="absolute top-2 left-2 rounded-full bg-magenta text-white text-[11px] font-bold px-2 py-0.5">
              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
            </span>
          )}
        </div>
        <div className="p-3">
          {company && <p className="text-[11px] text-white/40 mb-0.5 truncate">{company.name}</p>}
          <p className="text-sm font-semibold leading-snug line-clamp-1 mb-1">{product.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-bold text-sm">{formatEuro(product.price)}</span>
            {product.oldPrice && (
              <span className="text-xs text-white/40 line-through">{formatEuro(product.oldPrice)}</span>
            )}
          </div>
        </div>
      </Link>
      {onToggleSave && (
        <button
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label="Opslaan"
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur"
        >
          <Bookmark size={15} className={saved ? "fill-white text-white" : "text-white"} />
        </button>
      )}
    </div>
  );
}
