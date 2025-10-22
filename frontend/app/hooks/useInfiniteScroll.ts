import { useEffect } from "react";

interface UseInfiniteScrollProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  offset?: number;
}

export function useInfiniteScroll({
  loading,
  hasMore,
  onLoadMore,
  offset = 400,
}: UseInfiniteScrollProps) {
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking || loading || !hasMore) return;

      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - offset;

      if (nearBottom) {
        ticking = true;
        onLoadMore();
        setTimeout(() => (ticking = false), 200);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, onLoadMore, offset]);
}
