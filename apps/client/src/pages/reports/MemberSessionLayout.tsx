import clsx from 'clsx';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useParams } from 'react-router';

import { HeaderReportList } from '@/features/reports/components/HeaderReportList';
import { SessionNotFound } from '@/features/transparence/components/session/SessionNotFound';
import { MemberSessionTabsBar } from '@/features/transparence/components/session/SessionTabs';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { Collapse } from '@/shared/ui/collapse';
import { HttpException } from '@/utils/http-exception';
import { TransparencesCurrentPage, useTransparencesBreadCrumb } from '@/utils/transparences-breadcrumb.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import type { MemberSessionOutletContext } from './member-session-outlet-context.type';

export function MemberSessionLayout() {
  const { formatMessage } = useIntl();
  const { sessionId } = useParams();
  const breadCrumbOf = useTransparencesBreadCrumb();
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null);

  const { data: session, error, isPending } = useDetailedNominationSessionQuery({ sessionId });

  if (isPending) return null;
  if (error && !(error instanceof HttpException && error.statusCode === 404)) throw error;
  if (!session) return <SessionNotFound />;

  return (
    <ArchiveBannerPortal isArchived={session.isArchived}>
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane des rapports" })}
        breadcrumb={breadCrumbOf({
          formation: session.formation,
          name: TransparencesCurrentPage.perGdsTransparencyReports,
        })}
        className="fr-mb-0"
        id="reports-breadcrumb"
      />

      <PinnedHeader
        bar={(isPinned) => (
          <>
            <div className={clsx('flex flex-col gap-y-4', { 'fr-container': isPinned })}>
              <HeaderReportList
                dateTransparence={session.date}
                dueDate={session.dueDate}
                formation={session.formation}
                transparency={session.name}
              />
              <div className="min-h-10" ref={setFiltersSlot} />
              <MemberSessionTabsBar sessionId={session.id} />
            </div>

            <Collapse>
              <div
                className={clsx('fr-pt-6v empty:hidden', { 'fr-container': isPinned })}
                ref={setToolbarSlot}
              />
            </Collapse>
          </>
        )}
        barClassName="fr-pt-6v"
        contentClassName="fr-mb-4v min-h-[calc(100dvh-var(--fondation-banner-height)-var(--fondation-pinned-bar-height))]"
      >
        <Outlet context={{ filtersSlot, session, toolbarSlot } satisfies MemberSessionOutletContext} />
      </PinnedHeader>
    </ArchiveBannerPortal>
  );
}
