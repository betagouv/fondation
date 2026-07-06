import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import { createColumnHelper } from '@tanstack/react-table';
import React, { type FC } from 'react';
import { defineMessage } from 'react-intl';
import { generatePath, useParams } from 'react-router';

import { ObservationLinks } from '@/features/observations/components/ObservationLinks';
import { HeaderReportList } from '@/features/reports/components/HeaderReportList';
import { ReportList } from '@/features/reports/components/ReportList';
import { ReportListViewToggle } from '@/features/reports/components/ReportListViewToggle';
import { ReportsDnVueGenerale } from '@/features/reports/components/ReportsDnVueGenerale';
import { ReportStateTag } from '@/features/reports/components/ReportStateTag';
import { useReportListFocus } from '@/features/reports/hooks/useReportListFocus';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import { useDataTable, useQueryDataTableState } from '@/shared/ui/data-table';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import {
  PrioriteEnum,
  PrioriteEnumLabels,
  type FormationEnum,
  type ReportStatusEnum,
} from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedMemberSessionDto } from '@api/types';
import { useUser } from '@queries/auth.queries';
import { useDetailedMemberGdsSession } from '@queries/members.queries';

function useReportListColumns(sessionId: string) {
  return React.useMemo(() => {
    const h = createColumnHelper<DetailedMemberSessionDto['items'][number]>();
    return [
      h.accessor('folderNumber', {
        id: 'fileNumber',
        enableSorting: true,
        header: 'N°',
        cell: ({ getValue }) => getValue(),
        meta: { size: '10%' },
      }),

      h.accessor('name', {
        enableSorting: true,
        header: 'Magistrat',
        cell: ({ row }) => (
          <Button
            className="flex flex-col! items-start! text-left! font-normal! normal-case!"
            style={{ color: colors.decisions.text.default.grey.default }}
            priority="tertiary no outline"
            size="small"
            linkProps={{
              to: generatePath(ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS, { id: row.original.id }),
            }}
          >
            <div className="text-left leading-4 underline">{row.original.name}</div>
            {row.original.currentPosition ? (
              <span className="text-xs">{row.original.currentPosition}</span>
            ) : null}
          </Button>
        ),
      }),

      h.accessor('grade', {
        enableSorting: false,
        header: 'Grade actuel',
        cell: ({ getValue }) => getValue(),
        meta: { size: '10%' },
      }),

      h.accessor('targettedPosition', {
        id: 'targetedPosition',
        enableSorting: false,
        header: 'Poste cible',
        cell: ({ getValue }) => getValue() ?? '-',
      }),

      h.accessor('targetedGrade', {
        enableSorting: true,
        header: 'Grade cible',
        cell: ({ getValue }) => getValue(),
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
              legacyObservers: [],
            }}
          />
        ),
      }),

      h.accessor('priorities', {
        enableSorting: false,
        header: 'Priorité(s)',
        cell: ({ getValue }) => <PriorityBadgeList priorities={getValue()} />,
        meta: {
          filters: {
            type: 'enum',
            filterId: 'priorities',
            label: 'Priorités',
            values: [{ id: 'null', label: 'Aucune' }].concat(
              ([PrioriteEnum.ETOILE, PrioriteEnum.OUTRE_MER, PrioriteEnum.PROFILE] as const).map((id) => ({
                id,
                label: PrioriteEnumLabels[id],
              })),
            ),
          },
        },
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
              { id: 'NEW' satisfies ReportStatusEnum, label: 'Nouveau' },
              { id: 'IN_PROGRESS' satisfies ReportStatusEnum, label: 'En cours' },
              { id: 'READY_TO_SUPPORT' satisfies ReportStatusEnum, label: 'Prêt à soutenir' },
              { id: 'SUPPORTED' satisfies ReportStatusEnum, label: 'Soutenu' },
            ],
          },
        },
      }),
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
    sorting: [] as [] | [{ id: 'fileNumber' | 'name' | 'targetedPosition' | 'targetedGrade'; desc: boolean }],
    columnFilters: [] as (
      | { id: 'status'; value: string[] }
      | { id: 'priorities'; value: (PrioriteEnum | 'null')[] }
    )[],
  });

  const { data: detailedGdsSession, isPending: isGdsSessionPending } = useDetailedMemberGdsSession({
    sorting: tableState.sorting,
    pagination: tableState.pagination,
    status: tableState.columnFilters.find(({ id }) => id === 'status')?.value as ReportStatusEnum[],
    priorities: tableState.columnFilters.find(({ id }) => id === 'priorities')
      ?.value as (PrioriteEnum | null)[],

    sessionId: sessionId!,
    userId: user?.id,
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
      paginationItemLabel: defineMessage({
        defaultMessage: `{count, plural, one {rapport} other {rapports}}`,
      }),
    },
  });

  const onChange = React.useCallback(() => {
    setTableState((state) => ({
      ...state,
      sorting: [],
      columnFilters: [],
      pagination: { pageIndex: 0, pageSize: 50 },
    }));
  }, [setTableState]);

  if (isGdsSessionPending || !detailedGdsSession) return null;

  return (
    <ArchiveBannerPortal isArchived={detailedGdsSession.session.isArchived}>
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
    </ArchiveBannerPortal>
  );
};
export default ReportListPage;
