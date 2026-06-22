import { createColumnHelper } from '@tanstack/react-table';
import React from 'react';

import { MagistratPanelTrigger } from '../components/cells/magistrat-side-panel/components/MagistratPanelTrigger';
import { useSortedNominationFileOutcomes } from '../components/cells/nomination-file-outcome/nomination-file-outcome-badge.utils';
import { NominationFilesOutcomeCell } from '../components/cells/nomination-file-outcome/NominationFilesOutcomeCell';
import { NominationFilesPriorityCell } from '../components/cells/NominationFilesPriorityCell';
import { ObservantsCell } from '../components/cells/observations/ObservantsCell';
import { ReportersCell } from '../components/cells/reporters/ReportersCell';
import { NominationFileTargetPositionCell } from '../components/cells/targeted-position/NominationFileTargetPositionCell';
import { useNominationFilesTable } from '../context/files-table.context';
import { outcomeLabel, PrioriteEnum, PrioriteEnumLabels } from '@/types/enums.types';
import { toFullName } from '@/utils/user.utils';
import type { ListedCurrentlyAffectedReportersDto } from '@api/types';
import {
  getListCurrentlyAffectedReportersQueryOptions,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

const h = createColumnHelper<SessionNominationFile>();
export const useNominationFilesTableColumns = () => {
  const { sessionId, formation } = useNominationFilesTable();
  const outcomes = useSortedNominationFileOutcomes();

  return React.useMemo(
    () => [
      h.accessor('content.numeroDeDossier', {
        id: 'fileNumber',
        cell: ({ cell }) => cell.getValue(),
        enableSorting: true,
        header: 'N°',
        meta: { size: '10%' },
        sortDescFirst: true,
      }),

      h.accessor('content.nomMagistrat', {
        id: 'name',
        cell: ({ row }) => <MagistratPanelTrigger nominationFile={row.original} />,
        enableSorting: true,
        header: 'Magistrat',
      }),

      h.accessor('content.grade', {
        cell: ({ cell }) => cell.getValue(),
        enableSorting: false,
        header: 'Grade actuel',
      }),

      h.accessor('content.posteCible', {
        cell: ({ row }) => <NominationFileTargetPositionCell nominationFile={row.original} />,
        enableSorting: false,
        header: 'Poste cible',
      }),

      h.accessor('content.gradeCible', {
        id: 'targetedGrade',
        cell: ({ cell }) => cell.getValue(),
        enableSorting: true,
        header: 'Grade cible',
        sortDescFirst: true,
      }),

      h.accessor('content.observants', {
        cell: ({ row }) => <ObservantsCell nominationFile={row.original} />,
        enableSorting: false,
        header: 'Observant(s)',
      }),

      h.accessor('priorities', {
        cell: ({ row }) => <NominationFilesPriorityCell nominationFile={row.original} />,
        enableSorting: false,
        header: 'Priorité(s)',
        meta: {
          filters: {
            emptyValue: { id: 'null', label: 'Aucune' },
            filterId: 'priorities',
            label: 'Priorités',
            type: 'enum',
            values: Object.values(PrioriteEnum).map((priorite) => ({
              id: priorite,
              label: PrioriteEnumLabels[priorite],
            })),
          },
        },
      }),

      h.accessor('reporters', {
        cell: ({ row }) => <ReportersCell dossier={row.original} />,
        enableSorting: false,
        header: 'Rapporteur(s)',
        meta: {
          filters: {
            emptyValue: { id: 'null', label: 'Aucun' },
            filterId: 'reporters',
            label: 'Rapporteur(s)',
            query: {
              ...getListCurrentlyAffectedReportersQueryOptions({ sessionId }),
              select: toListItems,
            },
            type: 'asyncList',
          },
        },
      }),

      h.accessor('content.outcome', {
        cell: ({ row }) => <NominationFilesOutcomeCell nominationFile={row.original} />,
        enableSorting: false,
        header: 'Issue',
        meta: {
          filters: {
            filterId: 'outcomes',
            label: 'Issue(s)',
            type: 'enum',
            values: [{ id: 'null', label: 'Aucune' }].concat(
              outcomes.map((value) => {
                let label = outcomeLabel({ formation, value });
                label = label[0].toUpperCase() + label.slice(1);

                return { id: value, label };
              }),
            ),
          },
        },
      }),
    ],
    [formation, outcomes, sessionId],
  );
};

function toListItems(data: ListedCurrentlyAffectedReportersDto) {
  return data.items.map(({ id, firstName, lastName }) => ({
    id,
    label: toFullName({ firstName, lastName }),
  }));
}
