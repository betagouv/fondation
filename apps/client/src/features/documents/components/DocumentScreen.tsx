import clsx from 'clsx';
import { useCallback, useState, type CSSProperties, type ReactNode } from 'react';

export function DocumentScreen(props: {
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  children: ReactNode;
  notices?: ReactNode;
  title: ReactNode;
  tone?: 'default' | 'alt';
}) {
  const [barHeight, setBarHeight] = useState(0);

  const measureBar = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setBarHeight(entry.contentRect.height));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={clsx('flex min-h-svh flex-col', { 'bg-(--background-alt-grey)': props.tone === 'alt' })}
      style={{ '--document-bar-offset': `${barHeight}px` } as CSSProperties}
    >
      {props.breadcrumb && <div className="fr-container">{props.breadcrumb}</div>}
      <div ref={measureBar} className="fr-py-2v sticky top-0 z-20 bg-(--background-default-grey)">
        <div className="fr-container flex flex-wrap items-center justify-between gap-2">
          <h1 className="fr-h2 fr-mb-0">{props.title}</h1>
          {props.actions && <div className="flex flex-wrap items-center gap-2">{props.actions}</div>}
        </div>
      </div>
      <div className="fr-container mx-auto flex w-full max-w-3xl flex-col *:empty:hidden">
        {props.notices}
      </div>
      <div className="fr-container fr-mt-6v fr-pb-6v mx-auto flex w-full max-w-7xl flex-1 items-start gap-6">
        {props.children}
      </div>
    </div>
  );
}
