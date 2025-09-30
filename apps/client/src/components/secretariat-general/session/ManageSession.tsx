import Table from '@codegouvfr/react-dsfr/Table';
import { useGetSessions } from '../../../react-query/queries/sg/get-sessions.query';
import type { ReactNode } from 'react';
import { getSgSessionPath, ROUTE_PATHS } from '../../../utils/route-path.utils';
import { Breadcrumb } from '../../shared/Breadcrumb';
import type { BreadcrumbVM } from '../../../models/breadcrumb-vm.model';
import { useNavigate } from 'react-router-dom';
import { TypeDeSaisine, TypeDeSaisineLabels } from 'shared-models';
import { DateOnly } from '../../../models/date-only.model';
import { useTableData } from '../../../hooks/useTableData.hook';
import { TableControl } from '../../shared/TableControl';
import { SortButton } from '../../shared/SortButton';

export const ManageSession = () => {
  const navigate = useNavigate();
  const { data: sessions } = useGetSessions();

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
  } = useTableData<NonNullable<typeof sessions>[0], unknown>({
    data: sessions || [],
    itemsPerPage: 10
  });

  const HEADERS_COLUMNS = [
    { field: 'typeDeSaisine', label: 'Type de saisine' },
    { field: 'formation', label: 'Formation' },
    { field: 'name', label: 'Nom de la transparence' },
    { field: 'dateTransparence', label: 'Date de publication' },
    { field: 'dateEcheance', label: "Date d'écheance" }
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
      formation,
      <a href={href}>{name.toUpperCase()}</a>,
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
