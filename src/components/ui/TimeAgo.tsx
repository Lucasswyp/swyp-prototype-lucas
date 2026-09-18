"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";

export function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    // Intentionally client-only: rendering this on the server would embed a
    // "time ago" string that immediately goes stale and mismatches on hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(timeAgo(iso));
    const interval = window.setInterval(() => setLabel(timeAgo(iso)), 30000);
    return () => window.clearInterval(interval);
  }, [iso]);

  return <>{label ?? " "}</>;
}
