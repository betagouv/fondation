import Alert from '@codegouvfr/react-dsfr/Alert';
import Table from '@codegouvfr/react-dsfr/Table';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { TypeDeSaisineLabels } from 'shared-models';

import { useTable } from '../../../hooks/useTable.hook';
import { DateOnly } from '../../../models/date-only.model';

import type { BreadcrumbVM } from '../../../models/breadcrumb-vm.model';

import { Breadcrumb } from '../../shared/Breadcrumb';
import { SortButton } from '../../shared/SortButton';
import { TableControl } from '../../shared/TableControl';

import {
  listGdsNominationSessionsQuery,
  type ListedNominationSession
} from '../../../react-query/mutations/sg/nomination-sessions';

import { getSgSessionPath, ROUTE_PATHS } from '../../../utils/route-path.utils';
import { FiltresSessions, type SessionFiltersState } from './FiltresSessions';

function applySessionFilters(
  sessions: readonly ListedNominationSession[],
  filters: SessionFiltersState
): ListedNominationSession[] {
  return sessions.filter((session: ListedNominationSession) => {
    if (filters.formations.length > 0) {
      if (!filters.formations.includes(session.formation)) {
        return false;
      }
    }

    if (filters.typeDeSaisine.length > 0) {
      if (!filters.typeDeSaisine.includes(session.typeDeSaisine)) {
        return false;
      }
    }

    return true;
  });
}

export const ManageSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: sessions } = useQuery({
    queryKey: ['listed-gds-nomination-sessions'],
    queryFn: listGdsNominationSessionsQuery
  });

  const successSessionImportTitle = location.state?.success ?? undefined;

  const [filters, setFilters] = useState<SessionFiltersState>({
    formations: [],
    typeDeSaisine: []
  });

  const breadcrumb: BreadcrumbVM = {
    currentPageLabel: 'Gérer une session',
    segments: [
      {
        label: 'Secretariat général',
        to: ROUTE_PATHS.SG.DASHBOARD,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          navigate(ROUTE_PATHS.SG.DASHBOARD);
        }
      }
    ]
  };

  const {
    data: paginatedData,
    totalPages,
    currentPage,
    totalItems,
    displayedItems,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    handleSort,
    getSortIcon
  } = useTable(sessions?.items ?? [], {
    filters,
    applyFilters: applySessionFilters,
    itemsPerPage: 50
  });

  const HEADERS_COLUMNS = [
    { field: 'typeDeSaisine', label: 'Type de session' },
    { field: 'name', label: 'Intitulé de la session' },
    { field: 'formation', label: 'Formation' },
    { field: 'dateTransparence', label: 'Date de publication' },
    { field: 'dateEcheance', label: "Date d'écheance" },
    { field: 'status', label: 'Statut' }
  ];

  const headers: ReactNode[] = HEADERS_COLUMNS.map((header) => (
    <span className="flex items-center gap-1">
      {header.label}
      <SortButton
        iconId={getSortIcon(header.field) as 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line'}
        onClick={() => handleSort(header.field)}
        label={header.label}
      />
    </span>
  ));

  const sessionRows = (paginatedData || []).map((session) => {
    const href = getSgSessionPath(session.id);
    return [
      TypeDeSaisineLabels[session.typeDeSaisine],
      <Link to={href}>{session.name.toUpperCase()}</Link>,
      session.formation,
      DateOnly.fromDateOnly(session.date),
      session.dueDate && DateOnly.fromDateOnly(session.dueDate),
      ''
    ];
  });

  return (
    <>
      <Breadcrumb
        id="manage-sessions-breadcrumb"
        ariaLabel="Fil d'Ariane de la gestion des sessions"
        breadcrumb={breadcrumb}
      />

      {successSessionImportTitle && (
        <Alert
          closable
          severity="success"
          title={`Session «\u00A0${successSessionImportTitle}\u00A0» créée`}
          className="mb-10"
        />
      )}

      <FiltresSessions filters={filters} onFiltersChange={setFilters} />

      <div className="mb-4 flex justify-center">
        <Table className="mb-0" id="all-sessions-table" bordered headers={headers} data={sessionRows} />
        {sessionRows.length === 0 ? (
          <p className="bg-fr-gray-bg mb-0 border border-t-0 border-solid border-[#808080] py-4 text-center text-gray-600">
            Aucun résultat ne correspond aux valeurs filtrées
          </p>
        ) : null}
      </div>
      <TableControl
        onChange={setItemsPerPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        displayedItems={displayedItems}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  );
};
