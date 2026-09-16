import { useEffect, useLayoutEffect, useState } from 'react';

/** the permanent banners are fixed over the page, so the bar has to pin at their bottom edge, not at the viewport's */
function useBannerHeight(element: HTMLElement | null) {
  const [bannerHeight, setBannerHeight] = useState(0);

  useLayoutEffect(() => {
    if (!element) return;

    const measure = () =>
      setBannerHeight(
        parseFloat(getComputedStyle(element).getPropertyValue('--fondation-banner-height')) || 0,
      );

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [element]);

  return bannerHeight;
}

/**
 * A bar that leaves the flow once pinned, so its own height changes move nothing under the pointer.
 *
 * `height` places what follows right under the bar, `restHeight` fills the room it leaves behind: the page
 * keeps its length, the scroll is never caught up, and the pinned state cannot flip back on its own.
 */
export function usePinnedBar(sentinel: HTMLElement | null, bar: HTMLElement | null) {
  const [isPinned, setPinned] = useState(false);
  const [heights, setHeights] = useState({ height: 0, restHeight: 0 });
  const bannerHeight = useBannerHeight(sentinel);

  useEffect(() => {
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => setPinned(!entry.isIntersecting), {
      rootMargin: `-${bannerHeight}px 0px 0px 0px`,
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [bannerHeight, sentinel]);

  useLayoutEffect(() => {
    if (!bar) return;

    const measure = () =>
      setHeights((current) => {
        const height = bar.offsetHeight;
        const restHeight = isPinned ? current.restHeight : height;

        return current.height === height && current.restHeight === restHeight
          ? current
          : { height, restHeight };
      });

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);

    return () => observer.disconnect();
  }, [bar, isPinned]);

  return { isPinned, ...heights };
}
