import React from 'react';
import { useLocation } from 'react-router-dom';

import { MagistratModaleProvider } from '@/components/secretariat-general/transparence/tableau-affectation-dossier-de-nomination/MagistratDnModale';
import { NominationFileOutcomeCommentModalProvider } from '@/components/secretariat-general/transparence/tableau-affectation-dossier-de-nomination/nomination-file-outcome/NominationFileOutcomeCommentModalProvider';
import { ObservationsModalProvider } from '@/components/secretariat-general/transparence/tableau-affectation-dossier-de-nomination/ObservationsModalContext';
import { AlertsProvider } from '@/components/shared/alerts/AlertsProvider';
import { DataTable, useDataTable, useQueryDataTableState } from '@/components/shared/data-table';
import { NominationFilesAffectationsStatus } from '@/components/shared/nomination-files-table/components/NominationFilesAffectationsStatus';
import { AffectationProvider } from '@/contexts/AffectationDossiersContext';
import type { FormationEnum, PrioriteEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useSessionNominationFilesQuery } from '@queries/nomination-sessions.queries';

import { NominationFilesTableActionsBar } from './components/NominationFilesActionsBar';
import { useNominationFilesTable } from './components/NominationFilesTableContext';
import { NominationFilesTableProvider } from './components/NominationFilesTableProvider';
import { useNominationFilesTableColumns } from './components/useNominationFilesTableColumns.hook';

function NominationFilesTableInner() {
  const { pathname } = useLocation();
  const isSg = React.useMemo(() => pathname.includes(ROUTE_PATHS.SG.DASHBOARD), [pathname]);

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
    console.log(tableState);
  }, [tableState]);

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
    enableRowSelection: !!edition?.isEditing,
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
          <AffectationProvider nominationFiles={nominationFiles} selection={tableState.rowSelection}>
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
                <NominationFilesTableActionsBar />
              </DataTable>
            </AlertsProvider>
          </AffectationProvider>
        </NominationFileOutcomeCommentModalProvider>
      </MagistratModaleProvider>
    </ObservationsModalProvider>
  );
}

export function NominationFilesTable(props: {
  isEditable?: false;
  sessionId: string;
  formation: FormationEnum;
}) {
  return (
    <NominationFilesTableProvider {...props}>
      <NominationFilesTableInner />
    </NominationFilesTableProvider>
  );
}
