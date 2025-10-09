import Button from '@codegouvfr/react-dsfr/Button';
import Table from '@codegouvfr/react-dsfr/Table';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { useTable } from '../../hooks/useTable.hook';
import {
  applyFilters,
  dataRowsDn,
  dataRowsDnEdition,
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
  ExportComponent?: React.ComponentType<{
    data: DossierDeNominationEtAffectationSnapshot[];
  }>;
  canEdit?: boolean;
}

export const TableauDossiersDeNomination = ({
  dossiersDeNomination,
  showExportButton = false,
  availableRapporteurs,
  ExportComponent,
  canEdit = false
}: TableauDossiersDeNominationProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const handleEdit = () => {
    setIsEditing((prev) => !prev);
  };

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

  const dossierDataRows = isEditing
    ? dataRowsDnEdition(paginatedData, availableRapporteurs || [])
    : dataRowsDn(paginatedData);

  const rapporteurNoms = dossiersDeNomination?.flatMap((dossier) => dossier.rapporteurs.map((r) => r.nom));

  return (
    <div>
      <div style={{ display: 'none' }}>
        <Button iconId="fr-icon-arrow-down-line" onClick={() => {}} children={null} />
        <Button iconId="fr-icon-arrow-up-line" onClick={() => {}} children={null} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <FiltresDossiersDeNomination
          filters={filters}
          onFiltersChange={setFilters}
          rapporteurs={rapporteurNoms}
        />
        <div className="flex items-center gap-2">
          {showExportButton && ExportComponent && <ExportComponent data={paginatedData} />}
          {canEdit && (
            <Button
              priority="secondary"
              iconId={isEditing ? 'fr-icon-close-line' : 'fr-icon-edit-fill'}
              title={`edit-dossier-de-nomination`}
              onClick={handleEdit}
            />
          )}
        </div>
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
