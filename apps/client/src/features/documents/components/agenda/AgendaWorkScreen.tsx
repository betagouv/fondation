import Alert from '@codegouvfr/react-dsfr/Alert';
import { useRef, type ReactNode } from 'react';

import { PinnedHeader } from '@/shared/components/pinned-header';
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

  return (
    <div className="fr-pt-8v flex grow flex-col">
      <div className="fr-container [&_.fr-breadcrumb]:mb-0" ref={headerRef}>
        <AgendaBreadCrumb />
        {props.error && <Alert as="h2" className="fr-mb-6v" closable severity="error" title={props.error} />}
      </div>

      <PinnedHeader
        bar={
          <div className="fr-container flex flex-wrap items-end gap-x-8 gap-y-4">
            {props.backLink && (
              <div className="min-w-fit shrink-0 self-start" style={{ width: backLinkOffset }}>
                {props.backLink}
              </div>
            )}
            <div className="flex flex-1 flex-wrap items-end justify-between gap-x-8 gap-y-4">
              {props.title}
              {/* a DSFR button group hangs 1rem below its buttons, which would push the title down */}
              <div
                className="flex flex-1 justify-end [&_.fr-btns-group_.fr-btn]:mb-0"
                ref={props.actionsRef}
              />
            </div>
          </div>
        }
        barClassName="fr-pt-9v fr-pb-4v"
        className="grow"
        contentClassName="fr-container flex grow flex-col"
        gapClassName="border-b border-(--border-default-grey)"
      >
        {props.children}
      </PinnedHeader>
    </div>
  );
}
