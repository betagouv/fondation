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
import { useAgendaBasket } from '../hooks/useAgendaBasket.hook';
import { useScrollDownIndicator } from '../hooks/useScrollDownIndicator.hook';
import { IndeterminateCheckbox } from '@/components/shared/indeterminate-checkbox/IndeterminateCheckbox';
import { useFindAgendaNominationFilesQuery } from '@queries/agenda.queries';

export function AgendaNominationFilesStep(props: { className?: string }) {
  const { session, cancel, goToMetadata, agendaId, defaultFileIds } = useAgenda();
  const basket = useAgendaBasket(session.id);

  const [search, setSearch] = React.useState('');

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const down = useScrollDownIndicator({ root: scrollRef });

  const { data } = useFindAgendaNominationFilesQuery({
    sessionId: session.id,
    ignoreAgendaId: agendaId ?? null,
  });

  const nominationFiles = React.useMemo(() => data?.items ?? [], [data]);

  const initialSelection = React.useMemo(() => {
    if (agendaId) return defaultFileIds ?? undefined;
    if (basket.fileIds.length > 0) return basket.fileIds;
    return nominationFiles.flatMap((f) =>
      f.outcome?.value !== 'SUSPENDED' && f.reporters.length > 0 ? [f.id] : [],
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [agendaId, defaultFileIds, nominationFiles]);

  const selection = useSelection({
    items: nominationFiles,
    toString: ({ id }) => id,
    defaultSelection: initialSelection,
  });

  const filtered = React.useMemo(() => {
    const trimmed = search.trim();
    const term = trimmed ? new RegExp(trimmed.replace(/ /g, '\\s'), 'i') : undefined;

    return nominationFiles.filter((item) => !term || term.test(item.magistrat.name));
  }, [nominationFiles, search]);

  const onNext = React.useCallback(() => {
    if (selection.size === 0) return;
    goToMetadata(selection.list());
  }, [goToMetadata, selection]);

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      selection.toggle(e.target.value, e.target.checked);
    },
    [selection],
  );

  const onSelectAll = React.useCallback(() => {
    selection.toggleAll();
  }, [selection]);

  React.useEffect(() => {
    if (agendaId) return;
    basket.set(selection.list());
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [agendaId, selection.size, selection.list]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  return (
    <div className={clsx('flex flex-col', props.className)}>
      <div className="fr-pl-2v flex justify-between">
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
      <div ref={scrollRef} className="fr-mt-2v h-[42vh] min-h-64 overflow-y-scroll">
        {filtered.length === 0 && (
          <p className="fr-pt-4v text-center text-gray-500">
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
                    className="fr-px-2v absolute top-0 left-0 w-full hover:bg-gray-50"
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
          'fr-pt-2v h-[32.5px] w-full text-center text-gray-600 opacity-0 transition-opacity duration-100 before:size-8! before:content-[""]',
          down.hasMore && 'shadow-t z-10 opacity-100 shadow-[0_-10px_20px_#fff]',
        )}
      />

      <ButtonsGroup
        className="fr-mt-6v"
        inlineLayoutWhen="md and up"
        alignment="center"
        buttons={[
          { children: 'Annuler', priority: 'secondary', onClick: cancel, type: 'button' },
          {
            type: 'button',
            onClick: onNext,
            disabled: selection.hasNone,
            children: (
              <FormattedMessage
                values={{ count: selection.size }}
                defaultMessage={`{count, plural,
                  =0 {En attente de sélection}
                  other {Définir les données de l'ODJ}}`}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
