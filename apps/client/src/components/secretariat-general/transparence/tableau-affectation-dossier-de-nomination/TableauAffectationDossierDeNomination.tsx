import { useParams } from 'react-router-dom';
import { useGetDossierDeNominationParSession } from '../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import { colors } from '@codegouvfr/react-dsfr/fr/colors';
import Table from '@codegouvfr/react-dsfr/Table';
import type { ReactNode } from 'react';
import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { dataRows, HEADER_COLUMNS, applyFilters } from './tableau-affectation-config';
import { useTableData } from '../../../../hooks/useTableData.hook';
import { ExcelExport } from './ExcelExport';
import { FiltresDossiersDeNomination } from './FiltresDossiersDeNomination';
import type { FiltersState } from '../../../shared/filter-configurations';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { TableControl } from '../../../shared/TableControl';

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
  } = useTableData<NonNullable<typeof dossiersDeNomination>[0], FiltersState>({
    data: dossiersDeNomination || [],
    filters,
    applyFilters
  });

  const TABLE_HEADER: ReactNode[] = HEADER_COLUMNS.map((header) => (
    <span className="flex items-center gap-1">
      {header.label}
      <Button
        iconId={getSortIcon(header.field) as 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line'}
        onClick={() => handleSort(header.field)}
        className="fr-btn--icon-only p-0 hover:bg-transparent"
        priority="tertiary no outline"
        title={`Trier par ${header.label}`}
      />
    </span>
  ));

  const dossierDataRows = dataRows(paginatedData);
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
        <div style={{ color: colors.options.error._425_625.default }}>
          Erreur lors de la récupération des dossiers de nomination
        </div>
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
