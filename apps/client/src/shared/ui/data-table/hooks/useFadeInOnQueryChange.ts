import { type RefObject, useEffect, useRef } from 'react';

const FADE_IN = 'motion-safe:animate-fade-in';

/**
 * fades the rows in once a new search, filter or sort has brought them, not after a refetch or a next page.
 * The animation restarts on the same element: remounting the rows would lose the keyboard focus
 */
export function useFadeInOnQueryChange(
  rowGroup: RefObject<HTMLElement | null>,
  query: string,
  rows: unknown,
) {
  const shownQuery = useRef(query);
  const awaitedQuery = useRef<string | null>(null);

  useEffect(() => {
    awaitedQuery.current = query === shownQuery.current ? null : query;
  }, [query]);

  useEffect(() => {
    const element = rowGroup.current;
    if (awaitedQuery.current === null || !element) return;

    shownQuery.current = awaitedQuery.current;
    awaitedQuery.current = null;
    element.classList.remove(FADE_IN);
    // reading the layout between both makes the browser restart the animation
    void element.offsetWidth;
    element.classList.add(FADE_IN);
  }, [rowGroup, rows]);
}
