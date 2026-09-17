import clsx from 'clsx';
import { useState, type CSSProperties } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useLocation, useParams } from 'react-router';

import { HeaderReportList } from '@/features/reports/components/HeaderReportList';
import { MemberSessionTabsBar } from '@/features/transparence/components/session/SessionTabs';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { PINNED_GAP, usePinnedBar, useScrollUnderPinnedBar } from '@/shared/hooks/usePinnedBar';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { TransparencesCurrentPage, useTransparencesBreadCrumb } from '@/utils/transparences-breadcrumb.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import type { MemberSessionOutletContext } from './member-session-outlet-context.type';

export function MemberSessionLayout() {
  const { formatMessage } = useIntl();
  const { sessionId } = useParams();
  const { pathname } = useLocation();
  const breadCrumbOf = useTransparencesBreadCrumb();
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);
  const [pinnedBar, setPinnedBar] = useState<HTMLDivElement | null>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null);
  const { height, isPinned, restHeight } = usePinnedBar(sentinel, pinnedBar);
  useScrollUnderPinnedBar({ bar: pinnedBar, content, isPinned, pathname });

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
        id="reports-breadcrumb"
      />

      <div
        className="flex flex-col"
        style={
          {
            '--fondation-pinned-bar-height': `${height}px`,
            '--fondation-pinned-gap': `${PINNED_GAP}px`,
            '--fondation-table-header-top': `calc(var(--fondation-banner-height) + ${height + PINNED_GAP}px)`,
          } as CSSProperties
        }
      >
        <div className="h-px" ref={setSentinel} />
        <div
          className={clsx({
            'fr-py-2v fixed top-(--fondation-banner-height) right-(--fondation-scroll-lock-gutter) left-0 z-5 bg-(--background-default-grey) shadow-[0_4px_8px_rgba(0,0,0,0.1)]':
              isPinned,
          })}
          ref={setPinnedBar}
        >
          <div className={clsx('flex flex-col', isPinned ? 'fr-container gap-y-2' : 'gap-y-4')}>
            <HeaderReportList
              dateTransparence={session.date}
              dueDate={session.dueDate}
              formation={session.formation}
              transparency={session.name}
            />
            <div className="min-h-10" ref={setFiltersSlot} />
            <MemberSessionTabsBar dense={isPinned} sessionId={session.id} />
            <div className={clsx('empty:hidden', { 'fr-pt-2v': !isPinned })} ref={setToolbarSlot} />
          </div>
        </div>
        {isPinned && <div style={{ height: restHeight }} />}
        <div className="sticky top-[calc(var(--fondation-banner-height)+var(--fondation-pinned-bar-height))] z-4 h-(--fondation-pinned-gap) bg-(--background-default-grey)" />

        <div
          className="fr-mb-4v min-h-[calc(100dvh-var(--fondation-banner-height)-var(--fondation-pinned-bar-height))]"
          ref={setContent}
        >
          <Outlet
            context={{ filtersSlot, isPinned, session, toolbarSlot } satisfies MemberSessionOutletContext}
          />
        </div>
      </div>
    </ArchiveBannerPortal>
  );
}
