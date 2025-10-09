import Button from '@codegouvfr/react-dsfr/Button';
import Table from '@codegouvfr/react-dsfr/Table';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { useTable } from '../../hooks/useTable.hook';
import {
  applyFilters,
  dataRowsAffectationsDn,
  HEADER_COLUMNS_AFFECTATIONS_DN,
  sortValueSpecificDnField
} from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/tableau-affectation-config';
import { FiltresDossiersDeNomination } from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/FiltresDossiersDeNomination';
import type { FiltersState } from './filter-configurations';
import { SortButton } from './SortButton';
import { TableControl } from './TableControl';
import type { UserDescriptorSerialized } from 'shared-models';

export interface TableauDossiersDeNominationProps {
  dossiersDeNomination: DossierDeNominationEtAffectationSnapshot[];
  availableRapporteurs?: UserDescriptorSerialized[];
  showExportButton?: boolean;
  ExportComponent?: React.ComponentType<{ data: DossierDeNominationEtAffectationSnapshot[] }>;
}

export const TableauDossiersDeNomination = ({
  dossiersDeNomination,
  availableRapporteurs,
  showExportButton = false,
  ExportComponent
}: TableauDossiersDeNominationProps) => {
  const [filters, setFilters] = useState<FiltersState>({
    rapporteurs: [],
    priorite: []
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
  } = useTable<DossierDeNominationEtAffectationSnapshot, FiltersState>(dossiersDeNomination, {
    filters,
    applyFilters,
    getSortValue: sortValueSpecificDnField
  });

  const TABLE_HEADER: ReactNode[] = HEADER_COLUMNS_AFFECTATIONS_DN.map((header) => (
    <span key={header.field} className="flex items-center gap-1">
      {header.label}
      <SortButton
        iconId={getSortIcon(header.field) as 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line'}
        onClick={() => handleSort(header.field)}
        label={header.label}
      />
    </span>
  ));

  const dossierDataRows = dataRowsAffectationsDn(paginatedData, availableRapporteurs || []);
  const rapporteurs = dossiersDeNomination?.flatMap((dossier) => dossier.rapporteurs);

  return (
    <div>
      {/* Préchargement des icônes pour éviter les problèmes de chargement conditionnel */}
      <div style={{ display: 'none' }}>
        <Button iconId="fr-icon-arrow-down-line" onClick={() => {}} children={null} />
        <Button iconId="fr-icon-arrow-up-line" onClick={() => {}} children={null} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <FiltresDossiersDeNomination
          filters={filters}
          onFiltersChange={setFilters}
          rapporteurs={rapporteurs}
        />
        {showExportButton && ExportComponent && <ExportComponent data={paginatedData} />}
      </div>

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
