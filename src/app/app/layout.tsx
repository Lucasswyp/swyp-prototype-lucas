"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { MobileFrame } from "@/components/consumer/MobileFrame";
import { BottomNav } from "@/components/consumer/BottomNav";
import { SwypSplash } from "@/components/consumer/SwypSplash";
import { DataProvider, useData } from "@/contexts/DataContext";
import { ConsumerAuthProvider, useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { LoginPromptModal } from "@/components/consumer/LoginPromptModal";
import { ReferralAwardToast } from "@/components/consumer/ReferralAwardToast";

// /app/interests is still reachable from the profile menu for people who
// want to tune what they see, but it's opt-in — nobody is forced through an
// intro flow before reaching the feed anymore. /app/complete-profile is the
// one exception: Google sign-ins skip choosing a username/photo, so that
// step is mandatory once, right after login (see ProfileGate below).
const NO_NAV_ROUTES = ["/app/interests", "/app/complete-profile"];

function ProfileGate() {
  const { loading, profileIncomplete } = useConsumerAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profileIncomplete && pathname !== "/app/complete-profile") {
      router.replace("/app/complete-profile");
    }
  }, [loading, profileIncomplete, pathname, router]);

  return null;
}

function AppShell({ children, showNav }: { children: ReactNode; showNav: boolean }) {
  const { loading } = useData();

  return (
    <ConsumerAuthProvider>
      <WalletProvider>
        <ProfileGate />
        <MobileFrame>
          <div className="relative h-full w-full overflow-y-auto no-scrollbar">
            {children}
          </div>
          {showNav && <BottomNav />}
          <AnimatePresence>{loading && <SwypSplash />}</AnimatePresence>
          <ReferralAwardToast />
        </MobileFrame>
        <LoginPromptModal />
      </WalletProvider>
    </ConsumerAuthProvider>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = !NO_NAV_ROUTES.includes(pathname);

  return (
    <DataProvider>
      <AppShell showNav={showNav}>{children}</AppShell>
    </DataProvider>
  );
}
