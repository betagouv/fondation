import { createColumnHelper } from '@tanstack/react-table';
import React from 'react';

import { PrioriteEnum, PrioriteEnumLabels } from '@/types/enums.types';
import type { ListedCurrentlyAffectedReportersDto } from '@api/types';
import {
  getListCurrentlyAffectedReportersQueryOptions,
  type SessionNominationFile
} from '@queries/nomination-sessions.queries';

import { useNominationFilesTable } from './contexts/files-table.context';

import { toFullName } from '@/utils/user.utils';
import { MagistratDnModalLink } from './components/cells/magistrat-details/MagistratDnModale';
import { NominationFilesOutcomeCell } from './components/cells/nomination-file-outcome/NominationFilesOutcomeCell';
import { NominationFilesPriorityCell } from './components/cells/NominationFilesPriorityCell';
import { ObservantsCell } from './components/cells/observations/ObservantsCell';
import { ReportersCell } from './components/cells/reporters/ReportersCell';
import { NominationFileTargetPositionCell } from './components/cells/targeted-position/NominationFileTargetPositionCell';

const h = createColumnHelper<SessionNominationFile>();
export const useNominationFilesTableColumns = () => {
  const { sessionId } = useNominationFilesTable();

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
        cell: ({ row }) => <NominationFileTargetPositionCell nominationFile={row.original} />
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
        cell: ({ row }) => <ObservantsCell nominationFile={row.original} />
      }),

      h.accessor('priority', {
        enableSorting: false,
        header: 'Priorité',
        cell: ({ row }) => <NominationFilesPriorityCell nominationFile={row.original} />,

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
        cell: ({ row }) => <ReportersCell dossier={row.original} />,

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
        cell: ({ row }) => <NominationFilesOutcomeCell nominationFile={row.original} />
      })
    ],
    [sessionId]
  );
};

function toListItems(data: ListedCurrentlyAffectedReportersDto) {
  return data.items.map(({ id, firstName, lastName }) => ({
    id,
    label: toFullName({ firstName, lastName })
  }));
}
