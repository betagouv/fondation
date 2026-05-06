import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useSelection } from '../../../../../hooks/useSelection.hook';
import { AgendaFileSearch } from '../components/AgendaFileSearch';
import { AgendaNominationFile } from '../components/AgendaNominationFile';
import { useAgenda } from '../context/AgendaContext';
import { useScrollDownIndicator } from '../hooks/useScrollDownIndicator.hook';
import { IndeterminateCheckbox } from '@/components/shared/indeterminate-checkbox/IndeterminateCheckbox';
import { useFindAgendaNominationFilesQuery } from '@queries/agenda.queries';

export function AgendaNominationFilesStep(props: { className?: string }) {
  const { session, isSubmitting: isPending, submit, goToMetadata, agendaId } = useAgenda();

  const [search, setSearch] = React.useState('');

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const down = useScrollDownIndicator({ root: scrollRef });

  const { data } = useFindAgendaNominationFilesQuery({
    sessionId: session.id,
    ignoreAgendaId: agendaId ?? null,
  });

  const nominationFiles = React.useMemo(() => data?.items ?? [], [data]);

  const selection = useSelection({
    items: nominationFiles,
    toString: ({ id }) => id,
  });

  const filtered = React.useMemo(() => {
    const trimmed = search.trim();
    const term = trimmed ? new RegExp(trimmed.replace(/ /g, '\\s'), 'i') : undefined;

    return nominationFiles.filter((item) => !term || term.test(item.magistrat.name));
  }, [nominationFiles, search]);

  const onSubmit = React.useCallback(() => {
    if (selection.size === 0) return;
    submit(selection.list());
  }, [submit, selection]);

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      selection.toggle(e.target.value, e.target.checked);
    },
    [selection],
  );

  const onSelectAll = React.useCallback(() => {
    selection.toggleAll();
  }, [selection]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  return (
    <div className={clsx('flex flex-col', props.className)}>
      <div className="flex justify-between pl-2">
        <IndeterminateCheckbox
          small
          checked={selection.hasSome}
          indeterminate={selection.hasSome && !selection.hasAll}
          onChange={onSelectAll}
        >
          <span className="font-bold">
            <FormattedMessage
              values={{ count: selection.size }}
              defaultMessage={`{count, plural,
                =0 {Aucune proposition sélectionnée}
                one {1 proposition sélectionnée}
                other {{count, number} propositions sélectionnées}}`}
            />
          </span>
        </IndeterminateCheckbox>

        {nominationFiles.length > 0 && (
          <AgendaFileSearch
            className="focus-within:w-1/2"
            value={search}
            onChange={setSearch}
            disabled={nominationFiles.length === 0}
          />
        )}
      </div>
      <div ref={scrollRef} className="mt-2 h-[42vh] min-h-64 overflow-y-scroll">
        {filtered.length === 0 && (
          <p className="pt-4 text-center text-gray-500">
            <FormattedMessage defaultMessage="Aucune donnée disponible" />
          </p>
        )}
        {filtered.length > 0 && (
          <>
            <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const file = filtered[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    className="absolute left-0 top-0 w-full px-2 hover:bg-gray-50"
                    style={{ transform: `translateY(${virtualItem.start}px)` }}
                  >
                    <AgendaNominationFile
                      file={file}
                      search={search}
                      formation={session.formation}
                      checked={selection.has(file)}
                      onChange={onChange}
                    />
                  </div>
                );
              })}
            </div>
            <div data-sentinel ref={down.ref} className="h-[72px]" />
          </>
        )}
      </div>
      <div
        className={clsx(
          cx('ri-arrow-down-s-line'),
          'h-[32.5px] w-full pt-2 text-center text-gray-600 opacity-0 transition-opacity duration-100 before:size-8 before:content-[""]',
          down.hasMore && 'shadow-t z-10 opacity-100 shadow-[0_-10px_20px_#fff]',
        )}
      />

      <ButtonsGroup
        className="mt-6"
        inlineLayoutWhen="md and up"
        alignment="center"
        buttons={[
          { children: 'Retour', priority: 'secondary', onClick: goToMetadata, type: 'button' },
          {
            type: 'button',
            onClick: onSubmit,
            disabled: selection.hasNone || isPending,
            className: clsx({ 'before:animate-spin': isPending }),
            iconId: selection.hasNone ? undefined : isPending ? 'ri-loader-4-line' : 'ri-file-pdf-2-line',
            children: agendaId ? (
              <FormattedMessage
                values={{ count: selection.size }}
                defaultMessage={`{count, plural,
                    =0 {En attente de sélection}
                    one {Modifier l'ODJ avec la proposition sélectionnée}
                    other {Modifier l'ODJ avec les {count} propositions sélectionnées}}`}
              />
            ) : (
              <FormattedMessage
                values={{ count: selection.size }}
                defaultMessage={`{count, plural,
                  =0 {En attente de sélection}
                  one {Générer l'ODJ avec la proposition sélectionnée}
                  other {Générer l'ODJ avec les {count} propositions sélectionnées}}`}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
