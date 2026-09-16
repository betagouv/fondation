import Alert from '@codegouvfr/react-dsfr/Alert';
import Stepper from '@codegouvfr/react-dsfr/Stepper';
import clsx from 'clsx';
import { useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, Link, useLocation, useNavigate } from 'react-router';

import { AgendaBreadCrumb } from '@/features/documents/components/agenda/AgendaBreadcrumb';
import { AgendaMetadataStep } from '@/features/documents/components/agenda/AgendaMetadataStep';
import { AgendaNominationFilesStep } from '@/features/documents/components/agenda/AgendaNominationFilesStep';
import { useAgenda } from '@/features/documents/context/AgendaContext';
import { AgendaProvider } from '@/features/documents/context/AgendaProvider';
import { PINNED_GAP, usePinnedBar } from '@/shared/hooks/usePinnedBar';
import { useScrollToTop } from '@/shared/hooks/useScrollToTop';
import { useSecondBreadcrumbLinkOffset } from '@/shared/hooks/useSecondBreadcrumbLinkOffset';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

function AgendaContent() {
  const { error, session, step } = useAgenda();
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();
  const headerRef = useRef<HTMLDivElement>(null);
  const backLinkOffset = useSecondBreadcrumbLinkOffset(headerRef);
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);
  const [pinnedBar, setPinnedBar] = useState<HTMLDivElement | null>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const { height, isPinned, restHeight } = usePinnedBar(sentinel, pinnedBar);

  useScrollToTop(String(step.index));

  const isSelectingFiles = step.index === 2;

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (locationKey === 'default') return;

    event.preventDefault();
    navigate(-1);
  };

  return (
    <div
      className="fr-pt-4v flex grow flex-col [overflow-anchor:none]"
      style={
        {
          '--fondation-pinned-bar-height': `${height}px`,
          '--fondation-pinned-gap': `${PINNED_GAP}px`,
        } as CSSProperties
      }
    >
      <div className="fr-container" ref={headerRef}>
        <AgendaBreadCrumb />
        {error && <Alert as="h2" className="fr-mb-6v" closable severity="error" title={error} />}
      </div>

      <div className="h-px" ref={setSentinel} />

      <div
        className={clsx({
          'fr-pb-4v': !isPinned,
          'fr-py-3v fixed top-(--fondation-banner-height) right-(--fondation-scroll-lock-gutter) left-0 z-5 bg-(--background-default-grey) shadow-[0_4px_8px_rgba(0,0,0,0.1)]':
            isPinned,
        })}
        ref={setPinnedBar}
      >
        <div className="fr-container flex flex-col gap-y-4">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div className="min-w-fit shrink-0 self-start" style={{ width: backLinkOffset }}>
              <Link
                className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
                onClick={goBack}
                to={generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: session.id })}
              >
                <FormattedMessage defaultMessage="Quitter" />
              </Link>
            </div>
            <div className="flex flex-1 flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="w-full md:w-1/2 [&_.fr-stepper]:mb-0">
                <Stepper currentStep={step.index} stepCount={2} title={step.title} />
              </div>
              <div className="flex flex-1 justify-end" ref={setActionsSlot} />
            </div>
          </div>
        </div>
      </div>

      {isPinned && <div style={{ height: restHeight }} />}
      <div
        className={clsx(
          'sticky top-[calc(var(--fondation-banner-height)+var(--fondation-pinned-bar-height))] z-4 h-(--fondation-pinned-gap)',
          isPinned && isSelectingFiles && 'bg-(--background-alt-grey)',
        )}
      />

      <div className="fr-container flex grow flex-col">
        <AgendaMetadataStep
          actionsSlot={isSelectingFiles ? null : actionsSlot}
          className={clsx({ hidden: isSelectingFiles })}
        />
        <AgendaNominationFilesStep
          actionsSlot={isSelectingFiles ? actionsSlot : null}
          className={clsx({ hidden: !isSelectingFiles })}
          scrollsWithPage
        />
      </div>
    </div>
  );
}

export function CreateAgendaPage() {
  return (
    <AgendaProvider>
      <AgendaContent />
    </AgendaProvider>
  );
}
