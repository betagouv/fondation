import { useParams } from 'react-router-dom';
import { useGetDossierDeNominationParSession } from '../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import Table from '@codegouvfr/react-dsfr/Table';
import type { ReactNode } from 'react';
import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import {
  dataRowsAffectationsDn,
  HEADER_COLUMNS_AFFECTATIONS_DN,
  applyFilters,
  sortValueSpecificDnField
} from './tableau-affectation-config';
import { ExcelExport } from './ExcelExport';
import { FiltresDossiersDeNomination } from './FiltresDossiersDeNomination';
import type { FiltersState } from '../../../shared/filter-configurations';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { TableControl } from '../../../shared/TableControl';
import { SortButton } from '../../../shared/SortButton';
import { useTable } from '../../../../hooks/useTable.hook';
import { ErrorMessage } from '../../../shared/ErrorMessage';

export const TableauAffectationDossierDeNomination = () => {
  const { sessionId } = useParams();
  const {
    data: dossiersDeNomination,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useGetDossierDeNominationParSession({
    sessionId: sessionId as string
  });

  const [filters, setFilters] = useState<FiltersState>({
    rapporteurs: [],
    formations: [],
    sessionType: []
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
    filters,
    applyFilters,
    getSortValue: sortValueSpecificDnField
  });

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
  const rapporteurs = dossiersDeNomination?.flatMap((dossier) => dossier.rapporteurs);

  return (
    <div id="session-affectation-dossier-de-nomination" className={cx('fr-py-1v')}>
      {/* Préchargement des icônes pour éviter les problèmes de chargement conditionnel */}
      <div style={{ display: 'none' }}>
        <Button iconId="fr-icon-arrow-down-line" onClick={() => {}} children={null} />
        <Button iconId="fr-icon-arrow-up-line" onClick={() => {}} children={null} />
      </div>
      <div className="flex items-center justify-between">
        <FiltresDossiersDeNomination
          filters={filters}
          onFiltersChange={setFilters}
          rapporteurs={rapporteurs}
        />
        <ExcelExport data={paginatedData} />
      </div>
      {isLoadingDossiersDeNomination && <div>Chargement des dossiers de nomination...</div>}
      {isErrorDossiersDeNomination && (
        <ErrorMessage message="Erreur lors de la récupération des dossiers de nomination" />
      )}
      {!isLoadingDossiersDeNomination && (
        <>
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
        </>
      )}
    </div>
  );
};
