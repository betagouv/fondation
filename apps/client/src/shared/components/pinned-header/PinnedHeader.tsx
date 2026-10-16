import clsx from 'clsx';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation } from 'react-router';

import { PINNED_GAP, useFoldWithScroll, usePinnedBar } from '@/shared/hooks/usePinnedBar';

/**
 * pins a screen's bar under the banner once the page scrolls past it: the content keeps the room the bar
 * leaves, and a table scrolling with the page sticks its header under the bar through
 * `--fondation-table-header-top`. Rows marked `data-collapse-natural` in the bar fold with the scroll
 */
export function PinnedHeader(props: {
  bar: ReactNode | ((isPinned: boolean) => ReactNode);
  /** the padding the bar keeps in and out of its pinned state */
  barClassName?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** the strip between the bar and the content, under which a sticky table header slides */
  gapClassName?: string;
  /** what the bar only needs once pinned, such as a padding under the banner */
  pinnedBarClassName?: string;
}) {
  const { pathname } = useLocation();
  const [pinnedBar, setPinnedBar] = useState<HTMLDivElement | null>(null);
  const [region, setRegion] = useState<HTMLDivElement | null>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const { isPinned, restHeight } = usePinnedBar(sentinel, pinnedBar);
  useFoldWithScroll({ bar: pinnedBar, isPinned, pathname, region, restHeight });

  return (
    <div
      className={clsx('flex flex-col [overflow-anchor:none]', props.className)}
      ref={setRegion}
      style={
        {
          '--fondation-pinned-gap': `${PINNED_GAP}px`,
          '--fondation-table-header-top':
            'calc(var(--fondation-banner-height) + var(--fondation-pinned-bar-height) + var(--fondation-pinned-gap))',
        } as CSSProperties
      }
    >
      {/* watched to know when the bar leaves the top: it must take no room of its own */}
      <div className="h-0" ref={setSentinel} />
      <div
        className={clsx(
          props.barClassName,
          isPinned && [
            'fixed top-(--fondation-banner-height) right-(--fondation-scroll-lock-gutter) left-0 z-5 bg-(--background-default-grey)',
            props.pinnedBarClassName,
          ],
        )}
        ref={setPinnedBar}
      >
        {typeof props.bar === 'function' ? props.bar(isPinned) : props.bar}
      </div>
      {isPinned && <div style={{ height: restHeight }} />}
      <div
        className={clsx(
          'sticky top-[calc(var(--fondation-banner-height)+var(--fondation-pinned-bar-height))] z-4 h-(--fondation-pinned-gap) bg-(--background-default-grey)',
          props.gapClassName,
        )}
      />

      <div className={props.contentClassName}>{props.children}</div>
    </div>
  );
}
