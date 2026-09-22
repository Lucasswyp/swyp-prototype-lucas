"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { MobileFrame } from "@/components/consumer/MobileFrame";
import { BottomNav } from "@/components/consumer/BottomNav";
import { SwypSplash } from "@/components/consumer/SwypSplash";
import { DataProvider, useData } from "@/contexts/DataContext";
import { ConsumerAuthProvider } from "@/contexts/ConsumerAuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { LoginPromptModal } from "@/components/consumer/LoginPromptModal";

// /app/interests is still reachable from the profile menu for people who
// want to tune what they see, but it's opt-in — nobody is forced through an
// intro flow before reaching the feed anymore.
const NO_NAV_ROUTES = ["/app/interests"];

function AppShell({ children, showNav }: { children: ReactNode; showNav: boolean }) {
  const { loading } = useData();

  return (
    <ConsumerAuthProvider>
      <WalletProvider>
        <MobileFrame>
          <div className="relative h-full w-full overflow-y-auto no-scrollbar">
            {children}
          </div>
          {showNav && <BottomNav />}
          <AnimatePresence>{loading && <SwypSplash />}</AnimatePresence>
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
