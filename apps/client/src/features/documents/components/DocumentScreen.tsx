import clsx from 'clsx';
import { useCallback, useState, type CSSProperties, type ReactNode } from 'react';

export function DocumentScreen(props: {
  actions?: ReactNode;
  backLink?: ReactNode;
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
      {/* the breadcrumb and the bar stay on white whatever the tone: only the document sits on the grey */}
      {props.breadcrumb && (
        <div className="fr-pt-8v bg-(--background-default-grey)">
          <div className="fr-container [&_.fr-breadcrumb]:mb-0">{props.breadcrumb}</div>
        </div>
      )}
      <div
        className="sticky top-(--fondation-banner-height) z-20 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey) bg-(--background-default-grey)"
        ref={measureBar}
      >
        <div className="fr-pt-9v fr-pb-9v fr-container flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            {props.backLink && <div className="self-start">{props.backLink}</div>}
            <h1 className="fr-h3 fr-mb-0">{props.title}</h1>
          </div>
          {props.actions && <div className="flex flex-wrap items-center gap-2">{props.actions}</div>}
        </div>
        <div className="flex w-full flex-col *:empty:hidden">{props.notices}</div>
      </div>
      <div className="fr-container fr-mt-6v fr-pb-6v mx-auto flex w-full max-w-7xl flex-1 items-start gap-6">
        {props.children}
      </div>
    </div>
  );
}
