import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, type PropsWithChildren, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { SessionOutcome } from '../context/files-table.context';
import { MemberReportsProvider } from '../context/MemberReportsProvider';
import { NominationFilesTableProvider } from '../context/NominationFilesTableProvider';
import { useSessionFilesFilters } from '../hooks/useSessionFilesFilters';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import { TotalBadge } from '@/shared/ui/total-badge';
import type { FormationEnum } from '@/types/enums.types';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { SidePanelTrigger } from './cells/magistrat-side-panel/components/SidePanelTrigger';
import { MemberReportStateCell } from './cells/MemberReportStateCell';
import { NominationFileOutcome } from './cells/nomination-file-outcome/NominationFileOutcome';
import { ObservantsCell } from './cells/observations/ObservantsCell';
import { ReportersCell } from './cells/reporters/ReportersCell';
import { NominationFileTargetPositionCell } from './cells/targeted-position/NominationFileTargetPositionCell';
import { SessionFilesTable } from './SessionFilesTable';

const h = createColumnHelper<SessionNominationFile>();

function useMemberSessionFilesColumns() {
  const { formatMessage } = useIntl();
  const filters = useSessionFilesFilters();

  return useMemo(
    () => [
      h.accessor('content.numeroDeDossier', {
        id: 'fileNumber',
        cell: ({ cell }) => cell.getValue(),
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'N°' }),
        size: 42,
        sortDescFirst: true,
      }),

      h.accessor('reporters', {
        cell: ({ row }) => <ReportersCell dossier={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Rapporteur(s)' }),
        meta: { filters: filters.reporters },
        size: 130,
      }),

      h.accessor('content.nomMagistrat', {
        id: 'name',
        cell: ({ row }) => <SidePanelTrigger nominationFile={row.original} />,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Magistrat' }),
        size: 250,
      }),

      h.accessor('content.posteCible', {
        id: 'targetedGrade',
        cell: ({ row }) => <NominationFileTargetPositionCell nominationFile={row.original} />,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Poste cible' }),
        size: 240,
        sortDescFirst: true,
      }),

      h.accessor('content.observants', {
        cell: ({ row }) => <ObservantsCell nominationFile={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Observant(s)' }),
        size: 170,
      }),

      h.accessor('priorities', {
        cell: ({ row }) => <PriorityBadgeList priorities={row.original.priorities} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Priorité(s)' }),
        meta: { filters: filters.priorities },
        size: 110,
      }),

      h.display({
        id: 'state',
        cell: ({ row }) => <MemberReportStateCell nominationFileId={row.original.id} />,
        header: formatMessage({ defaultMessage: 'Statut' }),
        size: 120,
      }),

      h.accessor('content.outcome', {
        cell: ({ row }) => <NominationFileOutcome nominationFile={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Issue' }),
        meta: { filters: filters.outcomes },
        size: 80,
      }),
    ],
    [filters, formatMessage],
  );
}

function MemberSessionFilesTableInner(props: PropsWithChildren<{ filtersEnd?: ReactNode }>) {
  const columns = useMemberSessionFilesColumns();

  return (
    <SessionFilesTable
      columns={columns}
      filtersEnd={props.filtersEnd}
      summary={({ totalCount }) => (
        <TotalBadge value={totalCount}>
          <FormattedMessage defaultMessage="Total" />
        </TotalBadge>
      )}
    >
      {props.children}
    </SessionFilesTable>
  );
}

export function MemberSessionFilesTable(
  props: PropsWithChildren<{
    filtersEnd?: ReactNode;
    formation: FormationEnum;
    outcomes: readonly SessionOutcome[];
    sessionId: string;
  }>,
) {
  return (
    <NominationFilesTableProvider {...props} canManage={false}>
      <MemberReportsProvider>
        <MemberSessionFilesTableInner filtersEnd={props.filtersEnd}>
          {props.children}
        </MemberSessionFilesTableInner>
      </MemberReportsProvider>
    </NominationFilesTableProvider>
  );
}
