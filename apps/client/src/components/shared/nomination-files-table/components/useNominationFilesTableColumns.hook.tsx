import { createColumnHelper } from '@tanstack/react-table';
import React from 'react';

import { DropdownPriorite } from '@/components/secretariat-general/transparence/tableau-affectation-dossier-de-nomination/DropdownPriorite';
import { MagistratDnModalLink } from '@/components/secretariat-general/transparence/tableau-affectation-dossier-de-nomination/MagistratDnModale';
import { NominationFileOutcome } from '@/components/secretariat-general/transparence/tableau-affectation-dossier-de-nomination/nomination-file-outcome/NominationFileOutcome';
import { NominationFileOutcomeSelector } from '@/components/secretariat-general/transparence/tableau-affectation-dossier-de-nomination/nomination-file-outcome/NominationFileOutcomeSelector';
import { ObservantsCell } from '@/components/secretariat-general/transparence/tableau-affectation-dossier-de-nomination/ObservantsCell';
import {
  ReadOnlyReportersCell,
  ReportersSelector
} from '@/components/secretariat-general/transparence/tableau-affectation-dossier-de-nomination/ReportersCell';
import { toFullName } from '@/components/shared/user-avatar/user-avatar.utils';
import { PrioriteEnum, PrioriteEnumLabels } from '@/types/enums.types';
import type { ListedCurrentlyAffectedReportersDto } from '@api/types';
import {
  getListCurrentlyAffectedReportersQueryOptions,
  type SessionNominationFile
} from '@queries/nomination-sessions.queries';

import { useNominationFilesTable } from './NominationFilesTableContext';

const h = createColumnHelper<SessionNominationFile>();
export const useNominationFilesTableColumns = () => {
  const { edition, sessionId } = useNominationFilesTable();

  return React.useMemo(
    () => [
      h.accessor('content.numeroDeDossier', {
        id: 'fileNumber',
        enableSorting: true,
        header: 'N°',
        sortDescFirst: true,
        cell: ({ cell }) => cell.getValue(),
        meta: { size: '10%' }
      }),

      h.accessor('content.nomMagistrat', {
        id: 'name',
        enableSorting: true,
        header: 'Magistrat',
        cell: ({ row }) => <MagistratDnModalLink nominationFile={row.original} />
      }),

      h.accessor('content.grade', {
        enableSorting: false,
        header: 'Grade actuel',
        cell: ({ cell }) => cell.getValue()
      }),

      h.accessor('content.posteCible', {
        enableSorting: false,
        header: 'Poste cible',
        cell: ({ cell }) => cell.getValue()
      }),

      h.accessor('content.gradeCible', {
        enableSorting: true,
        id: 'targetedGrade',
        header: 'Grade cible',
        cell: ({ cell }) => cell.getValue()
      }),

      h.accessor('content.observants', {
        enableSorting: false,
        header: 'Observant(s)',
        cell: ({ row }) => <ObservantsCell nominationFile={row.original} readOnly={!edition?.isEditing} />
      }),

      h.accessor('priority', {
        enableSorting: false,
        header: 'Priorité',
        cell: ({ cell, row }) => {
          const value = cell.getValue();

          if (edition?.isEditing) {
            return <DropdownPriorite dossierId={row.original.id} initialPriorite={value} />;
          }

          return value ? PrioriteEnumLabels[value] : '-';
        },

        meta: {
          filters: {
            filterId: 'priorities',
            type: 'enum',
            label: 'Priorités',
            emptyValue: { id: 'null', label: 'Aucune' },
            values: Object.values(PrioriteEnum).map((priorite) => ({
              id: priorite,
              label: PrioriteEnumLabels[priorite]
            }))
          }
        }
      }),

      h.accessor('reporters', {
        enableSorting: false,
        header: 'Rapporteur(s)',
        cell: ({ row }) => {
          if (edition?.isEditing) {
            return <ReportersSelector dossier={row.original} />;
          }

          return <ReadOnlyReportersCell dossier={row.original} />;
        },

        meta: {
          filters: {
            filterId: 'reporters',
            label: 'Rapporteur(s)',
            type: 'asyncList',
            emptyValue: { label: 'Aucun', id: 'null' },
            query: {
              ...getListCurrentlyAffectedReportersQueryOptions({ sessionId }),
              select: toListItems
            }
          }
        }
      }),

      h.accessor('content.outcome', {
        enableSorting: false,
        header: 'Issue',
        cell: ({ row }) => {
          if (edition?.isEditing) {
            return <NominationFileOutcomeSelector nominationFile={row.original} />;
          }

          return <NominationFileOutcome nominationFile={row.original} />;
        }
      })
    ],
    [sessionId, edition]
  );
};

function toListItems(data: ListedCurrentlyAffectedReportersDto) {
  return data.items.map(({ id, firstName, lastName }) => ({
    id,
    label: toFullName({ firstName, lastName })
  }));
}
