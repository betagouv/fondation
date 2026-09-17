import type { Table } from '@tanstack/react-table';
import clsx from 'clsx';
import { type PropsWithChildren, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import type { SessionFilesTableState } from '../hooks/useSessionFilesTable';
import { ObservationsModalProvider } from '@/features/observations/context/ObservationsModalProvider';
import { AddNominationFileAttachmentModalProvider } from '@/features/transparence/components/nomination-file-attachments/context/AddNominationFileAttachmentModalProvider';
import { ReactTableFilterColumn } from '@/shared/ui/data-table';
import { NewTable } from '@/shared/ui/new-table';
import { SearchInput } from '@/shared/ui/search-input';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratSidePanel } from './cells/magistrat-side-panel/components/MagistratSidePanel';
import { useSidePanel } from './cells/magistrat-side-panel/context/side-panel.context';
import { SidePanelProvider } from './cells/magistrat-side-panel/context/SidePanelProvider';
import { useOutOfListFile } from './cells/magistrat-side-panel/hooks/use-out-of-list-file/use-out-of-list-file.hook';
import { NominationFileOutcomeCommentModalProvider } from './cells/nomination-file-outcome/NominationFileOutcomeCommentModalProvider';
import { NominationFileTargetPositionProvider } from './cells/targeted-position/NominationFileTargetPositionProvider';

function SessionFilesNewTable(props: {
  emptyLabel: string;
  isLoading: boolean;
  narrowsBesideSidePanel?: boolean;
  onEndReached: () => void;
  scrollsWithPage?: boolean;
  table: Table<SessionNominationFile>;
}) {
  const { activeId } = useSidePanel();
  const intl = useIntl();
  const isEmpty = !props.isLoading && props.table.getRowModel().rows.length === 0;

  const table = (
    <NewTable
      ariaLabel={intl.formatMessage({ defaultMessage: 'Dossiers de la session' })}
      className={clsx(!props.scrollsWithPage && !isEmpty && 'max-h-screen')}
      emptyLabel={
        props.isLoading ? intl.formatMessage({ defaultMessage: 'Chargement...' }) : props.emptyLabel
      }
      fluid
      isLoading={props.isLoading}
      onEndReached={props.onEndReached}
      revealedRowId={activeId}
      rowTint={(row) => (row.id === activeId ? 'bg-(--background-alt-blue-france)' : undefined)}
      scrollsWithPage={props.scrollsWithPage}
      table={props.table}
      visibleRows={props.scrollsWithPage ? undefined : 10}
    />
  );

  if (!props.narrowsBesideSidePanel) return table;

  return (
    <div className={clsx('w-full transition-[width] duration-300 ease-out', activeId && 'md:w-[52%]')}>
      {table}
    </div>
  );
}

export function SessionFilesTable(
  props: PropsWithChildren<{
    emptyLabel?: string;
    filesTable: SessionFilesTableState;
    filtersEnd?: ReactNode;
    filtersSlot?: Element | null;
    isPinned?: boolean;
    narrowsBesideSidePanel?: boolean;
    scrollsWithPage?: boolean;
    summary?: ReactNode;
    toolbarSlot?: Element | null;
  }>,
) {
  const intl = useIntl();
  const { sessionId } = useNominationFilesTable();
  const { filesTable } = props;

  const outOfList = useOutOfListFile({
    fetchNextPage: filesTable.fetchNextPage,
    isFiltered: filesTable.isFiltered,
    isListPending: filesTable.isLoading,
    nominationFiles: filesTable.nominationFiles,
    sessionId,
  });

  const toolbar = (
    <div className={clsx('flex flex-col justify-center', props.isPinned ? 'min-h-8' : 'min-h-10')}>
      {props.summary}
      {props.children}
    </div>
  );

  const filters = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <ReactTableFilterColumn table={filesTable.table} />
        {props.filtersEnd}
      </div>
      <SearchInput
        className="w-72"
        onChange={filesTable.onSearchChange}
        onClear={filesTable.clearSearch}
        placeholder={intl.formatMessage({ defaultMessage: 'Rechercher un magistrat' })}
        value={filesTable.search}
      />
    </div>
  );

  return (
    <ObservationsModalProvider>
      <SidePanelProvider
        isFetching={filesTable.isFetching}
        isResolvingOutOfListFile={outOfList.isResolving}
        nominationFiles={filesTable.nominationFiles}
        onEndReached={filesTable.fetchNextPage}
        outOfListFile={outOfList.file}
        totalCount={filesTable.totalCount}
      >
        <NominationFileOutcomeCommentModalProvider>
          <NominationFileTargetPositionProvider sessionId={sessionId}>
            <AddNominationFileAttachmentModalProvider>
              <MagistratSidePanel sessionId={sessionId} />
              <div className="flex flex-col gap-y-4">
                {props.filtersSlot ? createPortal(filters, props.filtersSlot) : filters}

                {props.toolbarSlot ? createPortal(toolbar, props.toolbarSlot) : toolbar}

                <SessionFilesNewTable
                  emptyLabel={
                    props.emptyLabel ??
                    intl.formatMessage({
                      defaultMessage: 'Aucun résultat ne correspond aux valeurs filtrées',
                    })
                  }
                  isLoading={filesTable.isLoading}
                  narrowsBesideSidePanel={props.narrowsBesideSidePanel}
                  onEndReached={filesTable.fetchNextPage}
                  scrollsWithPage={props.scrollsWithPage}
                  table={filesTable.table}
                />
              </div>
            </AddNominationFileAttachmentModalProvider>
          </NominationFileTargetPositionProvider>
        </NominationFileOutcomeCommentModalProvider>
      </SidePanelProvider>
    </ObservationsModalProvider>
  );
}
