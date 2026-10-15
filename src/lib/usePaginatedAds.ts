import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdsPage } from "@/lib/data";
import type { Ad } from "@/types";

// Backs each feed page's own infinite scroll — see fetchAdsPage's comment
// for why this exists instead of useData().ads (that one still loads
// everything, unpaginated, because business dashboards need to see their
// own ads regardless of moderation status; this is consumer-feed-only).
export function usePaginatedAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  const countRef = useRef(0);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const { ads: page, hasMore: more } = await fetchAdsPage(0);
      setAds(page);
      countRef.current = page.length;
      setHasMore(more);
    } catch {
      // Keep whatever was already on screen; an empty first load just shows
      // the normal empty state instead of a spinner that never ends.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount — an external load, not a value derived from
    // this render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    try {
      const { ads: page, hasMore: more } = await fetchAdsPage(countRef.current);
      // A new ad published while someone scrolls shifts every offset by one,
      // so the next page can repeat an ad already shown. Drop repeats by id.
      setAds((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...page.filter((a) => !seen.has(a.id))];
      });
      countRef.current += page.length;
      setHasMore(more);
    } catch {
      // Try again on the next scroll near the end.
    } finally {
      loadingMoreRef.current = false;
    }
  }, [hasMore]);

  return { ads, loading, hasMore, loadMore, refresh: loadFirstPage };
}
