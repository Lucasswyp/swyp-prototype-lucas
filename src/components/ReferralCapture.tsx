"use client";

import { useEffect } from "react";
import { capturePendingReferralFromUrl } from "@/lib/referral";

// Mounted once in the root layout so a shared referral link (?ref=CODE)
// is captured no matter which page it lands on, not just the signup form.
export function ReferralCapture() {
  useEffect(() => {
    capturePendingReferralFromUrl();
  }, []);

  return null;
}
