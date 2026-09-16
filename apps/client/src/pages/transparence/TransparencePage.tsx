import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useState, type CSSProperties } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Outlet, useLocation, useParams } from 'react-router';

import { SessionTabsBar } from '@/features/transparence/components/session/SessionTabs';
import { SessionValidationBanner } from '@/features/transparence/components/session/SessionValidationBanner';
import { TableauDeBordResume } from '@/features/transparence/components/session/TableauDeBordResume';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { PINNED_GAP, usePinnedBar, useScrollUnderPinnedBar } from '@/shared/hooks/usePinnedBar';
import { Breadcrumb, type BreadcrumbVM } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparencePage() {
  const { formatMessage } = useIntl();
  const { sessionId } = useParams();
  const { pathname } = useLocation();
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);
  const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null);
  const [isSelecting, setSelecting] = useState(false);
  const [pinnedBar, setPinnedBar] = useState<HTMLDivElement | null>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const { height, isPinned, restHeight } = usePinnedBar(sentinel, pinnedBar);
  useScrollUnderPinnedBar({ bar: pinnedBar, content, isPinned, pathname });

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
          id="transparence-details-breadcrumb"
        />
      </div>
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
          <div className={clsx('fr-container flex flex-col', isPinned ? 'gap-y-2' : 'gap-y-4')}>
            <div className={clsx('relative', isPinned ? 'fr-mb-2v' : 'fr-mb-4v')}>
              <div className={clsx('flex justify-between gap-x-6', { invisible: isSelecting })}>
                <TableauDeBordResume {...transparence} />
              </div>

              <div
                className={clsx('absolute inset-0 flex flex-col justify-center', { hidden: !isSelecting })}
                ref={setHeaderSlot}
              />
            </div>
            <div className="min-h-10" ref={setFiltersSlot} />
            <SessionTabsBar dense={isPinned} transparence={transparence} />
            <div className={clsx('empty:hidden', { 'fr-pt-2v': !isPinned })} ref={setToolbarSlot} />
          </div>
        </div>
        {isPinned && <div style={{ height: restHeight }} />}
        <div className="sticky top-[calc(var(--fondation-banner-height)+var(--fondation-pinned-bar-height))] z-4 h-(--fondation-pinned-gap) bg-(--background-default-grey)" />

        <div
          className="fr-container fr-mb-8v min-h-[calc(100dvh-var(--fondation-banner-height)-var(--fondation-pinned-bar-height))]"
          ref={setContent}
        >
          <Outlet
            context={
              {
                filtersSlot,
                headerSlot,
                isPinned,
                onSelectingChange: setSelecting,
                toolbarSlot,
                transparence,
              } satisfies TransparenceOutletContext
            }
          />
        </div>
      </div>
    </ArchiveBannerPortal>
  );
}
