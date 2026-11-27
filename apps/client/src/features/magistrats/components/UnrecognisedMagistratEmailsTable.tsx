import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { DataTable, loadFailureOf, useDataTableUrlState } from '@/shared/ui/data-table';
import {
  type UnrecognisedMagistratEmail,
  type UnrecognisedMagistratEmailsSorting,
  useUnrecognisedMagistratEmailsQuery,
} from '@queries/magistrats.queries';

import { AttachUnrecognisedMagistratEmailModal } from './AttachUnrecognisedMagistratEmailModal';
import { UnrecognisedMagistratEmailActions } from './UnrecognisedMagistratEmailActions';

const h = createColumnHelper<UnrecognisedMagistratEmail>();

const SORTABLE_COLUMNS = new Set<string>([
  'email',
  'lastAttemptAt',
] satisfies UnrecognisedMagistratEmailsSorting[number]['id'][]);
const DEFAULT_SORTING: UnrecognisedMagistratEmailsSorting = [{ desc: true, id: 'lastAttemptAt' }];

function useUnrecognisedMagistratEmailsColumns(
  onAttach: (email: UnrecognisedMagistratEmail) => void,
  onHandled: (email: UnrecognisedMagistratEmail) => void,
) {
  const { formatDate, formatMessage, formatTime } = useIntl();

  return useMemo(
    () => [
      h.accessor('lastAttemptAt', {
        cell: ({ getValue }) =>
          formatMessage(
            { defaultMessage: '{date} à {time}' },
            {
              date: formatDate(getValue(), { format: 'zonedDateShort' }),
              time: formatTime(getValue(), { format: 'zonedTimeShort' }),
            },
          ),
        header: formatMessage({ defaultMessage: 'Dernière tentative' }),
        size: 190,
      }),
      h.accessor('email', {
        header: formatMessage({ defaultMessage: 'Adresse' }),
        size: 760,
      }),
      h.display({
        cell: ({ row }) => (
          <UnrecognisedMagistratEmailActions
            email={row.original}
            onAttach={() => onAttach(row.original)}
            onDismissed={() => onHandled(row.original)}
          />
        ),
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Actions' }),
        id: 'actions',
        size: 200,
      }),
    ],
    [formatDate, formatMessage, formatTime, onAttach, onHandled],
  );
}

export function UnrecognisedMagistratEmailsTable() {
  const { formatMessage } = useIntl();
  const { onSortingChange, tableState } = useDataTableUrlState({ sorting: DEFAULT_SORTING });
  // above the rows so that a refusal stays readable once its row leaves the list
  const [attaching, setAttaching] = useState<{ email: UnrecognisedMagistratEmail; open: boolean } | null>(
    null,
  );
  const openAttachModal = useCallback(
    (email: UnrecognisedMagistratEmail) => setAttaching({ email, open: true }),
    [],
  );
  // a saved link can carry a sort the API does not accept
  const [sort] = tableState.sorting;
  const sorting =
    sort && SORTABLE_COLUMNS.has(sort.id)
      ? (tableState.sorting as UnrecognisedMagistratEmailsSorting)
      : DEFAULT_SORTING;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    refetch,
  } = useUnrecognisedMagistratEmailsQuery(sorting);
  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [leavingEmail, setLeavingEmail] = useState<{ id: string; index: number } | null>(null);
  const onHandled = useCallback(
    (email: UnrecognisedMagistratEmail) =>
      setLeavingEmail({ id: email.id, index: (data ?? []).findIndex(({ id }) => id === email.id) }),
    [data],
  );
  useEffect(() => {
    if (!leavingEmail || data?.some(({ id }) => id === leavingEmail.id)) return;
    const focusNext = () => {
      const attachButtons = containerRef.current?.querySelectorAll<HTMLElement>(
        'button[aria-label^="Rattacher "]',
      );
      const next = attachButtons?.[Math.min(leavingEmail.index, attachButtons.length - 1)];
      (next ?? containerRef.current)?.focus();
    };
    // the page behind an open modal takes no focus until the modal is closed
    const modal = document.querySelector('dialog[open]');
    if (modal) modal.addEventListener('close', focusNext, { once: true });
    else focusNext();
    setLeavingEmail(null);
  }, [data, leavingEmail]);
  const table = useReactTable({
    columns: useUnrecognisedMagistratEmailsColumns(openAttachModal, onHandled),
    data: useMemo(() => data ?? [], [data]),
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (email) => email.id,
    manualSorting: true,
    onSortingChange,
    state: { sorting },
  });

  return (
    <div className="outline-none" ref={containerRef} tabIndex={-1}>
      <DataTable
        ariaLabel={formatMessage({ defaultMessage: 'Adresses non reconnues' })}
        emptyLabel={formatMessage({ defaultMessage: 'Aucune adresse non reconnue ces 30 derniers jours' })}
        fluid
        isLoading={!isError && isLoading}
        loadError={loadFailureOf({ fetchNextPage, isError, isFetching, isFetchNextPageError, refetch })}
        onEndReached={fetchMore}
        scrollsWithPage
        table={table}
      />
      {attaching && (
        <AttachUnrecognisedMagistratEmailModal
          email={attaching.email}
          onAttached={() => onHandled(attaching.email)}
          onClose={() => setAttaching({ ...attaching, open: false })}
          onClosed={() => setAttaching(null)}
          open={attaching.open}
        />
      )}
    </div>
  );
}
