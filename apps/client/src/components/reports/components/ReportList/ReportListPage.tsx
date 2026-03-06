import { createColumnHelper } from '@tanstack/react-table';
import React, { type FC } from 'react';
import { generatePath, useParams } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';
import { useDetailedMemberGdsSession } from '@queries/members.queries';

import { useDataTable, useQueryDataTableState } from '@/components/shared/data-table';
import { ObservationLinks } from '@/components/shared/ObservationLinks';
import type { FormationEnum, GradeEnum, ReportStatusEnum } from '@/types/enums.types';
import type { DetailedMemberSessionDto } from '@api/types';
import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import { NominationFile } from 'shared-models';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import { gradeToLabel } from '../../labels/labels-mappers';
import { HeaderReportList } from './HeaderReportList';
import { ReportList } from './ReportList';
import { ReportListViewToggle } from './ReportListViewToggle';
import { ReportsDnVueGenerale } from './ReportsDnVueGenerale';
import { ReportStateTag } from './ReportStateTag';
import { useReportListFocus } from './useReportListFocus';

function useReportListColumns(sessionId: string) {
  return React.useMemo(() => {
    const h = createColumnHelper<DetailedMemberSessionDto['items'][number]>();
    return [
      h.accessor('folderNumber', {
        id: 'number',
        enableSorting: true,
        header: 'N°',
        cell: ({ getValue }) => getValue(),
        meta: { size: '10%' }
      }),

      h.accessor('name', {
        enableSorting: true,
        header: 'Magistrat',
        cell: ({ row }) => (
          <Button
            className="flex flex-col items-start text-left font-normal normal-case"
            style={{ color: colors.decisions.text.default.grey.default }}
            priority="tertiary no outline"
            size="small"
            linkProps={{
              to: generatePath(ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS, { id: row.original.id })
            }}
          >
            <div className="text-left leading-4 underline">{row.original.name}</div>
            {row.original.currentPosition ? (
              <span className="text-xs">{row.original.currentPosition}</span>
            ) : null}
          </Button>
        )
      }),

      h.accessor('grade', {
        enableSorting: false,
        header: 'Grade actuel',
        cell: ({ getValue }) => gradeToLabel(getValue() as GradeEnum),
        meta: { size: '10%' }
      }),

      h.accessor('targettedPosition', {
        enableSorting: true,
        id: 'targetedPosition',
        header: 'Poste cible',
        cell: ({ getValue }) => getValue() ?? '-'
      }),

      h.accessor('observations', {
        enableSorting: false,
        header: 'Observant(s)',
        cell: ({ row }) => (
          <ObservationLinks
            sessionId={sessionId}
            context="membre"
            nominationFile={{
              name: row.original.name,
              id: row.original.nominationFileId,
              observations: row.original.observations,
              legacyObservers: row.original.observers
            }}
          />
        )
      }),

      h.accessor('filePriority', {
        enableSorting: false,
        header: 'Priorité',
        cell: ({ getValue }) => getValue() ?? '-'
      }),

      h.accessor('state', {
        enableSorting: false,
        header: 'Statut',
        cell: ({ getValue }) => <ReportStateTag state={getValue() as ReportStatusEnum} />,
        meta: {
          size: '17%',
          filters: {
            type: 'enum',
            filterId: 'status',
            label: 'Statut',
            values: [
              { id: NominationFile.ReportState.NEW, label: 'Nouveau' },
              { id: NominationFile.ReportState.IN_PROGRESS, label: 'En cours' },
              { id: NominationFile.ReportState.READY_TO_SUPPORT, label: 'Prêt à soutenir' },
              { id: NominationFile.ReportState.SUPPORTED, label: 'Soutenu' }
            ]
          }
        }
      })
    ];
  }, [sessionId]);
}

export const ReportListPage: FC = () => {
  const { user } = useUser();
  const routeParams = useParams();
  const [focus] = useReportListFocus();

  const sessionId = routeParams.sessionId!;
  const columns = useReportListColumns(sessionId);
  const [tableState, setTableState] = useQueryDataTableState({
    pagination: { pageIndex: 0, pageSize: 50 },
    sorting: [] as [] | [{ id: 'number' | 'name' | 'targetedPosition'; desc: boolean }],
    columnFilters: [] as { id: 'status'; value: string[] }[]
  });

  const { data: detailedGdsSession, isPending: isGdsSessionPending } = useDetailedMemberGdsSession({
    sorting: tableState.sorting,
    pagination: tableState.pagination,
    status: tableState.columnFilters.find(({ id }) => id === 'status')?.value as NominationFile.ReportState[],

    sessionId: sessionId!,
    userId: user?.id
  });

  const table = useDataTable({
    columns,
    data: detailedGdsSession?.items,
    rowCount: detailedGdsSession?.totalCount,

    enableRowSelection: false,
    enableGlobalFilter: false,

    state: tableState,
    onStateChange: setTableState,

    meta: {
      paginationItemLabel: { one: 'rapport', other: 'rapports' }
    }
  });

  const onChange = React.useCallback(() => {
    setTableState((state) => ({
      ...state,
      sorting: [],
      columnFilters: [],
      pagination: { pageIndex: 0, pageSize: 50 }
    }));
  }, [setTableState]);

  if (isGdsSessionPending || !detailedGdsSession) return null;

  return (
    <PageContentLayout>
      <HeaderReportList
        formation={detailedGdsSession.session.formation as FormationEnum}
        transparency={detailedGdsSession.session.transparency}
        dateTransparence={detailedGdsSession.session.dateTransparence}
        dueDate={detailedGdsSession.session.dateSeance}
      />

      {focus === 'general' ? (
        <ReportsDnVueGenerale
          sessionId={detailedGdsSession.session.id}
          formation={detailedGdsSession.session.formation as FormationEnum}
        >
          <ReportListViewToggle />
        </ReportsDnVueGenerale>
      ) : (
        <ReportList sessionId={detailedGdsSession.session.id} table={table}>
          <ReportListViewToggle onChange={onChange} />
        </ReportList>
      )}
    </PageContentLayout>
  );
};
export default ReportListPage;
