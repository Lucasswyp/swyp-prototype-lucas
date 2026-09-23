"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SwypToken } from "@/components/ui/SwypToken";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";

// Fires once, right after a referred sign-up's first login (see
// ConsumerAuthContext + src/lib/referral.ts) — the one moment worth
// celebrating loudly, since it's the payoff for the friend who shared Swyp.
export function ReferralAwardToast() {
  const { referralAward, dismissReferralAward } = useConsumerAuth();

  useEffect(() => {
    if (referralAward === null) return;
    const timeout = window.setTimeout(dismissReferralAward, 3200);
    return () => window.clearTimeout(timeout);
  }, [referralAward, dismissReferralAward]);

  return (
    <AnimatePresence>
      {referralAward !== null && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+3.25rem)] left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet to-magenta px-4 py-2.5 text-sm font-bold shadow-lg whitespace-nowrap"
        >
          <SwypToken size={16} /> +{referralAward} SWYP — welkom via een vriend! 🎉
        </motion.div>
      )}
    </AnimatePresence>
  );
}
