import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';

export const ESTIMATED_ROW_HEIGHT = 48;

/** Firefox rounds the measured height and the rows end up drifting */
const measureElement =
  typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
    ? (element: Element) => element?.getBoundingClientRect().height
    : undefined;

const keepsThePageWhereItIs = () => false;

export function useTableVirtualizer(props: {
  rowCount: number;
  scrollBox: HTMLDivElement | null;
  scrollMargin?: number;
  scrollsWithPage?: boolean;
}) {
  const inBox = useVirtualizer({
    count: props.rowCount,
    enabled: !props.scrollsWithPage,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    getScrollElement: () => props.scrollBox,
    measureElement,
    overscan: 10,
  });

  const withPage = useWindowVirtualizer({
    count: props.rowCount,
    enabled: Boolean(props.scrollsWithPage),
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    measureElement,
    overscan: 10,
    scrollMargin: props.scrollMargin ?? 0,
  });
  withPage.shouldAdjustScrollPositionOnItemSizeChange = keepsThePageWhereItIs;

  return props.scrollsWithPage ? withPage : inBox;
}
