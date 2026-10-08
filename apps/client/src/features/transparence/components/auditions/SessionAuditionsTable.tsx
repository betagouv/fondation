import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router';
import { useDebouncedCallback } from 'use-debounce';

import {
  type SessionOutcome,
  useNominationFilesTable,
} from '@/features/nomination-files-table/context/files-table.context';
import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { useExportFailure } from '@/features/nomination-files-table/hooks/useExportFailure';
import { useSessionFilesFilters } from '@/features/nomination-files-table/hooks/useSessionFilesFilters';
import { AuditionRoleBadge } from '@/shared/components/audition-role-badge';
import { ReporterTagList } from '@/shared/components/reporter-tag';
import type { FormationEnum } from '@/shared/enums/formation.enum';
import { ReactTableFilterColumn, useQueryDataTableState } from '@/shared/ui/data-table';
import { NewTable, rowCell } from '@/shared/ui/new-table';
import { SearchInput } from '@/shared/ui/search-input';
import { TotalBadge } from '@/shared/ui/total-badge';
import {
  getMagistratDetailsPath,
  getObservationDetailsPath,
  openedDossierSearch,
  ROUTE_PATHS,
} from '@/utils/route-path.utils';
import { formatPhoneNumber } from '@/utils/string.utils';
import { toScheduledDate } from '@/utils/time-only.util';
import {
  type SessionAudition,
  useInfiniteSessionAuditionsQuery,
  useListSessionAuditionsAsExcelMutation,
  useSessionAuditionsCountsQuery,
} from '@queries/auditions.queries';

import { AuditionsPublicationBadge } from './AuditionsPublicationBadge';
import { AuditionsPublishButton } from './AuditionsPublishButton';

const SEARCH_DEBOUNCE_MS = 600;

type AuditionsContext = 'sg' | 'membre';

export function SessionAuditionsTable(props: {
  canManage: boolean;
  context: AuditionsContext;
  filtersSlot: Element | null;
  formation: FormationEnum;
  outcomes: readonly SessionOutcome[];
  sessionId: string;
  toolbarSlot: Element | null;
}) {
  return (
    <NominationFilesTableProvider
      canManage={props.canManage}
      formation={props.formation}
      outcomes={props.outcomes}
      sessionId={props.sessionId}
    >
      <SessionAuditionsContent
        context={props.context}
        filtersSlot={props.filtersSlot}
        sessionId={props.sessionId}
        toolbarSlot={props.toolbarSlot}
      />
    </NominationFilesTableProvider>
  );
}

