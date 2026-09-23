import { useEffect, useRef, useState, type RefObject } from "react";

const TRIGGER_DISTANCE = 60;
const MAX_PULL = 90;

/**
 * TikTok/Instagram-style pull-to-refresh: dragging down while already at the
 * very top of a scroll-snap feed reveals a spinner with resistance, and
 * releasing past TRIGGER_DISTANCE fires onRefresh. Deliberately touch-event
 * based rather than reading scrollTop deltas — iOS's native rubber-band
 * bounce at the top doesn't reliably move scrollTop in the first place, so a
 * scroll listener alone can't detect "the user is pulling past the top."
 */
export function usePullToRefresh(containerRef: RefObject<HTMLElement | null>, onRefresh: () => Promise<void> | void) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      if (el!.scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        pullingRef.current = true;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!pullingRef.current || startYRef.current === null) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0 && el!.scrollTop <= 0) {
        // Resistance curve — a full-length drag only pulls the indicator
        // partway, so it doesn't feel like it's tracking the finger 1:1.
        setPullDistance(Math.min(MAX_PULL, delta * 0.45));
        e.preventDefault();
      } else {
        pullingRef.current = false;
        setPullDistance(0);
      }
    }

    function onTouchEnd() {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      startYRef.current = null;
      setPullDistance((d) => {
        if (d >= TRIGGER_DISTANCE) {
          setRefreshing(true);
          Promise.resolve(onRefresh()).finally(() => setRefreshing(false));
        }
        return 0;
      });
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [containerRef, onRefresh]);

  return { pullDistance, refreshing, triggerDistance: TRIGGER_DISTANCE };
}
