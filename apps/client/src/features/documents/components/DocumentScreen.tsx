import clsx from 'clsx';
import { useCallback, useState, type CSSProperties, type ReactNode } from 'react';

export function DocumentScreen(props: {
  actions?: ReactNode;
  backLink?: ReactNode;
  breadcrumb?: ReactNode;
  children: ReactNode;
  notices?: ReactNode;
  subtitle?: ReactNode;
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
      {/* the breadcrumb and the bar stay on white whatever the tone: only the document sits on the grey */}
      {props.breadcrumb && (
        <div className="fr-pt-8v bg-(--background-default-grey)">
          <div className="fr-container [&_.fr-breadcrumb]:mb-7">{props.breadcrumb}</div>
        </div>
      )}
      <div className="fr-py-2v sticky top-0 z-20 bg-(--background-default-grey)" ref={measureBar}>
        <div className="fr-container flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            {props.backLink}
            <h1 className="fr-h2 fr-mb-0">{props.title}</h1>
            {props.subtitle && (
              <p className="fr-mb-0 fr-text--lead text-(--text-action-high-blue-france)">{props.subtitle}</p>
            )}
          </div>
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
