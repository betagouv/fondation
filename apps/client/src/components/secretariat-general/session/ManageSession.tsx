import Table from '@codegouvfr/react-dsfr/Table';
import { useGetSessions } from '../../../react-query/queries/sg/get-sessions.query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { getSgSessionPath, ROUTE_PATHS } from '../../../utils/route-path.utils';
import { Breadcrumb } from '../../shared/Breadcrumb';
import type { BreadcrumbVM } from '../../../models/breadcrumb-vm.model';
import { useNavigate } from 'react-router-dom';
import { TypeDeSaisine, TypeDeSaisineLabels } from 'shared-models';
import { DateOnly } from '../../../models/date-only.model';
import { useTable } from '../../../hooks/useTable.hook';
import { TableControl } from '../../shared/TableControl';
import { SortButton } from '../../shared/SortButton';
import { FiltresSessions, type SessionFiltersState } from './FiltresSessions';

// Fonction de filtrage des sessions
const applySessionFilters = (
  sessions: NonNullable<ReturnType<typeof useGetSessions>['data']>,
  filters: SessionFiltersState
) => {
  return sessions.filter((session) => {
    // Filtre par formation
    if (filters.formations.length > 0) {
      if (!filters.formations.includes(session.formation)) {
        return false;
      }
    }

    // Filtre par type de saisine
    if (filters.typeDeSaisine.length > 0) {
      if (!filters.typeDeSaisine.includes(session.typeDeSaisine)) {
        return false;
      }
    }

    return true;
  });
};

export const ManageSession = () => {
  const navigate = useNavigate();
  const { data: sessions } = useGetSessions();

  const [filters, setFilters] = useState<SessionFiltersState>({
    formations: [],
    typeDeSaisine: []
  });

  const breadcrumb: BreadcrumbVM = {
    currentPageLabel: 'Gérer une session',
    segments: [
      {
        label: 'Secretariat général',
        href: ROUTE_PATHS.SG.DASHBOARD,
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
  } = useTable<NonNullable<typeof sessions>[0], SessionFiltersState>(sessions || [], {
    filters,
    applyFilters: applySessionFilters,
    itemsPerPage: 50
  });

  const HEADERS_COLUMNS = [
    { field: 'typeDeSaisine', label: 'Type de session' },
    { field: 'name', label: 'Intitulé de la session' },
    { field: 'formation', label: 'Formation' },
    { field: 'dateTransparence', label: 'Date de publication' },
    { field: 'dateEcheance', label: "Date d'écheance" }
    // { field: 'status', label: 'Statut' }
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
    const { name, formation, dateTransparence, dateEcheance, sessionImportId, typeDeSaisine, sessionId } =
      session;
    const href = getSgSessionPath(sessionId, sessionImportId);

    return [
      TypeDeSaisineLabels[typeDeSaisine as TypeDeSaisine],
      <a href={href}>{name.toUpperCase()}</a>,
      formation,
      DateOnly.fromDateOnly(dateTransparence),
      dateEcheance && DateOnly.fromDateOnly(dateEcheance)
    ];
  });

  return (
    <>
      <Breadcrumb
        id="manage-sessions-breadcrumb"
        ariaLabel="Fil d'Ariane de la gestion des sessions"
        breadcrumb={breadcrumb}
      />

      <FiltresSessions filters={filters} onFiltersChange={setFilters} />

      <div className="flex justify-center">
        <Table id="all-sessions-table" bordered headers={headers} data={sessionRows} />
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
