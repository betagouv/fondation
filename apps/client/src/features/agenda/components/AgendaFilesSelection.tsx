import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useScrollDownIndicator } from '@/features/agenda/hooks/useScrollDownIndicator.hook';
import { useSelection } from '@/shared/hooks/useSelection';
import { IndeterminateCheckbox } from '@/shared/ui/indeterminate-checkbox';
import type { FormationEnum } from '@/types/enums.types';
import { useFindAgendaNominationFilesQuery } from '@queries/agenda.queries';

import { AgendaFileSearch } from './AgendaFileSearch';
import { AgendaNominationFile } from './AgendaNominationFile';

export function AgendaFilesSelection(props: {
  sessionId: string;
  formation: FormationEnum;
  defaultSelectedFileIds?: readonly string[] | null;
  isSubmitting?: boolean;
  renderSubmitLabel: (count: number) => React.ReactNode;
  cancelLabel?: React.ReactNode;
  onCancel(): void;
  onSubmit(fileIds: readonly string[]): void;
  onSelectionChange?(fileIds: readonly string[]): void;
  className?: string;
}) {
  const { onSelectionChange, onSubmit } = props;

  const [search, setSearch] = React.useState('');

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const down = useScrollDownIndicator({ root: scrollRef });

  const { data } = useFindAgendaNominationFilesQuery({ sessionId: props.sessionId });

  const nominationFiles = React.useMemo(() => data?.items ?? [], [data]);

  const initialSelection = React.useMemo(() => {
    if (props.defaultSelectedFileIds) {
      const availableIds = new Set(nominationFiles.map(({ id }) => id));
      return props.defaultSelectedFileIds.filter((id) => availableIds.has(id));
    }

    return nominationFiles.flatMap((f) =>
      f.outcome?.value !== 'SUSPENDED' && f.reporters.length > 0 ? [f.id] : [],
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [props.defaultSelectedFileIds, nominationFiles]);

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
    onSubmit(selection.list());
  }, [onSubmit, selection]);

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
    onSelectionChange?.(selection.list());
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.size, selection.list]);

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
          <p className="fr-pt-4v text-center text-(--text-mention-grey)">
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
                    className="fr-px-2v absolute top-0 left-0 w-full hover:bg-(--background-alt-grey)"
                    style={{ transform: `translateY(${virtualItem.start}px)` }}
                  >
                    <AgendaNominationFile
                      file={file}
                      search={search}
                      formation={props.formation}
                      checked={selection.has(file)}
                      onChange={onChange}
                    />
                  </div>
                );
              })}
            </div>
            <div data-sentinel ref={down.ref} className="h-18" />
          </>
        )}
      </div>
      <div
        className={clsx(
          cx('ri-arrow-down-s-line'),
          'fr-pt-2v h-[32.5px] w-full text-center text-(--text-mention-grey) opacity-0 transition-opacity duration-100 before:size-8! before:content-[""]',
          down.hasMore && 'shadow-t z-10 opacity-100 shadow-[0_-10px_20px_var(--background-default-grey)]',
        )}
      />

      <ButtonsGroup
        className="fr-mt-6v"
        inlineLayoutWhen="md and up"
        alignment="center"
        buttons={[
          {
            children: props.cancelLabel ?? 'Annuler',
            priority: 'secondary',
            onClick: props.onCancel,
            type: 'button',
          },
          {
            type: 'button',
            onClick: onNext,
            disabled: selection.hasNone || props.isSubmitting,
            className: clsx({ 'before:animate-spin': props.isSubmitting }),
            iconId: (props.isSubmitting ? 'ri-loader-4-line' : undefined) as undefined,
            children: props.renderSubmitLabel(selection.size),
          },
        ]}
      />
    </div>
  );
}
