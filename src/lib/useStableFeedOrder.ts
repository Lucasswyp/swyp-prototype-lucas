import { useLayoutEffect, useRef, useState } from "react";
import { shuffle } from "@/lib/shuffle";

/**
 * Keeps the feed's on-screen order stable across the background 20s poll /
 * realtime refetch in DataContext — that returns a brand-new
 * array reference every time even when nothing actually changed, and
 * re-shuffling on every reference change made the feed visibly reorder
 * itself under the user's thumb (reported as "the feed keeps refreshing
 * itself while I scroll/watch"). Order is only re-shuffled when
 * `refreshKey` actually changes (pull-to-refresh)
 * or on first render; every other recompute keeps the existing order for
 * items still present and appends newly-visible items (shuffled among
 * themselves) at the end, so nothing already on screen jumps around.
 */
export function useStableFeedOrder<T>(
  items: T[],
  getId: (item: T) => string,
  groupKey: (item: T) => 0 | 1,
  refreshKey: number
): T[] {
  const [order, setOrder] = useState<string[]>([]);
  const lastRefreshKeyRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    setOrder((prevOrder) => {
      const byId = new Map(items.map((item) => [getId(item), item]));
      const forceReshuffle = lastRefreshKeyRef.current === null || lastRefreshKeyRef.current !== refreshKey;
      lastRefreshKeyRef.current = refreshKey;

      let next: string[];
      if (forceReshuffle) {
        const groupA = shuffle(items.filter((item) => groupKey(item) === 0));
        const groupB = shuffle(items.filter((item) => groupKey(item) === 1));
        next = [...groupA, ...groupB].map(getId);
      } else {
        const stillVisible = prevOrder.filter((id) => byId.has(id));
        const seenIds = new Set(stillVisible);
        const freshIds = shuffle(items.filter((item) => !seenIds.has(getId(item)))).map(getId);
        next = [...stillVisible, ...freshIds];
      }

      // Same ids in the same sequence — bail out with the previous
      // reference so the setState is a no-op and nothing re-renders.
      if (next.length === prevOrder.length && next.every((id, i) => id === prevOrder[i])) {
        return prevOrder;
      }
      return next;
    });
    // getId/groupKey are per-render closures over already-listed state
    // (interests, adWatchProgress, ...) — re-running this only when the
    // item list or an explicit refresh changes is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, refreshKey]);

  const byId = new Map(items.map((item) => [getId(item), item]));
  return order.map((id) => byId.get(id)).filter((item): item is T => item !== undefined);
}
