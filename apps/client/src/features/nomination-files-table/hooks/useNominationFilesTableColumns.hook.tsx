import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { SidePanelTrigger } from '../components/cells/magistrat-side-panel/components/SidePanelTrigger';
import { NominationFilesOutcomeCell } from '../components/cells/nomination-file-outcome/NominationFilesOutcomeCell';
import { NominationFilesPriorityCell } from '../components/cells/NominationFilesPriorityCell';
import { ObservantsCell } from '../components/cells/observations/ObservantsCell';
import { ReportersCell } from '../components/cells/reporters/ReportersCell';
import { NominationFileTargetPositionCell } from '../components/cells/targeted-position/NominationFileTargetPositionCell';
import { useNominationFilesTable } from '../context/files-table.context';
import { PrioriteEnum, PrioriteEnumLabels } from '@/types/enums.types';
import { memberFullName } from '@/utils/user.utils';
import type { ListedCurrentlyAffectedReportersDto } from '@api/types';
import {
  getListCurrentlyAffectedReportersQueryOptions,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

const h = createColumnHelper<SessionNominationFile>();
export const useNominationFilesTableColumns = () => {
  const { formatMessage } = useIntl();
  const { sessionId, outcomes } = useNominationFilesTable();

  return useMemo(
    () => [
      h.accessor('content.numeroDeDossier', {
        id: 'fileNumber',
        cell: ({ cell }) => cell.getValue(),
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'N°' }),
        meta: { size: '10%' },
        sortDescFirst: true,
      }),

      h.accessor('content.nomMagistrat', {
        id: 'name',
        cell: ({ row }) => <SidePanelTrigger nominationFile={row.original} />,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Magistrat' }),
      }),

      h.accessor('content.grade', {
        cell: ({ cell }) => cell.getValue(),
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Grade actuel' }),
      }),

      h.accessor('content.posteCible', {
        cell: ({ row }) => <NominationFileTargetPositionCell nominationFile={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Poste cible' }),
      }),

      h.accessor('content.gradeCible', {
        id: 'targetedGrade',
        cell: ({ cell }) => cell.getValue(),
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Grade cible' }),
        sortDescFirst: true,
      }),

      h.accessor('content.observants', {
        cell: ({ row }) => <ObservantsCell nominationFile={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Observant(s)' }),
      }),

      h.accessor('priorities', {
        cell: ({ row }) => <NominationFilesPriorityCell nominationFile={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Priorité(s)' }),
        meta: {
          filters: {
            emptyValue: { id: 'null', label: formatMessage({ defaultMessage: 'Aucune' }) },
            filterId: 'priorities',
            label: formatMessage({ defaultMessage: 'Priorités' }),
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
        header: formatMessage({ defaultMessage: 'Rapporteur(s)' }),
        meta: {
          filters: {
            emptyValue: { id: 'null', label: formatMessage({ defaultMessage: 'Aucun' }) },
            filterId: 'reporters',
            label: formatMessage({ defaultMessage: 'Rapporteur(s)' }),
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
        header: formatMessage({ defaultMessage: 'Issue' }),
        meta: {
          filters: {
            filterId: 'outcomes',
            label: formatMessage({ defaultMessage: 'Issue(s)' }),
            type: 'enum',
            values: [{ id: 'null', label: formatMessage({ defaultMessage: 'Aucune' }) }].concat(
              outcomes.map(({ value, label }) => ({
                id: value,
                label: label[0].toUpperCase() + label.slice(1),
              })),
            ),
          },
        },
      }),
    ],
    [formatMessage, outcomes, sessionId],
  );
};

function toListItems(data: ListedCurrentlyAffectedReportersDto) {
  return data.items.map(({ id, firstName, lastName }) => ({
    id,
    label: memberFullName({ firstName, lastName }),
  }));
}
