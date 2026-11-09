import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { PinnedHeader } from '@/shared/components/pinned-header';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DataTable } from '@/shared/ui/data-table';
import { LinkTab, LinkTabs } from '@/shared/ui/link-tabs';
import { SearchInput } from '@/shared/ui/search-input';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function VeilleDesPostesPage() {
  const { formatMessage } = useIntl();
  const [search, setSearch] = useState('');
  const table = useReactTable<never>({
    columns: [{ header: formatMessage({ defaultMessage: 'À venir' }), id: 'upcoming' }],
    data: [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="fr-container">
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de la veille des postes" })}
          breadcrumb={{
            currentPageLabel: formatMessage({ defaultMessage: 'CSM' }),
            segments: [{ label: formatMessage({ defaultMessage: 'Accueil' }), to: ROUTE_PATHS.SG.DASHBOARD }],
          }}
          className="fr-mt-8v fr-mb-0"
          id="veille-des-postes-breadcrumb"
        />
      </div>
      <PinnedHeader
        bar={() => (
          <div className="fr-container flex flex-col gap-y-4">
            <h1 className="fr-h3 fr-mb-0">{formatMessage({ defaultMessage: 'Veille des postes' })}</h1>
            <div className="flex min-h-10 items-center justify-between gap-4">
              <span>{formatMessage({ defaultMessage: 'Filtrer par' })}</span>
              <SearchInput
                className="w-72"
                onChange={setSearch}
                onClear={() => setSearch('')}
                value={search}
              />
            </div>
            <LinkTabs ariaLabel={formatMessage({ defaultMessage: 'Types de postes en veille' })}>
              <LinkTab
                label={formatMessage({ defaultMessage: "Premiers présidents de cour d'appel" })}
                to={ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES_COURTS_OF_APPEAL}
              />
              <LinkTab
                label={formatMessage({ defaultMessage: 'Présidents de tribunaux judiciaires' })}
                to={ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES_JUDICIAL_COURTS}
              />
              <LinkTab
                label={formatMessage({ defaultMessage: 'Magistrats du siège de la Cour de cassation' })}
                to={ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES_COURT_OF_CASSATION}
              />
            </LinkTabs>
          </div>
        )}
        barClassName="fr-pt-6v"
        contentClassName="fr-container fr-mt-6v fr-mb-8v"
      >
        <DataTable emptyLabel={null} fluid table={table} unvirtualized />
      </PinnedHeader>
    </>
  );
}
