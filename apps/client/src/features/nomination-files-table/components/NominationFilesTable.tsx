import type { Row } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, type PropsWithChildren } from 'react';

import './NominationFilesTable.css';

import { defineMessage } from 'react-intl';

import { useNominationFilesTable, type SessionOutcome } from '../context/files-table.context';
import { FilesAffectationsProvider } from '../context/FilesAffectationsProvider';
import { FilesSelectionProvider } from '../context/FilesSelectionProvider';
import { NominationFilesTableProvider } from '../context/NominationFilesTableProvider';
import { useNominationFilesTableColumns } from '../hooks/useNominationFilesTableColumns.hook';
import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { AlertsProvider } from '@/shared/context/alerts';
import { DataTable, useDataTable, useQueryDataTableState } from '@/shared/ui/data-table';
import type { FormationEnum, NominationFileOutcomeEnum, PrioriteEnum } from '@/types/enums.types';
import {
  useSessionNominationFilesQuery,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import { MagistratSidePanel } from './cells/magistrat-side-panel/components/MagistratSidePanel';
import { SidePanelProvider } from './cells/magistrat-side-panel/context/SidePanelProvider';
import { NominationFileOutcomeCommentModalProvider } from './cells/nomination-file-outcome/NominationFileOutcomeCommentModalProvider';
import { ObservationsModalProvider } from './cells/observations/context/ObservationsModalProvider';
import { NominationFileTargetPositionProvider } from './cells/targeted-position/NominationFileTargetPositionProvider';
import { NominationFilesTableActionsBar } from './NominationFilesActionsBar';
import { NominationFilesAffectationsStatus } from './NominationFilesAffectationsStatus';
import { NominationFilesStatusBadges } from './NominationFilesStatusBadges';

function NominationFilesTableInner(props: PropsWithChildren) {
  const isSg = useIsSgNavigation();

  const { sessionId, edition } = useNominationFilesTable();
  const columns = useNominationFilesTableColumns();
  const [tableState, setTableState] = useQueryDataTableState({
    globalFilter: '',
    pagination: { pageIndex: 0, pageSize: 50 },
    sorting: [] as [] | [{ id: 'fileNumber' | 'name' | 'targetedGrade'; desc: boolean }],
    columnFilters: [] as { id: 'priorities' | 'reporters' | 'outcomes'; value: string[] }[],
    rowSelection: {},
  });

  useEffect(() => {
    if (!edition?.isEditing && Object.keys(tableState.rowSelection).length > 0) {
      setTableState((state) => ({ ...state, rowSelection: {} }));
    }
  }, [tableState, setTableState, edition]);

  const { data, isLoading, isFetching } = useSessionNominationFilesQuery({
    sessionId,
    sorting: tableState.sorting,
    pagination: tableState.pagination,
    filters: {
      search: tableState.globalFilter,
      priorities: tableState.columnFilters.find(({ id }) => id === 'priorities')?.value as PrioriteEnum[],
      reporterIds: tableState.columnFilters.find(({ id }) => id === 'reporters')?.value as string[],
      outcomes: tableState.columnFilters.find(({ id }) => id === 'outcomes')
        ?.value as (NominationFileOutcomeEnum | null)[],
    },
  });
  const nominationFiles = useMemo(() => data?.items ?? [], [data]);
  const onPageChange = useCallback(
    (pageIndex: number) =>
      setTableState((state) => ({ ...state, pagination: { ...state.pagination, pageIndex } })),
    [setTableState],
  );
  const enableRowSelection = useMemo(
    () => !!edition?.isEditing && ((row: Row<SessionNominationFile>) => row.original.content.isUpdatable),
    [edition],
  );

  const table = useDataTable({
    columns,
    data: nominationFiles,
    rowCount: data?.totalCount,
    getRowId: (row) => row.id,
    enableRowSelection,
    state: tableState,
    onStateChange: setTableState,
    enableGlobalFilter: true,
    meta: {
      globalFilterPlaceholder: defineMessage({ defaultMessage: `Filtrer par nom` }),
      paginationItemLabel: isSg
        ? defineMessage({
            defaultMessage: '{count, plural, one {proposition} other {propositions}}',
          })
        : defineMessage({ defaultMessage: '{count, plural, one {dossier} other {dossiers}}' }),
    },
  });

  return (
    <ObservationsModalProvider>
      <SidePanelProvider
        isFetching={isFetching}
        nominationFiles={nominationFiles}
        onPageChange={onPageChange}
        pagination={tableState.pagination}
        totalCount={data?.totalCount ?? 0}
      >
        <NominationFileOutcomeCommentModalProvider>
          <NominationFileTargetPositionProvider sessionId={sessionId}>
            <MagistratSidePanel sessionId={sessionId} />
            <FilesSelectionProvider files={nominationFiles} selection={tableState.rowSelection}>
              <FilesAffectationsProvider files={nominationFiles}>
                <AlertsProvider>
                  <div className="fr-container fr-mb-4v flex flex-col gap-y-4">
                    <div className="self-center">
                      <AlertsProvider.Alerts className="shrink-0" small />
                    </div>

                    {isSg ? (
                      <div className="flex items-center">
                        <NominationFilesAffectationsStatus />
                        <NominationFilesStatusBadges className="fr-ml-4v fr-pl-4v border-y-0 border-r-0 border-l border-solid border-l-gray-200" />
                      </div>
                    ) : null}
                  </div>

                  <DataTable
                    classNames={{
                      filters:
                        'max-w-screen-full xl:max-w-(--breakpoint-xl) 2xl:max-w-(--breakpoint-2xl) mx-auto',
                      content:
                        'max-w-screen-full xl:max-w-(--breakpoint-xl) 2xl:max-w-(--breakpoint-2xl) mx-auto',
                    }}
                    placeholder={
                      isLoading ? 'Chargement...' : 'Aucun résultat ne correspond aux valeurs filtrées'
                    }
                    table={table}
                  >
                    {props.children}

                    <NominationFilesTableActionsBar />
                  </DataTable>
                </AlertsProvider>
              </FilesAffectationsProvider>
            </FilesSelectionProvider>
          </NominationFileTargetPositionProvider>
        </NominationFileOutcomeCommentModalProvider>
      </SidePanelProvider>
    </ObservationsModalProvider>
  );
}

export function NominationFilesTable(
  props: PropsWithChildren<{
    formation: FormationEnum;
    isEditable?: boolean;
    outcomes: readonly SessionOutcome[];
    sessionId: string;
  }>,
) {
  return (
    <NominationFilesTableProvider {...props}>
      <NominationFilesTableInner>{props.children}</NominationFilesTableInner>
    </NominationFilesTableProvider>
  );
}
