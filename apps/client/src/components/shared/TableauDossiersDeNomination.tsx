import Button from '@codegouvfr/react-dsfr/Button';
import Table from '@codegouvfr/react-dsfr/Table';
import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
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
import { AffectationProvider, useAffectation } from '../../contexts/AffectationDossiersContext';

export interface TableauDossiersDeNominationProps {
  dossiersDeNomination: DossierDeNominationEtAffectationSnapshot[];
  availableRapporteurs?: UserDescriptorSerialized[];
  showExportButton?: boolean;
  ExportComponent?: React.ComponentType<{
    data: DossierDeNominationEtAffectationSnapshot[];
  }>;
  canEdit?: boolean;
  onSaveAffectations?: (affectations: { dossierId: string; rapporteurIds: string[] }[]) => void;
}

const TableauDossiersDeNominationContent = ({
  dossiersDeNomination,
  showExportButton = false,
  availableRapporteurs,
  ExportComponent,
  canEdit = false,
  onSaveAffectations
}: TableauDossiersDeNominationProps) => {
  const { getAllAffectations, resetAffectations, hasChanges } = useAffectation();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleEdit = () => {
    if (isEditing) {
      resetAffectations();
    }
    setIsEditing((prev) => !prev);
  };

  const handleSave = () => {
    if (onSaveAffectations) {
      const affectations = getAllAffectations();
      onSaveAffectations(affectations);
    }
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

  const rapporteurNoms = dossiersDeNomination?.flatMap((dossier) =>
    dossier.rapporteurs.map((r) => r.nom).filter((nom): nom is string => nom != null)
  );

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
            <>
              {isEditing && (
                <Button
                  priority="primary"
                  iconId="fr-icon-save-line"
                  title="Sauvegarder les affectations"
                  onClick={handleSave}
                  disabled={!hasChanges}
                >
                  Sauvegarder
                </Button>
              )}
              <Button
                priority="secondary"
                iconId={isEditing ? 'fr-icon-close-line' : 'fr-icon-edit-fill'}
                title={isEditing ? 'Annuler les modifications' : 'Éditer les dossiers'}
                onClick={handleEdit}
              >
                {isEditing ? 'Annuler' : undefined}
              </Button>
            </>
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

export const TableauDossiersDeNomination = (props: TableauDossiersDeNominationProps) => {
  const initialAffectations = useMemo(() => {
    return props.dossiersDeNomination.reduce(
      (acc, dossier) => {
        acc[dossier.id] = dossier.rapporteurs.map((r) => r.userId);
        return acc;
      },
      {} as Record<string, string[]>
    );
  }, [props.dossiersDeNomination]);

  return (
    <AffectationProvider initialAffectations={initialAffectations}>
      <TableauDossiersDeNominationContent {...props} />
    </AffectationProvider>
  );
};
