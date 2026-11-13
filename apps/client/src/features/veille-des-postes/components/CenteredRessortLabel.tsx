import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * the ressort of a group of courts, centred on the height of the group as drawn: each row of the group holds
 * the label at the same place and clips it to its own cell, so the rows show it whole between them
 */
export function CenteredRessortLabel(props: { groupId: string; label: string }) {
  const clipRef = useRef<HTMLSpanElement>(null);
  const [top, setTop] = useState<number | null>(null);

  const place = useCallback(() => {
    const clip = clipRef.current;
    const rowGroup = clip?.closest('[role="rowgroup"]');
    if (!clip || !rowGroup) return;

    const cells = [...rowGroup.querySelectorAll(`[data-ressort-group="${CSS.escape(props.groupId)}"]`)];
    const tops = cells.map((cell) => cell.getBoundingClientRect().top);
    const bottoms = cells.map((cell) => cell.getBoundingClientRect().bottom);
    const center = (Math.min(...tops) + Math.max(...bottoms)) / 2 - clip.getBoundingClientRect().top;
    setTop((previous) => (previous === center ? previous : center));
  }, [props.groupId]);

  // on every render, as the rows of the group drawn change while scrolling
  useLayoutEffect(place);

  useLayoutEffect(() => {
    const rowGroup = clipRef.current?.closest('[role="rowgroup"]');
    if (!rowGroup) return;

    const observer = new ResizeObserver(place);
    observer.observe(rowGroup);
    return () => observer.disconnect();
  }, [place]);

  return (
    <>
      <span className="fr-sr-only">{props.label}</span>
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 -bottom-px z-1 overflow-hidden"
        data-ressort-group={props.groupId}
        ref={clipRef}
      >
        {top !== null && (
          <span className="absolute inset-x-4 -translate-y-1/2 font-medium" style={{ top }}>
            {props.label}
          </span>
        )}
      </span>
    </>
  );
}
