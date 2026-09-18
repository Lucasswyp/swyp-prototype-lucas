"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MobileFrame } from "@/components/consumer/MobileFrame";
import { BottomNav } from "@/components/consumer/BottomNav";
import { useAppStore, useHasHydrated } from "@/store/useAppStore";
import { DataProvider } from "@/contexts/DataContext";
import { ConsumerAuthProvider } from "@/contexts/ConsumerAuthContext";
import { LoginPromptModal } from "@/components/consumer/LoginPromptModal";

const NO_NAV_ROUTES = ["/app/onboarding", "/app/interests"];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!onboardingComplete && !NO_NAV_ROUTES.includes(pathname)) {
      router.replace("/app/onboarding");
    }
  }, [hasHydrated, onboardingComplete, pathname, router]);

  const showNav = !NO_NAV_ROUTES.includes(pathname);

  return (
    <DataProvider>
      <ConsumerAuthProvider>
        <MobileFrame>
          <div className="relative h-full w-full overflow-y-auto no-scrollbar">
            {children}
          </div>
          {showNav && <BottomNav />}
        </MobileFrame>
        <LoginPromptModal />
      </ConsumerAuthProvider>
    </DataProvider>
  );
}
