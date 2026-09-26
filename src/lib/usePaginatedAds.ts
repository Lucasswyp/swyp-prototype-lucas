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
    const { ads: page, hasMore: more } = await fetchAdsPage(0);
    setAds(page);
    countRef.current = page.length;
    setHasMore(more);
    setLoading(false);
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
      setAds((prev) => [...prev, ...page]);
      countRef.current += page.length;
      setHasMore(more);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [hasMore]);

  return { ads, loading, hasMore, loadMore, refresh: loadFirstPage };
}
