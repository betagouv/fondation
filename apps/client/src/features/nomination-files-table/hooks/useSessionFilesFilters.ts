import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import type { TableMetaFilterAsyncList, TableMetaFilterEnum } from '@/tanstack-react-table';
import { PrioriteEnum, PrioriteEnumLabels } from '@/types/enums.types';
import { memberFullName } from '@/utils/user.utils';
import type { ListedCurrentlyAffectedReportersDto } from '@api/types';
import { getListCurrentlyAffectedReportersQueryOptions } from '@queries/nomination-sessions.queries';

export function useSessionFilesFilters(): {
  outcomes: TableMetaFilterEnum;
  priorities: TableMetaFilterEnum;
  reporters: TableMetaFilterAsyncList;
} {
  const { formatMessage } = useIntl();
  const { outcomes, sessionId } = useNominationFilesTable();

  return useMemo(
    () => ({
      outcomes: {
        filterId: 'outcomes',
        label: formatMessage({ defaultMessage: 'Issue(s)' }),
        type: 'enum',
        values: [{ id: 'null', label: formatMessage({ defaultMessage: 'Aucune' }) }].concat(
          outcomes.map(({ value, label }) => ({
            id: value,
            label: label.charAt(0).toUpperCase() + label.slice(1),
          })),
        ),
      },
      priorities: {
        emptyValue: { id: 'null', label: formatMessage({ defaultMessage: 'Aucune' }) },
        filterId: 'priorities',
        label: formatMessage({ defaultMessage: 'Priorité(s)' }),
        type: 'enum',
        values: Object.values(PrioriteEnum).map((priorite) => ({
          id: priorite,
          label: PrioriteEnumLabels[priorite],
        })),
      },
      reporters: {
        emptyValue: { id: 'null', label: formatMessage({ defaultMessage: 'Aucun' }) },
        filterId: 'reporters',
        label: formatMessage({ defaultMessage: 'Rapporteur(s)' }),
        query: {
          ...getListCurrentlyAffectedReportersQueryOptions({ sessionId }),
          select: toListItems,
        },
        type: 'asyncList',
      },
    }),
    [formatMessage, outcomes, sessionId],
  );
}

function toListItems(data: ListedCurrentlyAffectedReportersDto) {
  return data.items.map(({ id, firstName, lastName }) => ({
    id,
    label: memberFullName({ firstName, lastName }),
  }));
}
