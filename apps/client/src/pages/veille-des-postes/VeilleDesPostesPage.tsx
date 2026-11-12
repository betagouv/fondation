import { useState } from 'react';
import { useIntl } from 'react-intl';
import { matchPath, Outlet, useLocation } from 'react-router';

import { PinnedHeader } from '@/shared/components/pinned-header';
import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { LinkTab, LinkTabs } from '@/shared/ui/link-tabs';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useCourtOfCassationHoldersCountQuery } from '@queries/veille-des-postes.queries';

import type { VeilleDesPostesOutletContext } from './veille-des-postes-outlet-context.type';

export function VeilleDesPostesPage() {
  const { formatMessage } = useIntl();
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);
  const [titleSlot, setTitleSlot] = useState<HTMLSpanElement | null>(null);
  const breadcrumbRoot = useBreadcrumbRoot();
  const { pathname } = useLocation();
  const courtOfCassationHolders = useCourtOfCassationHoldersCountQuery();

  const tabs = [
    {
      label: formatMessage({ defaultMessage: "Premiers présidents de cour d'appel" }),
      to: ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES_COURTS_OF_APPEAL,
    },
    {
      label: formatMessage({ defaultMessage: 'Présidents de tribunaux judiciaires' }),
      to: ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES_JUDICIAL_COURTS,
    },
    {
      count: courtOfCassationHolders,
      label: formatMessage({ defaultMessage: 'Magistrats du siège de la Cour de cassation' }),
      to: ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES_COURT_OF_CASSATION,
    },
  ];
  const currentTab = tabs.find((tab) => matchPath({ end: false, path: tab.to }, pathname));

  return (
    <>
      <div className="fr-container">
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de la veille des postes" })}
          breadcrumb={{
            currentPageLabel: currentTab?.label ?? formatMessage({ defaultMessage: 'Veille des postes' }),
            segments: breadcrumbRoot,
          }}
          className="fr-mt-8v fr-mb-0"
          id="veille-des-postes-breadcrumb"
        />
      </div>
      <PinnedHeader
        bar={(isPinned) => (
          <div className="fr-container flex flex-col gap-y-4">
            <h1 className="fr-h3 fr-mb-0">
              {formatMessage({ defaultMessage: 'Veille des postes' })}
              {isPinned && <span ref={setTitleSlot} />}
            </h1>
            <div className="min-h-10" ref={setFiltersSlot} />
            <LinkTabs ariaLabel={formatMessage({ defaultMessage: 'Types de postes en veille' })}>
              {tabs.map((tab) => (
                <LinkTab count={tab.count} key={tab.to} label={tab.label} to={tab.to} />
              ))}
            </LinkTabs>
          </div>
        )}
        barClassName="fr-pt-6v"
        contentClassName="fr-container fr-mt-6v fr-mb-8v"
      >
        <Outlet context={{ filtersSlot, titleSlot } satisfies VeilleDesPostesOutletContext} />
      </PinnedHeader>
    </>
  );
}
