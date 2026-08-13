import clsx from 'clsx';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

const ARROW_GAP = 10;
const SAFE_MARGIN = 16;

let openedTooltip: (() => void) | null = null;

export function Tooltip(props: { children: ReactNode; className?: string; label: ReactNode }) {
  const bubbleId = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isShown, setIsShown] = useState(false);
  const [arrowX, setArrowX] = useState(0);
  const [isUnder, setIsUnder] = useState(false);

  const hide = useCallback(() => {
    bubbleRef.current?.hidePopover?.();
    if (openedTooltip === hide) openedTooltip = null;
    setIsShown(false);
  }, []);

  const show = useCallback(() => {
    const anchor = anchorRef.current;
    const bubble = bubbleRef.current;
    if (!anchor || !bubble?.showPopover) return;

    openedTooltip?.();
    openedTooltip = hide;

    bubble.showPopover();
    const from = anchor.getBoundingClientRect();
    const { height, width } = bubble.getBoundingClientRect();

    const under = from.top - height - ARROW_GAP < SAFE_MARGIN;
    const left = Math.min(
      Math.max(from.left + from.width / 2 - width / 2, SAFE_MARGIN),
      window.innerWidth - SAFE_MARGIN - width,
    );

    bubble.style.left = `${left}px`;
    bubble.style.top = `${under ? from.bottom + ARROW_GAP : from.top - height - ARROW_GAP}px`;

    setArrowX(from.left + from.width / 2 - left);
    setIsUnder(under);
    setIsShown(true);
  }, [hide]);

  useEffect(() => {
    if (!isShown) return;

    window.addEventListener('pointerdown', hide, { capture: true });
    window.addEventListener('scroll', hide, { capture: true });
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('pointerdown', hide, { capture: true });
      window.removeEventListener('scroll', hide, { capture: true });
      window.removeEventListener('resize', hide);
    };
  }, [hide, isShown]);

  return (
    <>
      <span
        aria-describedby={bubbleId}
        className={clsx('inline-flex cursor-default', props.className)}
        onBlur={hide}
        onFocus={show}
        onKeyDown={(event) => event.key === 'Escape' && hide()}
        onPointerEnter={show}
        onPointerLeave={hide}
        ref={anchorRef}
      >
        {props.children}
      </span>

      <div
        className="fixed m-0 max-w-[min(24rem,calc((100vw-2rem)*2/3))] overflow-visible border border-(--border-default-grey) bg-(--background-overlap-grey) p-2 text-left text-xs leading-5 text-wrap text-(--text-default-grey) shadow-[var(--overlap-shadow)]"
        id={bubbleId}
        popover="manual"
        ref={bubbleRef}
        role="tooltip"
      >
        {props.label}
        <span
          aria-hidden
          className={clsx(
            'absolute size-2 rotate-45 border-(--border-default-grey) bg-(--background-overlap-grey)',
            isUnder ? '-top-1 border-t border-l' : '-bottom-1 border-r border-b',
          )}
          style={{ left: arrowX - 4 }}
        />
      </div>
    </>
  );
}
