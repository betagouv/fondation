import React from 'react';

import { AlertsProvider } from '@/components/shared/alerts/AlertsProvider';
import type { FormationEnum, PrioriteEnum } from '@/types/enums.types';
import { useSessionNominationFilesQuery } from '@queries/nomination-sessions.queries';

import { DataTable, useDataTable, useQueryDataTableState } from '@/components/shared/data-table';

import { useNominationFilesTable } from './contexts/files-table.context';
import { useNominationFilesTableColumns } from './useNominationFilesTableColumns.hook';

import { useIsSgNavigation } from '@/hooks/roles.hook';
import { MagistratModaleProvider } from './components/cells/magistrat-details/MagistratDnModale';
import { NominationFileOutcomeCommentModalProvider } from './components/cells/nomination-file-outcome/NominationFileOutcomeCommentModalProvider';
import { ObservationsModalProvider } from './components/cells/observations/ObservationsModalContext';
import { NominationFilesTableActionsBar } from './components/NominationFilesActionsBar';
import { NominationFilesAffectationsStatus } from './components/NominationFilesAffectationsStatus';
import { FilesAffectationsProvider } from './contexts/FilesAffectationsProvider';
import { FilesSelectionProvider } from './contexts/FilesSelectionProvider';
import { NominationFilesTableProvider } from './contexts/NominationFilesTableProvider';

function NominationFilesTableInner(props: React.PropsWithChildren) {
  const isSg = useIsSgNavigation();

  const { sessionId, formation, edition } = useNominationFilesTable();
  const columns = useNominationFilesTableColumns();
  const [tableState, setTableState] = useQueryDataTableState({
    globalFilter: '',
    pagination: { pageIndex: 0, pageSize: 50 },
    sorting: [] as [] | [{ id: 'fileNumber' | 'name' | 'targetedGrade'; desc: boolean }],
    columnFilters: [] as { id: 'priorities' | 'reporters'; value: string[] }[],
    rowSelection: {}
  });

  React.useEffect(() => {
    if (!edition?.isEditing && Object.keys(tableState.rowSelection).length > 0) {
      setTableState((state) => ({ ...state, rowSelection: {} }));
    }
  }, [tableState, setTableState, edition]);

  const { data, isLoading } = useSessionNominationFilesQuery({
    sessionId,
    sorting: tableState.sorting,
    pagination: tableState.pagination,
    filters: {
      priorities: tableState.columnFilters.find(({ id }) => id === 'priorities')?.value as PrioriteEnum[],
      reporterIds: tableState.columnFilters.find(({ id }) => id === 'reporters')?.value as string[]
    }
  });
  const nominationFiles = React.useMemo(() => data?.items ?? [], [data]);

  const table = useDataTable({
    columns,
    data: nominationFiles,
    rowCount: data?.totalCount,
    getRowId: (row) => row.id,
    enableRowSelection: !!edition?.isEditing && ((row) => !row.original.content.outcome),
    state: tableState,
    onStateChange: setTableState,
    meta: {
      paginationItemLabel: isSg
        ? { one: 'proposition', other: 'propositions' }
        : { one: 'dossier', other: 'dossiers' }
    }
  });

  return (
    <ObservationsModalProvider>
      <MagistratModaleProvider nominationFiles={nominationFiles} sessionId={sessionId}>
        <NominationFileOutcomeCommentModalProvider formation={formation}>
          <FilesSelectionProvider selection={tableState.rowSelection}>
            <FilesAffectationsProvider files={nominationFiles}>
              <AlertsProvider>
                <div className="fr-container flex items-end justify-between">
                  <NominationFilesAffectationsStatus />

                  <AlertsProvider.Alerts small className="my-3 flex-shrink-0" />
                </div>

                <DataTable
                  classNames={{
                    content: 'max-w-screen-full xl:max-w-screen-xl 2xl:max-w-screen-2xl mx-auto'
                  }}
                  table={table}
                  placeholder={
                    isLoading ? 'Chargement...' : 'Aucun résultat ne correspond aux valeurs filtrées'
                  }
                >
                  {props.children}

                  <NominationFilesTableActionsBar />
                </DataTable>
              </AlertsProvider>
            </FilesAffectationsProvider>
          </FilesSelectionProvider>
        </NominationFileOutcomeCommentModalProvider>
      </MagistratModaleProvider>
    </ObservationsModalProvider>
  );
}

export function NominationFilesTable(
  props: React.PropsWithChildren<{
    isEditable?: false;
    sessionId: string;
    formation: FormationEnum;
  }>
) {
  return (
    <NominationFilesTableProvider {...props}>
      <NominationFilesTableInner>{props.children}</NominationFilesTableInner>
    </NominationFilesTableProvider>
  );
}
