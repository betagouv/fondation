import { useEffect, type RefObject } from 'react';

/** Keeps the row last pointed at or focused where it stands on screen while the rows above it change height */
export function useRowAnchor(props: {
  rowGroupRef: RefObject<HTMLElement | null>;
  scrollBox: HTMLElement | null;
  scrollsWithPage?: boolean;
}) {
  const { rowGroupRef, scrollBox, scrollsWithPage } = props;

  useEffect(() => {
    const rowGroup = rowGroupRef.current;
    const scroller = scrollsWithPage ? window : scrollBox;
    if (!rowGroup || !scroller) return;

    let anchor: { row: HTMLElement; top: number } | null = null;
    let isHoldingInPlace = false;

    const anchorOn = (event: Event) => {
      const row = event.target instanceof Element ? event.target.closest<HTMLElement>('[role="row"]') : null;
      // the focus given back on closing a side panel lands once the rows have already reflowed
      if (row?.parentElement !== rowGroup || anchor?.row === row) return;

      anchor = { row, top: row.getBoundingClientRect().top };
    };

    const follow = () => {
      // the scroll rounds the shift to whole pixels: taking it in would drift the row a little at each reflow
      if (!isHoldingInPlace && anchor?.row.isConnected) anchor.top = anchor.row.getBoundingClientRect().top;
    };

    const holdInPlace = () => {
      if (!anchor?.row.isConnected) return;

      const shift = anchor.row.getBoundingClientRect().top - anchor.top;
      if (Math.abs(shift) < 1) return;

      isHoldingInPlace = true;
      scroller.scrollBy({ behavior: 'instant', top: shift });
      // the scroll events of a frame run before its animation callbacks
      requestAnimationFrame(() => (isHoldingInPlace = false));
    };

    rowGroup.addEventListener('pointerdown', anchorOn);
    rowGroup.addEventListener('focusin', anchorOn);
    scroller.addEventListener('scroll', follow, { passive: true });
    const reflow = new ResizeObserver(holdInPlace);
    reflow.observe(rowGroup);

    return () => {
      rowGroup.removeEventListener('pointerdown', anchorOn);
      rowGroup.removeEventListener('focusin', anchorOn);
      scroller.removeEventListener('scroll', follow);
      reflow.disconnect();
    };
  }, [rowGroupRef, scrollBox, scrollsWithPage]);
}
