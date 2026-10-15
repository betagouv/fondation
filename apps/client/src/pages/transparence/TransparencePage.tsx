import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Outlet, useParams } from 'react-router';

import { SessionCommentPanel } from '@/features/transparence/components/session/SessionCommentPanel';
import { SessionTabsBar } from '@/features/transparence/components/session/SessionTabs';
import { SessionValidationBanner } from '@/features/transparence/components/session/SessionValidationBanner';
import { TableauDeBordResume } from '@/features/transparence/components/session/TableauDeBordResume';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { Breadcrumb, type BreadcrumbVM } from '@/shared/ui/Breadcrumb';
import { Collapse } from '@/shared/ui/collapse';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparencePage() {
  const { formatMessage } = useIntl();
  const { sessionId } = useParams();
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);
  const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null);
  const [isSelecting, setSelecting] = useState(false);

  const { data: transparence, isPending, isError } = useDetailedNominationSessionQuery({ sessionId });

  if (isPending) {
    return null;
  }

  if (!transparence || isError) {
    return (
      <div className="fr-container fr-pt-5v">
        <FormattedMessage defaultMessage="Session de type Transparence non trouvée." />
      </div>
    );
  }

  const breadcrumb: BreadcrumbVM = {
    currentPageLabel: transparence.name,
    segments: [
      {
        label: formatMessage({ defaultMessage: 'Secrétariat général' }),
        to: ROUTE_PATHS.SG.DASHBOARD,
      },
      {
        label: formatMessage({ defaultMessage: 'Gérer une session' }),
        to: ROUTE_PATHS.SG.MANAGE_SESSION,
      },
    ],
  };

  return (
    <ArchiveBannerPortal isArchived={transparence.isArchived}>
      <div className={cx('fr-container')}>
        <SessionValidationBanner session={transparence} />
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane d'une transparence détaillée" })}
          breadcrumb={breadcrumb}
          className="fr-mt-8v fr-mb-0"
          id="transparence-details-breadcrumb"
        />
      </div>
      <PinnedHeader
        bar={(isPinned) => (
          <>
            <div className="fr-container flex flex-col gap-y-4">
              <div className={clsx('flex justify-between gap-x-6', { hidden: isPinned && isSelecting })}>
                <TableauDeBordResume {...transparence} />
              </div>

              <div className={clsx('fr-pb-2v', { hidden: !isSelecting })} ref={setHeaderSlot} />
              <div className="min-h-10" ref={setFiltersSlot} />
              <SessionTabsBar transparence={transparence} />
            </div>

            <Collapse collapsible={!isSelecting}>
              <div className="fr-container fr-pt-6v empty:hidden" ref={setToolbarSlot} />
            </Collapse>
          </>
        )}
        barClassName="fr-pt-6v"
        contentClassName="fr-container fr-mb-8v min-h-[calc(100dvh-var(--fondation-banner-height)-var(--fondation-pinned-bar-height))]"
      >
        <Outlet
          context={
            {
              filtersSlot,
              headerSlot,
              onSelectingChange: setSelecting,
              toolbarSlot,
              transparence,
            } satisfies TransparenceOutletContext
          }
        />
      </PinnedHeader>
      <SessionCommentPanel isArchived={transparence.isArchived} sessionId={transparence.id} />
    </ArchiveBannerPortal>
  );
}
