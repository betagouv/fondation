import { createColumnHelper, type Row, type RowSelectionState } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useIntl } from 'react-intl';

import { useNominationFilesTable, type SessionOutcome } from '../context/files-table.context';
import { NominationFilesTableProvider } from '../context/NominationFilesTableProvider';
import { useSessionFilesFilters } from '../hooks/useSessionFilesFilters';
import { useAgendaBasket } from '@/features/agenda/hooks/useAgendaBasket.hook';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import { rowCell, useSelectionColumn } from '@/shared/ui/new-table';
import type { FormationEnum } from '@/types/enums.types';
import { useFindAgendaNominationFilesQuery } from '@queries/agenda.queries';
import {
  useListNominationFilesAsExcelMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import { AffectationVersionStatusBadge } from './AffectationVersionStatusBadge';
import { SidePanelTrigger } from './cells/magistrat-side-panel/components/SidePanelTrigger';
import { NominationFileOutcome } from './cells/nomination-file-outcome/NominationFileOutcome';
import { NominationFileStatusCell } from './cells/NominationFileStatusCell';
import { ObservantsCell } from './cells/observations/ObservantsCell';
import { ReportersCell } from './cells/reporters/ReportersCell';
import { NominationFileTargetPositionCell } from './cells/targeted-position/NominationFileTargetPositionCell';
import { NominationFilesAgendaBasket } from './NominationFilesAgendaBasket';
import { NominationFilesAutoAffectationButton } from './NominationFilesAutoAffectationButton';
import { NominationFilesExportButton } from './NominationFilesExportButton';
import { NominationFilesPublishButton } from './NominationFilesPublishButton';
import { NominationFilesSelectionBar } from './NominationFilesSelectionBar';
import { NominationFilesSelectionModeButton } from './NominationFilesSelectionModeButton';
import { NominationFilesStatusBadges } from './NominationFilesStatusBadges';
import { SessionFilesTable } from './SessionFilesTable';

const h = createColumnHelper<SessionNominationFile>();

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
        cell: observantsCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Observant(s)' }),
        size: 170,
      }),

      h.accessor('priorities', {
        cell: prioritiesCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Priorité(s)' }),
        meta: { filters: filters.priorities },
        size: 110,
      }),

      h.accessor('reporters', {
        cell: reportersCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Rapporteur(s)' }),
        meta: { filters: filters.reporters },
        size: 130,
      }),

      h.accessor('content.outcome', {
        cell: outcomeCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Issue' }),
        meta: { filters: filters.outcomes },
        size: 80,
      }),

      h.accessor('content.status', {
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

function SgSessionFilesTableInner(props: PropsWithChildren<{ filtersSlot?: Element | null }>) {
  const { formatMessage } = useIntl();
  const { canManage, sessionId } = useNominationFilesTable();
  const basket = useAgendaBasket(sessionId);
  const fileColumns = useSgSessionFilesColumns();
  const exportAsExcel = useListNominationFilesAsExcelMutation();
  const { data: agendaFiles } = useFindAgendaNominationFilesQuery({ enabled: canManage, sessionId });

  const [isSelecting, setSelecting] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isFilteringBasket, setFilteringBasket] = useState(false);
  const clearSelection = useCallback(() => setRowSelection({}), []);
  const enterSelection = useCallback(() => setSelecting(true), []);
  const exitSelection = useCallback(() => {
    setSelecting(false);
    setRowSelection({});
  }, []);

  const toggleBasketFilter = useCallback(() => {
    setFilteringBasket((filtering) => !filtering);
    setRowSelection({});
  }, []);

  useEffect(() => {
    if (basket.isEmpty) setFilteringBasket(false);
  }, [basket.isEmpty]);

  const isSelectable = canManage && isSelecting;
  const isFilteringBasketFiles = isFilteringBasket && !basket.isEmpty;

  const agendaFileIds = useMemo(
    () => (agendaFiles ? new Set(agendaFiles.items.map(({ id }) => id)) : null),
    [agendaFiles],
  );

  useEffect(() => {
    if (!agendaFileIds || isFilteringBasketFiles) return;

    setRowSelection((selection) =>
      Object.keys(selection).every((id) => agendaFileIds.has(id))
        ? selection
        : Object.fromEntries(Object.entries(selection).filter(([id]) => agendaFileIds.has(id))),
    );
  }, [agendaFileIds, isFilteringBasketFiles]);

  const canSelectRow = useCallback(
    (row: Row<SessionNominationFile>) => {
      if (isFilteringBasketFiles) return true;
      if (basket.has(row.original.id)) return false;

      return !agendaFileIds || agendaFileIds.has(row.original.id);
    },
    [agendaFileIds, basket, isFilteringBasketFiles],
  );

  const lockedLabel = useCallback(
    (row: Row<SessionNominationFile>) => {
      const { content, id } = row.original;
      if (basket.has(id)) {
        return formatMessage({ defaultMessage: "Déjà dans l'ODJ en préparation" });
      }

      if (content.status.value === 'DSJ_REPORTED') {
        return formatMessage({ defaultMessage: 'Déjà acté en PV de restitution' });
      }

      if (!content.detectedMagistratId || !content.jurisdictions.targeted) {
        return formatMessage({ defaultMessage: 'Magistrat ou poste cible non identifié' });
      }

      return formatMessage({ defaultMessage: 'Ne peut pas figurer dans un ordre du jour' });
    },
    [basket, formatMessage],
  );

  const selectionColumn = useSelectionColumn<SessionNominationFile>({ lockedLabel });

  const columns = useMemo(
    () => (isSelectable ? [selectionColumn, ...fileColumns] : fileColumns),
    [fileColumns, isSelectable, selectionColumn],
  );
  const selectedFileIds = useMemo(
    () => Object.entries(rowSelection).flatMap(([id, isSelected]) => (isSelected ? [id] : [])),
    [rowSelection],
  );

  return (
    <SessionFilesTable
      canSelectRow={isSelectable ? canSelectRow : undefined}
      columns={columns}
      filtersEnd={
        <NominationFilesAgendaBasket
          basket={basket}
          isFiltering={isFilteringBasketFiles}
          onToggleFilter={toggleBasketFilter}
        />
      }
      filtersSlot={props.filtersSlot}
      onRowSelectionChange={isSelectable ? setRowSelection : undefined}
      restrictTo={isFilteringBasketFiles ? { nominationFileIds: basket.fileIds } : undefined}
      rowSelection={rowSelection}
    >
      {isSelectable ? (
        <NominationFilesSelectionBar
          basket={basket}
          isFilteringBasket={isFilteringBasketFiles}
          onClear={clearSelection}
          onExit={exitSelection}
          selectedFileIds={selectedFileIds}
        />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <AffectationVersionStatusBadge sessionId={sessionId} />
            <NominationFilesStatusBadges />
          </div>

          <div className="flex items-center gap-2">
            <NominationFilesExportButton
              disabled={exportAsExcel.isPending}
              onExport={() => exportAsExcel.mutate({ sessionId })}
            />
            <NominationFilesAutoAffectationButton />
            <NominationFilesPublishButton />
            {canManage && (
              <NominationFilesSelectionModeButton isSelecting={false} onToggle={enterSelection} />
            )}
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
    outcomes: readonly SessionOutcome[];
    sessionId: string;
  }>,
) {
  return (
    <NominationFilesTableProvider {...props}>
      <SgSessionFilesTableInner filtersSlot={props.filtersSlot}>{props.children}</SgSessionFilesTableInner>
    </NominationFilesTableProvider>
  );
}
