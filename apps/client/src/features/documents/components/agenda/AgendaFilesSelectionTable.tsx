import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import {
  createColumnHelper,
  type HeaderContext,
  type Row,
  type RowSelectionState,
} from '@tanstack/react-table';
import clsx from 'clsx';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';

import { NominationFileOutcome } from '@/features/nomination-files-table/components/cells/nomination-file-outcome/NominationFileOutcome';
import { NominationFileStatusCell } from '@/features/nomination-files-table/components/cells/NominationFileStatusCell';
import { ReportersCell } from '@/features/nomination-files-table/components/cells/reporters/ReportersCell';
import type { SessionOutcome } from '@/features/nomination-files-table/context/files-table.context';
import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { useSessionFilesFilters } from '@/features/nomination-files-table/hooks/useSessionFilesFilters';
import { useSessionFilesTable } from '@/features/nomination-files-table/hooks/useSessionFilesTable';
import { GradeAndPosition } from '@/shared/components/GradeAndPosition';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import type { FormationEnum } from '@/shared/enums/formation.enum';
import { ReactTableFilterColumn } from '@/shared/ui/data-table';
import { Checkbox, NewTable, rowCell, useSelectionColumn } from '@/shared/ui/new-table';
import { SearchInput } from '@/shared/ui/search-input';
import { useToasts } from '@/shared/ui/toast';
import { Tooltip } from '@/shared/ui/tooltip';
import { useFindAgendaNominationFilesQuery } from '@queries/agenda.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

const h = createColumnHelper<SessionNominationFile>();

const fileNumberCell = rowCell<SessionNominationFile>((file) => file.content.numeroDeDossier);
const magistratCell = rowCell<SessionNominationFile>((file) => (
  <div className="flex flex-col items-start gap-y-0.5">
    <span className="text-left leading-4 uppercase">{file.content.nomMagistrat}</span>
    {file.content.posteActuel ? (
      <span className="text-xs leading-5">
        <GradeAndPosition grade={file.content.grade} position={file.content.posteActuel} />
      </span>
    ) : null}
  </div>
));
const posteCibleCell = rowCell<SessionNominationFile>((file) => (
  <span className="leading-6">
    <GradeAndPosition grade={file.content.gradeCible} position={file.content.posteCible} />
  </span>
));
const prioritiesCell = rowCell<SessionNominationFile>((file) => (
  <PriorityBadgeList priorities={file.priorities} />
));
const reportersCell = rowCell<SessionNominationFile>((file) => <ReportersCell dossier={file} />);
const outcomeCell = rowCell<SessionNominationFile>((file) => <NominationFileOutcome nominationFile={file} />);
const statusCell = rowCell<SessionNominationFile>((file) => (
  <NominationFileStatusCell status={file.content.status} />
));

function useAgendaFilesColumns() {
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

interface AgendaFilesSelectionTableProps {
  actionsSlot?: Element | null;
  cancelLabel?: ReactNode;
  className?: string;
  defaultSelectedFileIds?: readonly string[] | null;
  isSubmitting?: boolean;
  onCancel(): void;
  onSubmit(fileIds: readonly string[]): void;
  renderSubmitLabel: (count: number) => ReactNode;
  scrollsWithPage?: boolean;
  sessionId: string;
}

function useFiltersHeight(filters: HTMLElement | null) {
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!filters) return;

    const measure = () => setHeight(filters.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(filters);

    return () => observer.disconnect();
  }, [filters]);

  return height;
}

