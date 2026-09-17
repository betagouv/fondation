import { useLayoutEffect, useRef } from 'react';

export const PINNED_GAP = 16;

function lowestScrollKeepingSentinelAboveBanner(sentinel: HTMLElement, bannerHeight: number) {
  return Math.floor(window.scrollY + sentinel.getBoundingClientRect().bottom - bannerHeight) + 1;
}

/** the frame waits for the mounted content to scroll first: a virtualized table restores its offset */
export function useScrollUnderPinnedBar(props: {
  bar: HTMLElement | null;
  content: HTMLElement | null;
  isPinned: boolean;
  pathname: string;
  sentinel: HTMLElement | null;
}) {
  const { bar, content, isPinned, pathname, sentinel } = props;
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (!isPinned || !content || !bar || !sentinel) return;

    const frame = requestAnimationFrame(() => {
      const contentTop = window.scrollY + content.getBoundingClientRect().top;
      const barBottom = bar.getBoundingClientRect().bottom;
      const bannerHeight = barBottom - bar.offsetHeight;

      window.scrollTo({
        behavior: 'instant',
        top: Math.max(
          contentTop - barBottom - PINNED_GAP,
          lowestScrollKeepingSentinelAboveBanner(sentinel, bannerHeight),
        ),
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [bar, content, isPinned, pathname, sentinel]);
}
