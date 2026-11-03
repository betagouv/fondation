import { useCallback, useContext, useEffect, useState } from 'react';

import { FloatingActionsContext } from './FloatingActionsContext';

const TOAST_OFFSET = '--fondation-toast-offset';

/**
 * The actions floating at the bottom right line up here, so they never overlap. Sticky rather than fixed, they stop
 * a little above the footer; with no height and margins that cancel out, they take no room from the page.
 */
export function FloatingActionsStack() {
  const context = useContext(FloatingActionsContext);
  const [stack, setStack] = useState<HTMLDivElement | null>(null);
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      context?.setStack(element);
      setStack(element);
    },
    [context],
  );

  // the toasts show above the actions, which move as the page scrolls down to the footer
  useEffect(() => {
    if (!stack) return;

    const root = document.documentElement;
    const placeToasts = () => {
      const tops = [...stack.children].map((action) => action.getBoundingClientRect().top);
      if (tops.length === 0) root.style.removeProperty(TOAST_OFFSET);
      else root.style.setProperty(TOAST_OFFSET, `${window.innerHeight - Math.min(...tops)}px`);
    };

    placeToasts();
    const actions = new MutationObserver(placeToasts);
    actions.observe(stack, { childList: true });
    window.addEventListener('resize', placeToasts);
    window.addEventListener('scroll', placeToasts, { passive: true });

    return () => {
      actions.disconnect();
      window.removeEventListener('resize', placeToasts);
      window.removeEventListener('scroll', placeToasts);
      root.style.removeProperty(TOAST_OFFSET);
    };
  }, [stack]);

  return (
    <div
      className="pointer-events-none sticky bottom-6 z-(--z-index-panel) -mt-3 mb-3 flex h-0 items-end justify-end gap-2 pr-[calc(var(--fondation-side-panel-width,0px)+1.5rem)] transition-[padding-right] duration-300 ease-out motion-reduce:transition-none"
      data-side-panel-companion
      ref={ref}
    />
  );
}
