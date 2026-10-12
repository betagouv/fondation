import { useLayoutEffect, useRef } from 'react';

function foldableRows(bar: HTMLElement) {
  return [...bar.querySelectorAll<HTMLElement>('[data-collapse-natural]')];
}

/** clipping alone leaves a box that a click or a tab stop still lands in */
function reach(row: HTMLElement, reachable: boolean) {
  row.inert = !reachable;
  row.style.visibility = reachable ? '' : 'hidden';
}

/** the rows fold by the very pixels that scrolled past, so the content stays glued under the bar */
export function useFoldWithScroll(props: {
  bar: HTMLElement | null;
  isPinned: boolean;
  pathname: string;
  region: HTMLElement | null;
  restHeight: number;
}) {
  const { bar, isPinned, pathname, region, restHeight } = props;
  const pinnedAt = useRef(0);
  const foldable = useRef(0);

  useLayoutEffect(() => {
    if (!region) return;

    const publish = (fold: number, height: number) => {
      region.style.setProperty('--fondation-collapse', `${fold}`);
      region.style.setProperty('--fondation-pinned-bar-height', `${height}px`);
    };

    if (!isPinned || !bar) {
      if (bar) foldableRows(bar).forEach((row) => reach(row, true));
      publish(0, restHeight);
      return;
    }

    pinnedAt.current = window.scrollY;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const rows = foldableRows(bar);
      const measured = rows.reduce((total, row) => total + Number(row.dataset.collapseNatural), 0);
      /** a row remounting through its portal measures zero for a frame, which would unfold the whole bar */
      if (measured > 0) foldable.current = measured;

      const scrolled = window.scrollY - pinnedAt.current;
      const fold = foldable.current > 0 ? Math.min(1, Math.max(0, scrolled / foldable.current)) : 0;

      publish(fold, bar.offsetHeight);
      rows.forEach((row) => reach(row, fold < 1));
    };

    apply();
    const schedule = () => (frame ||= requestAnimationFrame(apply));
    window.addEventListener('scroll', schedule, { passive: true });

    const reshapedWithoutScrolling = new ResizeObserver(schedule);
    reshapedWithoutScrolling.observe(bar);

    return () => {
      window.removeEventListener('scroll', schedule);
      reshapedWithoutScrolling.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [bar, isPinned, region, restHeight]);

  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (!isPinned || !bar) return;

    /** the frame waits for the mounted content to scroll first: a virtualized table restores its offset */
    const frame = requestAnimationFrame(() =>
      window.scrollTo({ behavior: 'instant', top: pinnedAt.current + foldable.current }),
    );

    return () => cancelAnimationFrame(frame);
  }, [bar, isPinned, pathname]);
}
