import Alert from '@codegouvfr/react-dsfr/Alert';
import clsx from 'clsx';
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { PINNED_GAP, usePinnedBar } from '@/shared/hooks/usePinnedBar';
import { useSecondBreadcrumbLinkOffset } from '@/shared/hooks/useSecondBreadcrumbLinkOffset';

import { AgendaBreadCrumb } from './AgendaBreadcrumb';

/** creating an agenda and editing it show the same form and the same table, so they pin the same way */
export function AgendaWorkScreen(props: {
  actionsRef: (node: HTMLDivElement | null) => void;
  /** only the creation flow needs one: the edition screens already leave through their cancel button */
  backLink?: ReactNode;
  children: ReactNode;
  error?: string | null;
  title: ReactNode;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  const backLinkOffset = useSecondBreadcrumbLinkOffset(headerRef);
  const [pinnedBar, setPinnedBar] = useState<HTMLDivElement | null>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const { height, isPinned, restHeight } = usePinnedBar(sentinel, pinnedBar);

  return (
    <div
      className="fr-pt-8v flex grow flex-col [overflow-anchor:none]"
      style={
        {
          '--fondation-pinned-bar-height': `${height}px`,
          '--fondation-pinned-gap': `${PINNED_GAP}px`,
        } as CSSProperties
      }
    >
      <div className="fr-container [&_.fr-breadcrumb]:mb-0" ref={headerRef}>
        <AgendaBreadCrumb />
        {props.error && <Alert as="h2" className="fr-mb-6v" closable severity="error" title={props.error} />}
      </div>

      {/* watched to know when the bar leaves the top: it must take no room of its own */}
      <div className="h-0" ref={setSentinel} />

      <div
        className={clsx('fr-pt-9v fr-pb-4v', {
          'fixed top-(--fondation-banner-height) right-(--fondation-scroll-lock-gutter) left-0 z-5 bg-(--background-default-grey)':
            isPinned,
        })}
        ref={setPinnedBar}
      >
        <div className="fr-container flex flex-wrap items-end gap-x-8 gap-y-4">
          {props.backLink && (
            <div className="min-w-fit shrink-0 self-start" style={{ width: backLinkOffset }}>
              {props.backLink}
            </div>
          )}
          <div className="flex flex-1 flex-wrap items-end justify-between gap-x-8 gap-y-4">
            {props.title}
            {/* a DSFR button group hangs 1rem below its buttons, which would push the title down */}
            <div className="flex flex-1 justify-end [&_.fr-btns-group_.fr-btn]:mb-0" ref={props.actionsRef} />
          </div>
        </div>
      </div>

      {isPinned && <div style={{ height: restHeight }} />}
      <div className="sticky top-[calc(var(--fondation-banner-height)+var(--fondation-pinned-bar-height))] z-4 h-(--fondation-pinned-gap) border-b border-(--border-default-grey) bg-(--background-default-grey)" />

      <div className="fr-container flex grow flex-col">{props.children}</div>
    </div>
  );
}
