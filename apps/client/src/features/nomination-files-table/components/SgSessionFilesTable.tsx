import { createColumnHelper, type Row, type RowSelectionState } from '@tanstack/react-table';
import { useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';

import { useNominationFilesTable, type SessionOutcome } from '../context/files-table.context';
import { NominationFilesTableProvider } from '../context/NominationFilesTableProvider';
import { useExportFailure } from '../hooks/useExportFailure';
import { useSessionFilesFilters } from '../hooks/useSessionFilesFilters';
import { useSessionFilesTable } from '../hooks/useSessionFilesTable';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import type { FormationEnum } from '@/shared/enums/formation.enum';
import { NominationFileLockEnumMessages } from '@/shared/enums/nomination-file-lock.enum';
import { rowCell, useSelectionColumn } from '@/shared/ui/new-table';
import { SIDE_PANEL_DOSSIER_PARAM } from '@/utils/route-path.utils';
import {
  isUpdatable,
  useListNominationFilesAsExcelMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import { AffectationVersionStatusBadge } from './AffectationVersionStatusBadge';
import { SidePanelTrigger } from './cells/magistrat-side-panel/components/SidePanelTrigger';
import { NominationFileOutcome } from './cells/nomination-file-outcome/NominationFileOutcome';
import { NominationFileStatusCell } from './cells/NominationFileStatusCell';
import { ObservantsCell } from './cells/ObservantsCell';
import { ReportersCell } from './cells/reporters/ReportersCell';
import { NominationFileTargetPositionCell } from './cells/targeted-position/NominationFileTargetPositionCell';
import { NominationFilesAutoAffectationButton } from './NominationFilesAutoAffectationButton';
import { NominationFilesBulkActions } from './NominationFilesBulkActions';
import { NominationFilesExportButton } from './NominationFilesExportButton';
import { NominationFilesPublishButton } from './NominationFilesPublishButton';
import { NominationFilesSelectionBar } from './NominationFilesSelectionBar';
import { NominationFilesStatusBadges } from './NominationFilesStatusBadges';
import { SessionFilesTable } from './SessionFilesTable';

const h = createColumnHelper<SessionNominationFile>();

const COLUMNS_HIDDEN_BESIDE_SIDE_PANEL = {
  observants: false,
  outcome: false,
  priorities: false,
  reporters: false,
  select: false,
  status: false,
};

const fileNumberCell = rowCell<SessionNominationFile>((file) => file.content.numeroDeDossier);
const magistratCell = rowCell<SessionNominationFile>((file) => <SidePanelTrigger nominationFile={file} />);
const posteCibleCell = rowCell<SessionNominationFile>((file) => (
  <NominationFileTargetPositionCell nominationFile={file} />
));
const observantsCell = rowCell<SessionNominationFile>((file) => <ObservantsCell nominationFile={file} />);
const prioritiesCell = rowCell<SessionNominationFile>((file) => (
  <PriorityBadgeList priorities={file.priorities} />
));
const reportersCell = rowCell<SessionNominationFile>((file) => <ReportersCell dossier={file} />);
const outcomeCell = rowCell<SessionNominationFile>((file) => <NominationFileOutcome nominationFile={file} />);
const statusCell = rowCell<SessionNominationFile>((file) => (
  <NominationFileStatusCell status={file.content.status} />
));

function useSgSessionFilesColumns() {
  const { formatMessage } = useIntl();
  const filters = useSessionFilesFilters();

  return useMemo(
    () => [
      h.accessor('content.numeroDeDossier', {
        id: 'fileNumber',
        cell: fileNumberCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'N°' }),
        size: 42,
        sortDescFirst: true,
      }),

      h.accessor('content.nomMagistrat', {
        id: 'name',
        cell: magistratCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Magistrat' }),
        size: 250,
      }),

      h.accessor('content.posteCible', {
        id: 'targetedGrade',
        cell: posteCibleCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Poste cible' }),
        size: 240,
        sortDescFirst: true,
      }),

      h.accessor('content.observants', {
        id: 'observants',
        cell: observantsCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Observant(s)' }),
        size: 170,
      }),

      h.accessor('priorities', {
        id: 'priorities',
        cell: prioritiesCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Priorité(s)' }),
        meta: { filters: filters.priorities },
        size: 110,
      }),

      h.accessor('reporters', {
        id: 'reporters',
        cell: reportersCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Rapporteur(s)' }),
        meta: { filters: filters.reporters },
        size: 130,
      }),

      h.accessor('content.outcome', {
        id: 'outcome',
        cell: outcomeCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Issue' }),
        meta: { filters: filters.outcomes },
        size: 80,
      }),

      h.accessor('content.status', {
        id: 'status',
        cell: statusCell,
        enableSorting: false,
        header: () => (
          <span className="block text-center">{formatMessage({ defaultMessage: 'Statut' })}</span>
        ),
        size: 120,
      }),
    ],
    [filters, formatMessage],
  );
}

