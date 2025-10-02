import { useParams } from 'react-router-dom';
import { useGetDossierDeNominationParSession } from '../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import {
  dataRowsAffectationsDn,
  HEADER_COLUMNS_AFFECTATIONS_DN,
  sortValueSpecificDnField
} from '../../../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/tableau-affectation-config';
import type { ReactNode } from 'react';
import { SortButton } from '../../../shared/SortButton';
import { useTable } from '../../../../hooks/useTable.hook';
import type { FiltersState } from '../../../shared/filter-configurations';
import Table from '@codegouvfr/react-dsfr/Table';
import { TableControl } from '../../../shared/TableControl';

export const ReportsDnVueGenerale = () => {
  const { sessionId } = useParams();
  const {
    data: dossiersDeNomination,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useGetDossierDeNominationParSession({
    sessionId: sessionId as string
  });

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
  } = useTable<NonNullable<typeof dossiersDeNomination>[0], FiltersState>(dossiersDeNomination || [], {
    getSortValue: sortValueSpecificDnField
  });

  if (isLoadingDossiersDeNomination) {
    return <div>Chargement des dossiers de nomination...</div>;
  }

  if (isErrorDossiersDeNomination) {
    return <ErrorMessage message="Erreur lors du chargement des dossiers de nomination..." />;
  }

  const TABLE_HEADER: ReactNode[] = HEADER_COLUMNS_AFFECTATIONS_DN.map((header) => (
    <span className="flex items-center gap-1">
      {header.label}
      <SortButton
        iconId={getSortIcon(header.field) as 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line'}
        onClick={() => handleSort(header.field)}
        label={header.label}
      />
    </span>
  ));

  const dossierDataRows = dataRowsAffectationsDn(paginatedData);

  return (
    <div>
      <Table
        id="session-affectation-dossier-de-nomination-table"
        bordered
        headers={TABLE_HEADER}
        data={dossierDataRows}
      />
      <TableControl
        onChange={setItemsPerPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        displayedItems={displayedItems}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
};
