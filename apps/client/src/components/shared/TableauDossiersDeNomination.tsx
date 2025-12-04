import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Table from '@codegouvfr/react-dsfr/Table';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useMemo, useState, useRef } from 'react';
import type { Magistrat, UserDescriptorSerialized } from 'shared-models';
import { PrioriteEnum } from 'shared-models/models/priorite.enum';
import {
  AffectationProvider,
  useAffectation,
  type DossierAffectation,
  type PrioriteValue
} from '../../contexts/AffectationDossiersContext';
import { useTable } from '../../hooks/useTable.hook';
import type { SessionNominationFile } from '../../react-query/mutations/sg/nomination-session-affectations';
import { ActionsGroupees } from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/ActionsGroupees';
import { FiltresDossiersDeNomination } from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/FiltresDossiersDeNomination';
import {
  applyFilters,
  dataRowsDn,
  dataRowsDnEdition,
  HEADER_COLUMNS_AFFECTATIONS_DN,
  HEADER_COLUMNS_AFFECTATIONS_DN_EDITION,
  sortValueSpecificDnField
} from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/tableau-affectation-config';
import type { FiltersState } from './filter-configurations';
import { SortButton } from './SortButton';
import { TableControl } from './TableControl';
import { MagistratDnModale } from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/MagistratDnModale';

export interface TableauDossiersDeNominationProps {
  dossiersDeNomination: SessionNominationFile[];
  availableRapporteurs?: UserDescriptorSerialized[];
  showExportButton?: boolean;
  ExportComponent?: React.ComponentType<{
    data: SessionNominationFile[];
  }>;
  canEdit?: boolean;
  onSaveAffectations?: (affectations: DossierAffectation[]) => void;
  children?: React.ReactNode[] | React.ReactNode | undefined;
  formation: Magistrat.Formation;
}

const TableauDossiersDeNominationContent = ({
  dossiersDeNomination,
  showExportButton = false,
  availableRapporteurs,
  ExportComponent,
  canEdit = false,
  onSaveAffectations,
  children,
  formation
}: TableauDossiersDeNominationProps) => {
  const magistratModalRef = useRef<HTMLDivElement>(null);
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
      setIsEditing(false);
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
  } = useTable<SessionNominationFile, FiltersState>(dossiersDeNomination, {
    filters,
    applyFilters,
    getSortValue: sortValueSpecificDnField
  });

  const headerColumns = isEditing ? HEADER_COLUMNS_AFFECTATIONS_DN_EDITION : HEADER_COLUMNS_AFFECTATIONS_DN;

  const TABLE_HEADER: ReactNode[] = headerColumns.map((header) => {
    if (header.field === 'checkbox') {
      return <span key={header.field}>{header.label}</span>;
    }

    return (
      <span key={header.field} className="flex items-center gap-1">
        {header.label}
        <SortButton
          iconId={getSortIcon(header.field) as 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line'}
          onClick={() => handleSort(header.field)}
          label={header.label}
        />
      </span>
    );
  });

  const dossierDataRows = isEditing
    ? dataRowsDnEdition({
        magistratModalRef,
        data: paginatedData,
        availableRapporteurs: availableRapporteurs || [],
        formation
      })
    : dataRowsDn({ magistratModalRef, data: paginatedData, formation });

  const rapporteurNoms = dossiersDeNomination?.flatMap((dossier) =>
    dossier.reporters.map((r) => r.firstName + ' ' + r.lastName).filter((nom): nom is string => nom != null)
  );

  return (
    <div>
      <div className={clsx(cx('fr-container'), 'mb-4 flex items-center justify-between px-0')}>
        <FiltresDossiersDeNomination
          filters={filters}
          onFiltersChange={setFilters}
          rapporteurs={rapporteurNoms}
        />
        <div className="flex items-center gap-2">
          {showExportButton && ExportComponent && <ExportComponent data={paginatedData} />}
          {canEdit && (
            <>
              {isEditing && availableRapporteurs && (
                <ActionsGroupees availableRapporteurs={availableRapporteurs} />
              )}
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
          {children}
        </div>
      </div>

      <div className="max-w-screen-full mx-auto xl:max-w-screen-xl 2xl:max-w-screen-2xl">
        <MagistratDnModale ref={magistratModalRef} nominationFiles={paginatedData} />

        <Table
          id="session-affectation-dossier-de-nomination-table"
          bordered
          fixed
          headers={TABLE_HEADER}
          data={dossierDataRows}
        />

        <div className={clsx('mb-10', cx('fr-container'))}>
          {paginatedData.length === 0 ? <p className="mt-2 text-gray-600">Aucun résultat</p> : null}

          <TableControl
            onChange={setItemsPerPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            displayedItems={displayedItems}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            label={{ one: 'proposition', other: 'propositions' }}
          />
        </div>
      </div>
    </div>
  );
};

export const TableauDossiersDeNomination = (props: TableauDossiersDeNominationProps) => {
  const initialAffectations = useMemo(() => {
    return props.dossiersDeNomination.reduce(
      (acc, dossier) => {
        acc[dossier.id] = dossier.reporters.map((r) => r.id);
        return acc;
      },
      {} as Record<string, string[]>
    );
  }, [props.dossiersDeNomination]);

  const initialPriorites = useMemo(() => {
    return props.dossiersDeNomination.reduce(
      (acc, dossier) => {
        if (dossier.priority) {
          acc[dossier.id] = dossier.priority;
        }
        return acc;
      },
      {} as Record<string, PrioriteValue>
    );
  }, [props.dossiersDeNomination]);

  return (
    <AffectationProvider initialAffectations={initialAffectations} initialPriorites={initialPriorites}>
      <TableauDossiersDeNominationContent {...props} />
    </AffectationProvider>
  );
};