function SgSessionFilesTableInner(
  props: PropsWithChildren<{
    filtersSlot?: Element | null;
    headerSlot?: Element | null;
    isPinned?: boolean;
    onSelectingChange?: (isSelecting: boolean) => void;
    scrollsWithPage?: boolean;
    toolbarSlot?: Element | null;
  }>,
) {
  const { formatMessage } = useIntl();
  const { canManage, sessionId } = useNominationFilesTable();
  const [openedDossier] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);
  const fileColumns = useSgSessionFilesColumns();
  const exportAsExcel = useListNominationFilesAsExcelMutation();
  const onExportFailure = useExportFailure();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const clearSelection = useCallback(() => setRowSelection({}), []);

  const canSelectRow = useCallback((row: Row<SessionNominationFile>) => isUpdatable(row.original), []);

  const lockedLabel = useCallback(
    (row: Row<SessionNominationFile>) => {
      const { lockedReason } = row.original.content;
      return lockedReason ? formatMessage(NominationFileLockEnumMessages[lockedReason]) : '';
    },
    [formatMessage],
  );

  const selectionColumn = useSelectionColumn<SessionNominationFile>({ lockedLabel });

  const columns = useMemo(
    () => (canManage ? [selectionColumn, ...fileColumns] : fileColumns),
    [fileColumns, canManage, selectionColumn],
  );
  const filesTable = useSessionFilesTable({
    canSelectRow: canManage ? canSelectRow : undefined,
    columns,
    columnVisibility: openedDossier ? COLUMNS_HIDDEN_BESIDE_SIDE_PANEL : undefined,
    onRowSelectionChange: canManage ? setRowSelection : undefined,
    rowSelection,
    sessionId,
  });

  const selectedFiles = useMemo(
    () => filesTable.nominationFiles.filter(({ id }) => rowSelection[id]),
    [filesTable.nominationFiles, rowSelection],
  );

  const hasSelection = selectedFiles.length > 0;

  const latestOnSelectingChange = useRef(props.onSelectingChange);
  useEffect(() => {
    latestOnSelectingChange.current = props.onSelectingChange;
  });

  useEffect(() => {
    latestOnSelectingChange.current?.(hasSelection);
  }, [hasSelection]);

  useEffect(() => () => latestOnSelectingChange.current?.(false), []);

  return (
    <SessionFilesTable
      filesTable={filesTable}
      filtersSlot={props.filtersSlot}
      isPinned={props.isPinned}
      narrowsBesideSidePanel
      scrollsWithPage={props.scrollsWithPage}
      toolbarSlot={props.toolbarSlot}
      summary={
        hasSelection ? (
          <NominationFilesSelectionBar
            selectedCount={selectedFiles.length}
            totalCount={filesTable.totalCount}
          />
        ) : null
      }
    >
      {hasSelection &&
        props.headerSlot &&
        createPortal(
          <NominationFilesBulkActions onClose={clearSelection} selectedFiles={selectedFiles} />,
          props.headerSlot,
        )}

      {!hasSelection && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <AffectationVersionStatusBadge sessionId={sessionId} />
            <NominationFilesStatusBadges />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NominationFilesExportButton
              disabled={exportAsExcel.isPending}
              onExport={() => exportAsExcel.mutate({ sessionId }, { onError: onExportFailure })}
            />
            <NominationFilesAutoAffectationButton />
            <NominationFilesPublishButton />
          </div>
        </div>
      )}

      {props.children}
    </SessionFilesTable>
  );
}

export function SgSessionFilesTable(
  props: PropsWithChildren<{
    canManage?: boolean;
    filtersSlot?: Element | null;
    formation: FormationEnum;
    headerSlot?: Element | null;
    isPinned?: boolean;
    onSelectingChange?: (isSelecting: boolean) => void;
    outcomes: readonly SessionOutcome[];
    scrollsWithPage?: boolean;
    sessionId: string;
    toolbarSlot?: Element | null;
  }>,
) {
  return (
    <NominationFilesTableProvider {...props}>
      <SgSessionFilesTableInner
        filtersSlot={props.filtersSlot}
        headerSlot={props.headerSlot}
        isPinned={props.isPinned}
        onSelectingChange={props.onSelectingChange}
        scrollsWithPage={props.scrollsWithPage}
        toolbarSlot={props.toolbarSlot}
      >
        {props.children}
      </SgSessionFilesTableInner>
    </NominationFilesTableProvider>
  );
}
