import { useLayoutEffect, useRef } from 'react';

export const PINNED_GAP = 16;

/** the frame waits for the mounted content to scroll first: a virtualized table restores its offset */
export function useScrollUnderPinnedBar(props: {
  bar: HTMLElement | null;
  content: HTMLElement | null;
  isPinned: boolean;
  pathname: string;
}) {
  const { bar, content, isPinned, pathname } = props;
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (!isPinned || !content || !bar) return;

    const frame = requestAnimationFrame(() => {
      const contentTop = window.scrollY + content.getBoundingClientRect().top;
      const barBottom = bar.getBoundingClientRect().bottom;
      window.scrollTo({ behavior: 'instant', top: contentTop - barBottom - PINNED_GAP });
    });

    return () => cancelAnimationFrame(frame);
  }, [bar, content, isPinned, pathname]);
}