function AgendaFilesSelectionTableInner(props: AgendaFilesSelectionTableProps) {
  const { formatMessage } = useIntl();
  const [pinnedFilters, setPinnedFilters] = useState<HTMLDivElement | null>(null);
  const filtersHeight = useFiltersHeight(props.scrollsWithPage ? pinnedFilters : null);
  const { data: agendaFiles, isError } = useFindAgendaNominationFilesQuery({
    sessionId: props.sessionId,
  });
  const fileColumns = useAgendaFilesColumns();

  const [rowSelection, setRowSelection] = useState<RowSelectionState | null>(null);

  const toasts = useToasts();
  const hasWarnedAboutError = useRef(false);
  useEffect(() => {
    if (!isError) {
      hasWarnedAboutError.current = false;
      return;
    }
    if (hasWarnedAboutError.current) return;

    hasWarnedAboutError.current = true;
    toasts.error({
      description: formatMessage({
        defaultMessage: "Rechargez la page avant de sélectionner des propositions pour l'ordre du jour.",
      }),
      title: formatMessage({
        defaultMessage: 'Impossible de savoir quelles propositions sont éligibles',
      }),
    });
  }, [formatMessage, isError, toasts]);

  const ineligibilityReasons = useMemo(
    () => new Map((agendaFiles?.ineligible ?? []).map(({ id, reason }) => [id, reason])),
    [agendaFiles],
  );

  const eligibleFileIds = useMemo(
    () =>
      agendaFiles ? agendaFiles.items.flatMap(({ id }) => (ineligibilityReasons.has(id) ? [] : [id])) : null,
    [agendaFiles, ineligibilityReasons],
  );

  const defaultSelectedFileIds = props.defaultSelectedFileIds;
  useEffect(() => {
    if (!eligibleFileIds) return;

    const eligible = new Set(eligibleFileIds);
    const selected = defaultSelectedFileIds?.filter((id) => eligible.has(id)) ?? [];

    setRowSelection((current) => current ?? Object.fromEntries(selected.map((id) => [id, true])));
  }, [defaultSelectedFileIds, eligibleFileIds]);

  useEffect(() => {
    if (!eligibleFileIds) return;

    const eligible = new Set(eligibleFileIds);
    setRowSelection((current) => {
      if (!current || Object.keys(current).every((id) => eligible.has(id))) return current;

      return Object.fromEntries(Object.entries(current).filter(([id]) => eligible.has(id)));
    });
  }, [eligibleFileIds]);

  const selectedFileIds = useMemo(
    () => Object.entries(rowSelection ?? {}).flatMap(([id, isSelected]) => (isSelected ? [id] : [])),
    [rowSelection],
  );

  const canSelectRow = useCallback(
    (row: Row<SessionNominationFile>) => !!agendaFiles && !ineligibilityReasons.has(row.original.id),
    [agendaFiles, ineligibilityReasons],
  );

  const lockedLabel = useCallback(
    (row: Row<SessionNominationFile>) => {
      if (!agendaFiles) {
        return formatMessage({
          defaultMessage: "Les propositions éligibles à un ordre du jour n'ont pas pu être chargées",
        });
      }

      switch (ineligibilityReasons.get(row.original.id)) {
        case 'REPORTED':
          return formatMessage({
            defaultMessage:
              'Cette proposition est déjà actée dans un procès-verbal restitué et avec une issue définitive',
          });
        case 'UNIDENTIFIED':
          return formatMessage({
            defaultMessage: "Le magistrat ou le poste de cette proposition n'est pas identifié",
          });
        default:
          return formatMessage({
            defaultMessage: 'Cette proposition ne peut pas figurer dans un ordre du jour',
          });
      }
    },
    [agendaFiles, formatMessage, ineligibilityReasons],
  );

  const onRowSelectionChange = useCallback(
    (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) =>
      setRowSelection((current) => (typeof updater === 'function' ? updater(current ?? {}) : updater)),
    [],
  );

  const hasAllEligible =
    !!eligibleFileIds && eligibleFileIds.length > 0 && eligibleFileIds.length === selectedFileIds.length;
  const toggleAllEligible = useCallback(() => {
    if (!eligibleFileIds) return;

    setRowSelection(hasAllEligible ? {} : Object.fromEntries(eligibleFileIds.map((id) => [id, true])));
  }, [eligibleFileIds, hasAllEligible]);

  const selectAllHeader = useCallback(
    ({ table }: HeaderContext<SessionNominationFile, unknown>) => {
      const { columnFilters, globalFilter } = table.getState();
      const isFiltered =
        !!globalFilter || columnFilters.some(({ value }) => Array.isArray(value) && value.length > 0);

      const label = isFiltered
        ? formatMessage({
            defaultMessage: 'Retirez les filtres pour sélectionner toutes les propositions éligibles',
          })
        : hasAllEligible
          ? formatMessage({ defaultMessage: 'Désélectionner toutes les propositions' })
          : formatMessage({ defaultMessage: 'Sélectionner toutes les propositions éligibles' });

      const checkbox = (
        <Checkbox
          checked={hasAllEligible}
          disabled={isFiltered || !eligibleFileIds}
          indeterminate={selectedFileIds.length > 0 && !hasAllEligible}
          label={label}
          onChange={toggleAllEligible}
        />
      );

      if (!isFiltered) return checkbox;

      return <Tooltip label={label}>{checkbox}</Tooltip>;
    },
    [eligibleFileIds, formatMessage, hasAllEligible, selectedFileIds.length, toggleAllEligible],
  );

  const selectionColumn = useSelectionColumn<SessionNominationFile>({
    header: selectAllHeader,
    lockedLabel,
  });

  const columns = useMemo(() => [selectionColumn, ...fileColumns], [fileColumns, selectionColumn]);
  const filesTable = useSessionFilesTable({
    canSelectRow,
    columns,
    onRowSelectionChange,
    rowSelection: rowSelection ?? {},
    sessionId: props.sessionId,
  });

  const isEmpty = !filesTable.isLoading && filesTable.table.getRowModel().rows.length === 0;

  const actions = (
    <ButtonsGroup
      alignment="right"
      buttons={[
        {
          children: props.cancelLabel ?? formatMessage({ defaultMessage: 'Annuler' }),
          onClick: props.onCancel,
          priority: 'secondary',
          type: 'button',
        },
        {
          children: props.renderSubmitLabel(selectedFileIds.length),
          className: clsx({ 'before:animate-spin': props.isSubmitting }),
          disabled: selectedFileIds.length === 0 || props.isSubmitting,
          iconId: (props.isSubmitting ? 'ri-loader-4-line' : undefined) as undefined,
          onClick: () => props.onSubmit(selectedFileIds),
          type: 'button',
        },
      ]}
      inlineLayoutWhen="always"
    />
  );

  return (
    <div
      className={clsx(
        'fr-py-6v mx-[calc(50%-50vw)] flex grow flex-col bg-(--background-alt-grey) px-[calc(50vw-50%)]',
        props.className,
      )}
      style={
        props.scrollsWithPage
          ? ({
              '--fondation-table-header-top': `calc(var(--fondation-banner-height) + var(--fondation-pinned-bar-height) + var(--fondation-pinned-gap) + ${filtersHeight}px)`,
            } as CSSProperties)
          : undefined
      }
    >
      {props.actionsSlot && createPortal(actions, props.actionsSlot)}

      <div
        className={clsx('fr-pb-4v flex flex-col gap-y-4', {
          'sticky top-[calc(var(--fondation-banner-height)+var(--fondation-pinned-bar-height)+var(--fondation-pinned-gap))] z-3 bg-(--background-alt-grey)':
            props.scrollsWithPage,
        })}
        ref={setPinnedFilters}
      >
        <div className="flex items-center justify-between gap-4">
          <ReactTableFilterColumn table={filesTable.table} />
          <SearchInput
            className="w-72"
            onChange={filesTable.onSearchChange}
            onClear={filesTable.clearSearch}
            placeholder={formatMessage({ defaultMessage: 'Rechercher un magistrat' })}
            value={filesTable.search}
          />
        </div>

        <p aria-live="polite" className="fr-m-0 fr-mt-3v text-sm">
          {formatMessage(
            {
              defaultMessage: `{count, plural,
                =0 {Aucune proposition sélectionnée}
                one {1 proposition sélectionnée sur {total, number}}
                other {{count, number} propositions sélectionnées sur {total, number}}}`,
            },
            { count: selectedFileIds.length, total: filesTable.totalCount },
          )}
        </p>
      </div>

      <NewTable
        ariaLabel={formatMessage({ defaultMessage: "Propositions à inscrire à l'ordre du jour" })}
        className={clsx(!props.scrollsWithPage && !isEmpty && 'max-h-screen')}
        emptyLabel={
          filesTable.isLoading
            ? formatMessage({ defaultMessage: 'Chargement...' })
            : formatMessage({ defaultMessage: 'Aucun résultat ne correspond aux valeurs filtrées' })
        }
        fluid
        isLoading={filesTable.isLoading}
        onEndReached={filesTable.fetchNextPage}
        scrollsWithPage={props.scrollsWithPage}
        table={filesTable.table}
        visibleRows={props.scrollsWithPage ? undefined : 10}
      />
    </div>
  );
}

export function AgendaFilesSelectionTable(
  props: AgendaFilesSelectionTableProps & {
    formation: FormationEnum;
    outcomes: readonly SessionOutcome[];
  },
) {
  return (
    <NominationFilesTableProvider
      formation={props.formation}
      outcomes={props.outcomes}
      sessionId={props.sessionId}
    >
      <AgendaFilesSelectionTableInner {...props} />
    </NominationFilesTableProvider>
  );
}
