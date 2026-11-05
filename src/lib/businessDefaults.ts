// Een nieuw bedrijf krijgt bij het aanmelden een standaardplaatje, tot het zelf een eigen foto uploadt.
export const DEFAULT_BUSINESS_LOGO = "https://images.unsplash.com/photo-1611817757591-c3f345024273?w=200&q=80&auto=format&fit=crop";
export const DEFAULT_BUSINESS_BANNER = "https://images.unsplash.com/photo-1611817757591-c3f345024273?w=1200&q=80&auto=format&fit=crop";

/** Heeft het bedrijf zelf een logo gekozen, en niet het standaardplaatje? */
export function hasOwnLogo(logoUrl: string | null | undefined): boolean {
  return !!logoUrl && logoUrl !== DEFAULT_BUSINESS_LOGO && !logoUrl.includes("photo-1611817757591-c3f345024273");
}