function SessionAuditionsContent(props: {
  context: AuditionsContext;
  filtersSlot: Element | null;
  sessionId: string;
  toolbarSlot: Element | null;
}) {
  const intl = useIntl();
  const filters = useSessionFilesFilters();
  const [tableState, setTableState] = useQueryDataTableState({
    columnFilters: [] as { id: 'reporters'; value: string[] }[],
    globalFilter: '',
    sorting: [] as [] | [{ desc: boolean; id: 'auditionDate' }],
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteSessionAuditionsQuery({
      filters: {
        reporterIds: tableState.columnFilters.find(({ id }) => id === 'reporters')?.value ?? [],
        search: tableState.globalFilter ?? '',
        sortBy: tableState.sorting[0]?.id ?? null,
        sortDesc: tableState.sorting[0]?.desc ?? false,
      },
      sessionId: props.sessionId,
    });
  const { data: counts } = useSessionAuditionsCountsQuery({ sessionId: props.sessionId });
  const { canManage } = useNominationFilesTable();
  const exportAsExcel = useListSessionAuditionsAsExcelMutation();
  const onExportFailure = useExportFailure();

  const search = useSearch(tableState.globalFilter ?? '', (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

  const columns = useMemo(() => {
    const h = createColumnHelper<SessionAudition>();
    const columns = [
      h.display({
        cell: magistratCell(props.context),
        header: intl.formatMessage({ defaultMessage: 'Magistrat' }),
        id: 'magistrat',
        size: 240,
      }),
      h.display({
        cell: propositionsCell(props.context),
        header: intl.formatMessage({ defaultMessage: 'Proposition' }),
        id: 'propositions',
        size: 260,
      }),
      h.accessor('audition', {
        cell: auditionCell,
        enableSorting: true,
        header: intl.formatMessage({ defaultMessage: 'Date et heure' }),
        id: 'auditionDate',
        size: 210,
      }),
      h.display({
        cell: reportersCell,
        header: intl.formatMessage({ defaultMessage: 'Rapporteur(s)' }),
        id: 'reporters',
        meta: { filters: filters.reporters },
        size: 170,
      }),
    ];
    // the members never reach the magistrats: their contact stays with the secretariat
    if (props.context === 'membre') return columns;

    return [
      ...columns,
      h.display({
        cell: contactCell,
        header: intl.formatMessage({ defaultMessage: 'Coordonnées' }),
        id: 'contact',
        size: 260,
      }),
    ];
  }, [filters.reporters, intl, props.context]);

  const onSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) =>
      setTableState((state) => ({
        ...state,
        sorting: typeof updater === 'function' ? updater(state.sorting) : updater,
      })),
    [setTableState],
  );
  const onColumnFiltersChange = useCallback(
    (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) =>
      setTableState((state) => ({
        ...state,
        columnFilters: typeof updater === 'function' ? updater(state.columnFilters) : updater,
      })),
    [setTableState],
  );

  const auditions = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns,
    data: auditions,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: {
      columnFilters: tableState.columnFilters,
      globalFilter: tableState.globalFilter,
      sorting: tableState.sorting,
    },
  });

  const filtersBar = (
    <div className="flex items-center justify-between gap-4">
      <ReactTableFilterColumn table={table} />
      <SearchInput
        className="w-72"
        onChange={search.onChange}
        onClear={search.clear}
        placeholder={intl.formatMessage({ defaultMessage: 'Rechercher un magistrat' })}
        value={search.value}
      />
    </div>
  );

  const toolbar = (
    <div className="flex min-h-10 flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        {props.context === 'sg' && <AuditionsPublicationBadge sessionId={props.sessionId} />}
        <TotalBadge value={(counts?.scheduled ?? 0) + (counts?.toSchedule ?? 0)}>
          <FormattedMessage defaultMessage="Total" />
        </TotalBadge>
        <TotalBadge value={counts?.scheduled ?? 0}>
          <FormattedMessage defaultMessage="Programmées" />
        </TotalBadge>
        <TotalBadge value={counts?.toSchedule ?? 0}>
          <FormattedMessage defaultMessage="À programmer" />
        </TotalBadge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <Button
            className="min-h-9! py-1.5!"
            disabled={exportAsExcel.isPending || !(counts?.scheduled || counts?.toSchedule)}
            iconId="fr-icon-download-line"
            onClick={() => exportAsExcel.mutate({ sessionId: props.sessionId }, { onError: onExportFailure })}
            priority="tertiary"
            size="small"
          >
            <FormattedMessage defaultMessage="Exporter le fichier Excel" />
          </Button>
        )}
        {canManage && <AuditionsPublishButton sessionId={props.sessionId} />}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-y-4">
      {props.filtersSlot ? createPortal(filtersBar, props.filtersSlot) : filtersBar}
      {props.toolbarSlot ? createPortal(toolbar, props.toolbarSlot) : toolbar}
      <NewTable
        ariaLabel={intl.formatMessage({ defaultMessage: 'Auditions de la session' })}
        emptyLabel={
          props.context === 'membre' && !tableState.globalFilter && tableState.columnFilters.length === 0
            ? intl.formatMessage({ defaultMessage: "Aucune audition à venir n'a été publiée" })
            : intl.formatMessage({ defaultMessage: 'Aucune audition ne correspond aux valeurs filtrées' })
        }
        fluid
        isLoading={isLoading}
        scrollsWithPage
        table={table}
        unvirtualized
      />
      {hasNextPage && (
        <Button
          className="self-center"
          disabled={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
          priority="secondary"
          size="small"
        >
          <FormattedMessage defaultMessage="Voir plus" />
        </Button>
      )}
    </div>
  );
}

function useSearch(value: string, onCommit: (value: string) => void) {
  const [search, setSearch] = useState(value);
  const commit = useDebouncedCallback(onCommit, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (!commit.isPending()) setSearch(value);
  }, [commit, value]);

  return {
    clear: () => {
      commit.cancel();
      setSearch('');
      onCommit('');
    },
    onChange: (next: string) => {
      setSearch(next);
      commit(next);
    },
    value: search,
  };
}

