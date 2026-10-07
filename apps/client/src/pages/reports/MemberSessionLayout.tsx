import clsx from 'clsx';
import { useState, type CSSProperties } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useLocation, useParams } from 'react-router';

import { HeaderReportList } from '@/features/reports/components/HeaderReportList';
import { MemberSessionTabsBar } from '@/features/transparence/components/session/SessionTabs';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { PINNED_GAP, useFoldWithScroll, usePinnedBar } from '@/shared/hooks/usePinnedBar';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { Collapse } from '@/shared/ui/collapse';
import { TransparencesCurrentPage, useTransparencesBreadCrumb } from '@/utils/transparences-breadcrumb.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import type { MemberSessionOutletContext } from './member-session-outlet-context.type';

export function MemberSessionLayout() {
  const { formatMessage } = useIntl();
  const { sessionId } = useParams();
  const { pathname } = useLocation();
  const breadCrumbOf = useTransparencesBreadCrumb();
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);
  const [pinnedBar, setPinnedBar] = useState<HTMLDivElement | null>(null);
  const [region, setRegion] = useState<HTMLDivElement | null>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null);
  const { isPinned, restHeight } = usePinnedBar(sentinel, pinnedBar);
  useFoldWithScroll({ bar: pinnedBar, isPinned, pathname, region, restHeight });

  const { data: session, isPending } = useDetailedNominationSessionQuery({ sessionId });

  if (isPending || !session) return null;

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

      <div
        className="flex flex-col [overflow-anchor:none]"
        ref={setRegion}
        style={
          {
            '--fondation-pinned-gap': `${PINNED_GAP}px`,
            '--fondation-table-header-top':
              'calc(var(--fondation-banner-height) + var(--fondation-pinned-bar-height) + var(--fondation-pinned-gap))',
          } as CSSProperties
        }
      >
        <div className="h-px" ref={setSentinel} />
        <div
          className={clsx('fr-pt-6v', {
            'fixed top-(--fondation-banner-height) right-(--fondation-scroll-lock-gutter) left-0 z-5 bg-(--background-default-grey)':
              isPinned,
          })}
          ref={setPinnedBar}
        >
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
        </div>
        {isPinned && <div style={{ height: restHeight }} />}
        <div className="sticky top-[calc(var(--fondation-banner-height)+var(--fondation-pinned-bar-height))] z-4 h-(--fondation-pinned-gap) bg-(--background-default-grey)" />

        <div className="fr-mb-4v min-h-[calc(100dvh-var(--fondation-banner-height)-var(--fondation-pinned-bar-height))]">
          <Outlet context={{ filtersSlot, session, toolbarSlot } satisfies MemberSessionOutletContext} />
        </div>
      </div>
    </ArchiveBannerPortal>
  );
}
