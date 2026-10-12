import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** gives back its share of the fold the pinned bar publishes, in `--fondation-collapse` */
export function Collapse(props: { children: ReactNode; collapsible?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const collapsible = props.collapsible ?? true;

  useLayoutEffect(() => {
    const folded = box.current;
    const measured = content.current;
    if (!folded || !measured) return;

    if (!collapsible) {
      delete folded.dataset.collapseNatural;
      folded.style.removeProperty('--fondation-collapse-natural');
      folded.style.removeProperty('visibility');
      folded.inert = false;
      return;
    }

    const measure = () => {
      const natural = measured.offsetHeight;
      folded.style.setProperty('--fondation-collapse-natural', `${natural}px`);
      folded.dataset.collapseNatural = String(natural);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(measured);

    return () => observer.disconnect();
  }, [collapsible]);

  return (
    <div
      className={
        collapsible
          ? 'h-[calc(var(--fondation-collapse-natural)*(1-var(--fondation-collapse,0)))] overflow-hidden opacity-[calc(1-var(--fondation-collapse,0))]'
          : undefined
      }
      ref={box}
    >
      <div ref={content}>{props.children}</div>
    </div>
  );
}
