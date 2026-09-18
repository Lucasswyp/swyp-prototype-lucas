import { ReactNode } from "react";

export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-indigo flex items-center justify-center sm:py-6">
      <div className="relative h-screen w-full sm:h-[844px] sm:max-h-[92vh] sm:w-[390px] sm:rounded-[2.5rem] sm:border sm:border-white/10 sm:shadow-[0_0_80px_rgba(123,61,255,0.15)] overflow-hidden bg-indigo">
        {children}
      </div>
    </div>
  );
}
