import './TableauDossiersDeNomination.css';

import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Table from '@codegouvfr/react-dsfr/Table';
import clsx from 'clsx';
import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import { useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { PrioriteEnum, type FormationEnum } from '@/types/enums.types';
import {
  useAffectNominationFilesReportersMutation,
  type SessionNominationFile
} from '@queries/nomination-sessions.queries';
import { AffectationProvider, useAffectation } from '../../contexts/AffectationDossiersContext';
import { useTable } from '../../hooks/useTable.hook';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { NominationFilesAutoAffectationButton } from '../secretariat-general/transparence/content/tableau-de-bord/actions/NominationFilesAutoAffectationButton';
import { ActionsGroupees } from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/ActionsGroupees';
import { FiltresDossiersDeNomination } from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/FiltresDossiersDeNomination';
import { MagistratModaleProvider } from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/MagistratDnModale';
import {
  applyFilters,
  dataRowsDn,
  dataRowsDnEdition,
  HEADER_COLUMNS_AFFECTATIONS_DN,
  HEADER_COLUMNS_AFFECTATIONS_DN_EDITION
} from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/tableau-affectation-config';
import { useAlerts } from './alerts/alerts.context';
import type { FiltersState } from './filter-configurations';
import { SortButton } from './SortButton';
import { TableControl } from './TableControl';
import { HttpException } from '@/utils/http-exception';
import { NominationFileOutcomeCommentModalProvider } from '../secretariat-general/transparence/tableau-affectation-dossier-de-nomination/nomination-file-outcome/NominationFileOutcomeCommentModalProvider';

export interface TableauDossiersDeNominationProps {
  dossiersDeNomination: SessionNominationFile[];
  availableRapporteurs?: { userId: string; firstName: string; lastName: string }[];
  canEdit?: boolean;
  children?: React.ReactNode[] | React.ReactNode | undefined;
  formation: FormationEnum;
  sessionId: string;
}

const TableauDossiersDeNominationContent = ({
  dossiersDeNomination,
  availableRapporteurs,
  canEdit = false,
  children,
  formation,
  sessionId
}: TableauDossiersDeNominationProps) => {
  const alerts = useAlerts();
  const { pathname } = useLocation();
  const { mutateAsync: saveAffectations } = useAffectNominationFilesReportersMutation();
  const { getAllAffectations, resetAffectations, hasChanges } = useAffectation();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const isSg = useMemo(() => pathname.includes(ROUTE_PATHS.SG.DASHBOARD), [pathname]);

  const handleEdit = () => {
    if (isEditing) {
      resetAffectations();
    }
    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    const affectations = getAllAffectations();
    await saveAffectations(
      {
        sessionId,
        affectations: affectations.map((affectation) => ({
          reporterIds: affectation.rapporteurIds,
          nominationFileId: affectation.dossierId,
          // FIXME: issue with code generation
          priority: (affectation.priorite ?? null) as PrioriteEnum
        }))
      },
      {
        onSuccess: () => alerts.pushAlert({ severity: 'success', title: 'Succès: données actualisées' }),
        onError: async (err) => {
          let description: React.ReactNode | undefined;
          if (err instanceof HttpException) {
            const { validationErrors } = (await err.response.json()) as { validationErrors: string[] };

            description =
              validationErrors.length > 1 ? (
                <ul>
                  {validationErrors.map((e, i) => (
                    <li key={`key_${i}`}>{e}</li>
                  ))}
                </ul>
              ) : (
                validationErrors[0]
              );
          }

          alerts.pushAlert({
            severity: 'error',
            title: `Erreur pendant la mise à jour des affectation`,
            description
          });
        }
      }
    );
    resetAffectations();
    setIsEditing(false);
  };

  const [filters, setFilters] = useQueryStates({
    rapporteurs: parseAsArrayOf(parseAsString).withDefault([]),
    priorite: parseAsArrayOf(parseAsStringEnum(Object.values(PrioriteEnum))).withDefault([])
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
    applyFilters
  });

  const headerColumns = isEditing ? HEADER_COLUMNS_AFFECTATIONS_DN_EDITION : HEADER_COLUMNS_AFFECTATIONS_DN;

  const TABLE_HEADER: ReactNode[] = headerColumns.map((header) => {
    if (!('sortable' in header) || !header.sortable) {
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
        formation,
        sessionId,
        data: paginatedData,
        availableRapporteurs: availableRapporteurs || []
      })
    : dataRowsDn({ data: paginatedData, sessionId, formation, context: isSg ? 'sg' : 'membre' });

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
          {canEdit && (
            <>
              {isEditing && <NominationFilesAutoAffectationButton sessionId={sessionId} />}
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
                title={
                  isEditing
                    ? hasChanges
                      ? 'Annuler les modifications'
                      : 'Revenir au mode lecture'
                    : 'Éditer les dossiers'
                }
                onClick={handleEdit}
              >
                {isEditing ? (hasChanges ? 'Annuler' : 'Fermer') : undefined}
              </Button>
            </>
          )}
          {children}
        </div>
      </div>

      <div className="max-w-screen-full mx-auto xl:max-w-screen-xl 2xl:max-w-screen-2xl">
        <div className="mb-6">
          <MagistratModaleProvider nominationFiles={paginatedData} sessionId={sessionId}>
            <NominationFileOutcomeCommentModalProvider formation={formation}>
              <Table
                id="session-affectation-dossier-de-nomination-table"
                className="mb-0"
                bordered
                fixed
                headers={TABLE_HEADER}
                data={dossierDataRows}
              />
              {paginatedData.length === 0 ? (
                <p className="mb-0 border border-t-0 border-solid border-[#808080] bg-fr-gray-bg py-4 text-center text-gray-600">
                  Aucun résultat ne correspond aux valeurs filtrées
                </p>
              ) : null}
            </NominationFileOutcomeCommentModalProvider>
          </MagistratModaleProvider>
        </div>

        <div className={clsx('mb-10', cx('fr-container'))}>
          <TableControl
            onChange={setItemsPerPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            displayedItems={displayedItems}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            label={
              isSg ? { one: 'proposition', other: 'propositions' } : { one: 'dossier', other: 'dossiers' }
            }
          />
        </div>
      </div>
    </div>
  );
};

export const TableauDossiersDeNomination = (props: TableauDossiersDeNominationProps) => {
  return (
    <AffectationProvider nominationFiles={props.dossiersDeNomination}>
      <TableauDossiersDeNominationContent {...props} />
    </AffectationProvider>
  );
};
