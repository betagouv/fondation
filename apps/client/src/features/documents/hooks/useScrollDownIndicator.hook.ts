import { useEffect, useRef, useState, type RefObject } from 'react';

export function useScrollDownIndicator(props: { root: RefObject<HTMLElement | null> }) {
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !props.root.current) return;

    const observer = new IntersectionObserver(([entry]) => setHasMore(!entry.isIntersecting), {
      root: props.root.current,
    });

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [props]);

  return { ref: sentinelRef, hasMore };
}
