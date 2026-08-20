import { useVirtualizer } from '@tanstack/react-virtual';

export const ESTIMATED_ROW_HEIGHT = 48;

export function useTableVirtualizer(props: { rowCount: number; scrollBox: HTMLDivElement | null }) {
  return useVirtualizer({
    count: props.rowCount,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    getScrollElement: () => props.scrollBox,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 10,
  });
}
