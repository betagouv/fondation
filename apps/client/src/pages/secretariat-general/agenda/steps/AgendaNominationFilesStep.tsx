import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import clsx from 'clsx';
import React from 'react';

import { Marked } from '@/components/shared/Marked';
import { NominationFileOutcomeBadge } from '@/components/shared/nomination-files-table/components/cells/nomination-file-outcome/NominationFileOutcomeBadge';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import SearchBar from '@codegouvfr/react-dsfr/SearchBar';
import { useFindAgendaNominationFilesQuery } from '@queries/agenda.queries';
import { useDebounce } from 'use-debounce';
import { useNewAgenda } from '../context/NewAgendaContext';

export function AgendaNominationFilesStep(props: { className?: string }) {
  const { session, isSubmitting: isPending, submit, goToMetadata } = useNewAgenda();

  const searchRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch] = useDebounce(search, 600);

  const [selection, setSelection] = React.useState(new Set<string>());

  const { data } = useFindAgendaNominationFilesQuery({ sessionId: session.id });

  const nominationFiles = React.useMemo(() => data?.items ?? [], [data]);

  React.useEffect(() => {
    setSelection(
      new Set(
        nominationFiles
          .filter((file) => file.agendaCount === 0 || file.outcome.value === 'SUSPENDED')
          .map(({ id }) => id)
      )
    );
  }, [nominationFiles, setSelection]);

  const selectionCount = selection.size;
  const selectionLabel =
    selectionCount > 1
      ? `${selectionCount} propositions sélectionnées`
      : selectionCount === 0
        ? `Aucune proposition sélectionnée`
        : `${selectionCount} proposition sélectionnée`;

  const onSubmit = React.useCallback(() => {
    if (selection.size === 0) return;
    submit(Array.from(selection));
  }, [submit, selection]);

  const onSearchKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape' && searchRef.current) searchRef.current.blur();
    },
    [searchRef]
  );

  const onSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    [setSearch]
  );

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setSelection((s) => new Set(s.add(e.target.value)));
      } else {
        setSelection((s) => {
          s.delete(e.target.value);
          return new Set(s);
        });
      }
    },
    [setSelection]
  );

  const items = React.useMemo(
    () =>
      nominationFiles.filter((item) => {
        const isReady = item.agendaCount === 0 || item.outcome.value === 'SUSPENDED';
        const trimmed = debouncedSearch.trim().toLowerCase();

        if (!trimmed) return isReady;
        return isReady && item.name.toLowerCase().includes(trimmed);
      }),
    [nominationFiles, debouncedSearch]
  );

  return (
    <div className={clsx('flex flex-col gap-y-4', props.className)}>
      <div className="flex justify-between">
        <span className="pb-6 font-bold">{selectionLabel}</span>

        {nominationFiles.length > 0 && (
          <SearchBar
            className="focus-within:w-1/2"
            renderInput={(props) => (
              <input
                {...props}
                disabled={nominationFiles.length === 0}
                ref={searchRef}
                autoComplete="off"
                className={clsx(props.className, 'w-full')}
                onKeyDown={onSearchKeyDown}
                onChange={onSearchChange}
                value={search}
              />
            )}
          />
        )}
      </div>
      <div className="h-[42vh] overflow-y-scroll">
        {items.length === 0 && <p className="pt-4 text-center text-gray-500">Aucune donnée disponible</p>}
        {items.length > 0 && (
          <Checkbox
            small
            className="m-0"
            classes={{ inputGroup: `hover:bg-gray-50` }}
            options={items.map((file) => ({
              nativeInputProps: { onChange, value: file.id, checked: selection.has(file.id) },
              label: (
                <div className="flex w-full items-start gap-1" key={file.id}>
                  <div className="w-[3ch] flex-shrink-0">{file.number}</div>
                  <div>
                    <NominationFileOutcomeBadge formation={session.formation} outcome={file.outcome.value} />
                  </div>
                  <div className="w-1/3 flex-shrink-0 pl-2">
                    <div className="truncate">
                      <Marked value={file.name} search={debouncedSearch} />
                    </div>
                    <div className="truncate text-xs" title={[file.grade, file.currentPosition].join(' - ')}>
                      {[file.grade, file.currentPosition].join(' - ')}
                    </div>
                  </div>
                  <i
                    className={clsx(
                      cx('ri-arrow-right-line'),
                      'flex-shrink-0 before:size-5 before:content-[""]'
                    )}
                  />
                  <div className="text-wrap px-2 pt-1 text-sm">
                    {file.targetedGrade} - {file.targetedPosition}
                  </div>
                </div>
              )
            }))}
          />
        )}
      </div>
      <ButtonsGroup
        className="mt-6"
        inlineLayoutWhen="md and up"
        alignment="center"
        buttons={[
          { children: 'Retour', priority: 'secondary', onClick: goToMetadata, type: 'button' },
          {
            type: 'button',
            iconId: selectionCount === 0 ? undefined : isPending ? 'ri-loader-4-line' : 'ri-file-pdf-2-line',
            children:
              selectionCount === 0
                ? 'En attente de sélection'
                : selectionCount === 1
                  ? `Générer l'ODJ avec la proposition sélectionnée`
                  : `Générer l'ODJ avec les ${selectionLabel}`,
            className: clsx({ 'before:animate-spin': isPending }),
            onClick: onSubmit,
            disabled: selectionCount === 0 || isPending
          }
        ]}
      />
    </div>
  );
}
