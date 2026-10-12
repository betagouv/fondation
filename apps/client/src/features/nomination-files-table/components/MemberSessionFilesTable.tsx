import { createColumnHelper } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import { useMemo, type PropsWithChildren, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useNominationFilesTable, type SessionOutcome } from '../context/files-table.context';
import { useMemberReports } from '../context/member-reports.context';
import { MemberReportsProvider } from '../context/MemberReportsProvider';
import { NominationFilesTableProvider } from '../context/NominationFilesTableProvider';
import { useSessionFilesFilters } from '../hooks/useSessionFilesFilters';
import { useSessionFilesTable } from '../hooks/useSessionFilesTable';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import type { FormationEnum } from '@/shared/enums/formation.enum';
import { TotalBadge } from '@/shared/ui/total-badge';
import { SIDE_PANEL_DOSSIER_PARAM } from '@/utils/route-path.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { SidePanelTrigger } from './cells/magistrat-side-panel/components/SidePanelTrigger';
import { MemberReportStateCell } from './cells/MemberReportStateCell';
import { NominationFileOutcome } from './cells/nomination-file-outcome/NominationFileOutcome';
import { ObservantsCell } from './cells/ObservantsCell';
import { ReportersCell } from './cells/reporters/ReportersCell';
import { NominationFileTargetPositionCell } from './cells/targeted-position/NominationFileTargetPositionCell';
import { SessionFilesTable } from './SessionFilesTable';

const h = createColumnHelper<SessionNominationFile>();

const COLUMNS_HIDDEN_BESIDE_SIDE_PANEL = {
  observants: false,
  outcome: false,
  priorities: false,
  state: false,
};

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
        id: 'observants',
        cell: ({ row }) => <ObservantsCell nominationFile={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Observant(s)' }),
        size: 170,
      }),

      h.accessor('priorities', {
        id: 'priorities',
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
        id: 'outcome',
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

function MemberSessionFilesTableInner(
  props: PropsWithChildren<{
    filtersEnd?: ReactNode;
    filtersSlot?: Element | null;
    scrollsWithPage?: boolean;
    toolbarSlot?: Element | null;
  }>,
) {
  const { sessionId } = useNominationFilesTable();
  const [openedDossier] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);
  const columns = useMemberSessionFilesColumns();
  const filesTable = useSessionFilesTable({
    columns,
    columnVisibility: openedDossier ? COLUMNS_HIDDEN_BESIDE_SIDE_PANEL : undefined,
    sessionId,
  });
  const memberReports = useMemberReports();

  return (
    <SessionFilesTable
      filesTable={filesTable}
      filtersEnd={props.filtersEnd}
      filtersSlot={props.filtersSlot}
      narrowsBesideSidePanel
      scrollsWithPage={props.scrollsWithPage}
      summary={
        <div className="flex items-center gap-6">
          <TotalBadge value={filesTable.totalCount}>
            <FormattedMessage defaultMessage="Total" />
          </TotalBadge>
          <TotalBadge value={memberReports.assignedFilesCount}>
            <FormattedMessage defaultMessage="Mes dossiers" />
          </TotalBadge>
        </div>
      }
      toolbarSlot={props.toolbarSlot}
    >
      {props.children}
    </SessionFilesTable>
  );
}

export function MemberSessionFilesTable(
  props: PropsWithChildren<{
    filtersEnd?: ReactNode;
    filtersSlot?: Element | null;
    formation: FormationEnum;
    outcomes: readonly SessionOutcome[];
    scrollsWithPage?: boolean;
    sessionId: string;
    toolbarSlot?: Element | null;
  }>,
) {
  return (
    <NominationFilesTableProvider {...props} canManage={false}>
      <MemberReportsProvider>
        <MemberSessionFilesTableInner
          filtersEnd={props.filtersEnd}
          filtersSlot={props.filtersSlot}
          scrollsWithPage={props.scrollsWithPage}
          toolbarSlot={props.toolbarSlot}
        >
          {props.children}
        </MemberSessionFilesTableInner>
      </MemberReportsProvider>
    </NominationFilesTableProvider>
  );
}
