import { LogoMark } from "@/components/ui/Logo";

/** Rustig, stilstaand scherm terwijl de eerste video's laden (geen animatie). */
export function LoadingCover() {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-indigo" data-testid="loading-cover">
      <LogoMark size={56} className="opacity-90" />
    </div>
  );
}
