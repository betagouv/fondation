import { useContext } from 'react';

import { FloatingActionsContext } from './FloatingActionsContext';

/**
 * The actions floating at the bottom right line up here, so they never overlap. Sticky rather than fixed, they stop
 * a little above the footer; with no height and margins that cancel out, they take no room from the page.
 */
export function FloatingActionsStack() {
  const context = useContext(FloatingActionsContext);

  return (
    <div
      className="pointer-events-none sticky bottom-6 z-(--z-index-panel) -mt-3 mb-3 flex h-0 items-end justify-end gap-2 pr-[calc(var(--fondation-side-panel-width,0px)+1.5rem)] transition-[padding-right] duration-300 ease-out motion-reduce:transition-none"
      data-side-panel-companion
      ref={context?.setStack}
    />
  );
}
