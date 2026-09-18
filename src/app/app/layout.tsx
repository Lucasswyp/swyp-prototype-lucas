"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileFrame } from "@/components/consumer/MobileFrame";
import { BottomNav } from "@/components/consumer/BottomNav";
import { DataProvider } from "@/contexts/DataContext";
import { ConsumerAuthProvider } from "@/contexts/ConsumerAuthContext";
import { LoginPromptModal } from "@/components/consumer/LoginPromptModal";

// /app/interests is still reachable from the profile menu for people who
// want to tune what they see, but it's opt-in — nobody is forced through an
// intro flow before reaching the feed anymore.
const NO_NAV_ROUTES = ["/app/interests"];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