const magistratCell = (context: AuditionsContext) =>
  rowCell<SessionAudition>(({ magistrat }) => (
    <div className="flex flex-col items-start gap-1 leading-6">
      {magistrat.id ? (
        <Link
          className="fr-link fr-link--sm fr-icon-account-circle-fill fr-link--icon-left"
          to={getMagistratDetailsPath({ context, magistratId: magistrat.id })}
        >
          {magistrat.name}
        </Link>
      ) : (
        <span className="font-medium text-(--text-default-grey)">{magistrat.name}</span>
      )}
      {magistrat.currentPosition && <span className="text-xs leading-6">{magistrat.currentPosition}</span>}
    </div>
  ));

const propositionsCell = (context: AuditionsContext) =>
  rowCell<SessionAudition>((audition) => <AuditionPropositions audition={audition} context={context} />);

function AuditionPropositions(props: { audition: SessionAudition; context: AuditionsContext }) {
  return (
    <ul className="fr-m-0 fr-p-0 flex list-none flex-col gap-3">
      {props.audition.propositions.map((proposition) => (
        <li
          className="fr-p-0 flex flex-col items-start gap-1 leading-7"
          key={proposition.observationId ?? proposition.nominationFileId}
        >
          <AuditionRoleBadge role={props.audition.role} />
          <PropositionLink context={props.context} proposition={proposition} />
        </li>
      ))}
    </ul>
  );
}

function PropositionLink(props: {
  context: AuditionsContext;
  proposition: SessionAudition['propositions'][number];
}) {
  const { nominationFileId, observationId } = props.proposition;
  const { sessionId } = useNominationFilesTable();
  const filesPath =
    props.context === 'membre' ? ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS : ROUTE_PATHS.SG.SESSION_ID;
  const to = observationId
    ? getObservationDetailsPath({ context: props.context, nominationFileId, observationId, sessionId })
    : { pathname: generatePath(filesPath, { sessionId }), search: openedDossierSearch(nominationFileId) };

  return (
    <Link
      className="bg-none! text-(--text-action-high-blue-france)! underline! underline-offset-4 hover:decoration-2"
      to={to}
    >
      {props.proposition.label || '-'}
    </Link>
  );
}

const auditionCell = rowCell<SessionAudition>(({ audition }) => <AuditionSchedule audition={audition} />);

function AuditionSchedule(props: { audition: SessionAudition['audition'] }) {
  const { formatDate, formatTime } = useIntl();
  const scheduledAt = props.audition && toScheduledDate(props.audition.date, props.audition.time);

  if (!scheduledAt) {
    return (
      <Badge noIcon severity="warning" small>
        <FormattedMessage defaultMessage="À programmer" />
      </Badge>
    );
  }

  return (
    <span className="flex items-center gap-2 font-medium whitespace-nowrap">
      <span aria-hidden className="fr-icon-calendar-line fr-icon--sm" />
      <FormattedMessage
        defaultMessage="{date} à {time}"
        values={{
          date: formatDate(scheduledAt, { day: 'numeric', month: 'long', year: 'numeric' }),
          time: formatTime(scheduledAt, { format: 'zonedTimeShort' }),
        }}
      />
    </span>
  );
}

const reportersCell = rowCell<SessionAudition>(({ reporters }) => <ReporterTagList reporters={reporters} />);

function EmailAddress(props: { email: string }) {
  const [local, domain] = props.email.split('@');
  if (domain === undefined) return props.email;

  return (
    <>
      {local}
      <wbr />@{domain}
    </>
  );
}

const contactCell = rowCell<SessionAudition>(({ contact }) =>
  contact ? (
    <div className="flex flex-col gap-1 leading-6">
      <span className="flex items-center gap-2">
        <span aria-hidden className="fr-icon-phone-line fr-icon--sm" />
        {contact.phone ? formatPhoneNumber(contact.phone) : '-'}
      </span>
      <span className="flex items-center gap-2">
        <span aria-hidden className="fr-icon-mail-line fr-icon--sm" />
        <span className="min-w-0 wrap-break-word">
          {contact.email ? <EmailAddress email={contact.email} /> : '-'}
        </span>
      </span>
    </div>
  ) : (
    '-'
  ),
);
