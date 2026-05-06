import React from 'react';

export function useScrollDownIndicator(props: { root: React.RefObject<HTMLElement | null> }) {
  const [hasMore, setHasMore] = React.useState(true);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!sentinelRef.current || !props.root.current) return;

    const observer = new IntersectionObserver(([entry]) => setHasMore(!entry.isIntersecting), {
      root: props.root.current,
    });

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [props]);

  return { ref: sentinelRef, hasMore };
}
