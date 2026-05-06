import './NominationFilesTable.css';
import React from 'react';
import { defineMessage } from 'react-intl';

import { ObservationFollowUpCommentProvider } from '../observations/follow-up-selector/ObservationFollowUpCommentDialogProvider';
import { AlertsProvider } from '@/components/shared/alerts/AlertsProvider';
import { DataTable, useDataTable, useQueryDataTableState } from '@/components/shared/data-table';
import { useIsSgNavigation } from '@/hooks/roles.hook';
import type { FormationEnum, NominationFileOutcomeEnum, PrioriteEnum } from '@/types/enums.types';
import { useSessionNominationFilesQuery } from '@queries/nomination-sessions.queries';

import { MagistratModaleProvider } from './components/cells/magistrat-details/MagistratDnModale';
import { NominationFileOutcomeCommentModalProvider } from './components/cells/nomination-file-outcome/NominationFileOutcomeCommentModalProvider';
import { ObservationFollowUpReminderProvider } from './components/cells/observation-follow-up/ObservationFollowUpReminderProvider';
import { ObservationsModalProvider } from './components/cells/observations/ObservationsModalProvider';
import { NominationFileTargetPositionProvider } from './components/cells/targeted-position/NominationFileTargetPositionProvider';
import { NominationFilesTableActionsBar } from './components/NominationFilesActionsBar';
import { NominationFilesAffectationsStatus } from './components/NominationFilesAffectationsStatus';
import { NominationFilesStatusBadges } from './components/NominationFilesStatusBadges';
import { useNominationFilesTable } from './contexts/files-table.context';
import { FilesAffectationsProvider } from './contexts/FilesAffectationsProvider';
import { FilesSelectionProvider } from './contexts/FilesSelectionProvider';
import { NominationFilesTableProvider } from './contexts/NominationFilesTableProvider';
import { useNominationFilesTableColumns } from './useNominationFilesTableColumns.hook';

function NominationFilesTableInner(props: React.PropsWithChildren) {
  const isSg = useIsSgNavigation();

  const { sessionId, formation, edition } = useNominationFilesTable();
  const columns = useNominationFilesTableColumns();
  const [tableState, setTableState] = useQueryDataTableState({
    globalFilter: '',
    pagination: { pageIndex: 0, pageSize: 50 },
    sorting: [] as [] | [{ id: 'fileNumber' | 'name' | 'targetedGrade'; desc: boolean }],
    columnFilters: [] as { id: 'priorities' | 'reporters' | 'outcomes'; value: string[] }[],
    rowSelection: {},
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
      reporterIds: tableState.columnFilters.find(({ id }) => id === 'reporters')?.value as string[],
      outcomes: tableState.columnFilters.find(({ id }) => id === 'outcomes')
        ?.value as (NominationFileOutcomeEnum | null)[],
    },
  });
  const nominationFiles = React.useMemo(() => data?.items ?? [], [data]);

  const table = useDataTable({
    columns,
    data: nominationFiles,
    rowCount: data?.totalCount,
    getRowId: (row) => row.id,
    enableRowSelection: !!edition?.isEditing && ((row) => row.original.content.isUpdatable),
    state: tableState,
    onStateChange: setTableState,
    meta: {
      paginationItemLabel: isSg
        ? defineMessage({
            defaultMessage: '{count, plural, one {proposition} other {propositions}}',
          })
        : defineMessage({ defaultMessage: '{count, plural, one {dossier} other {dossiers}}' }),
    },
  });

  return (
    <ObservationsModalProvider>
      <MagistratModaleProvider nominationFiles={nominationFiles} sessionId={sessionId}>
        <NominationFileOutcomeCommentModalProvider formation={formation}>
          <NominationFileTargetPositionProvider sessionId={sessionId}>
            <ObservationFollowUpCommentProvider>
              <ObservationFollowUpReminderProvider>
                <FilesSelectionProvider selection={tableState.rowSelection}>
                  <FilesAffectationsProvider files={nominationFiles}>
                    <AlertsProvider>
                      <div className="fr-container mb-4 flex flex-col gap-y-4">
                        <div className="self-center">
                          <AlertsProvider.Alerts small className="flex-shrink-0" />
                        </div>

                        {isSg ? (
                          <div className="flex items-center">
                            <NominationFilesAffectationsStatus />
                            <NominationFilesStatusBadges className="ml-4 border-y-0 border-l border-r-0 border-solid border-l-gray-200 pl-4" />
                          </div>
                        ) : null}
                      </div>

                      <DataTable
                        classNames={{
                          content: 'max-w-screen-full xl:max-w-screen-xl 2xl:max-w-screen-2xl mx-auto',
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
              </ObservationFollowUpReminderProvider>
            </ObservationFollowUpCommentProvider>
          </NominationFileTargetPositionProvider>
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
  }>,
) {
  return (
    <NominationFilesTableProvider {...props}>
      <NominationFilesTableInner>{props.children}</NominationFilesTableInner>
    </NominationFilesTableProvider>
  );
}
