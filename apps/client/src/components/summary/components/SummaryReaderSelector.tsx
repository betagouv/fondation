import { Button } from '@codegouvfr/react-dsfr/Button';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { SearchBar } from '@codegouvfr/react-dsfr/SearchBar';
import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip';
import React from 'react';
import { useDebounce } from 'use-debounce';

import { Marked } from '@/components/shared/Marked';
import { useSummary } from '@/pages/summary/SummaryContext';
import { capitalize } from '@/utils/string.utils';
import { useSearchSummaryReadersQuery, useUpdateSummaryReadersMutation } from '@queries/summary.queries';

const summaryReadersModal = createModal({
  id: `summaryReadersModal`,
  isOpenedByDefault: false,
});

export function SummaryReaderSelector() {
  const { summary, canWriteSummary } = useSummary();

  if (!canWriteSummary) return null;

  const readersCount = summary.summary.readers.length;

  return (
    <>
      <SummaryReaderModal />

      {readersCount > 0 ? (
        <Tooltip
          title={summary.summary.readers
            .map(({ firstName, lastName }) => `${capitalize(firstName)} ${lastName.toUpperCase()}`)
            .join(', ')}
        >
          <Button
            {...summaryReadersModal.buttonProps}
            iconId="fr-icon-group-fill"
            className="rounded-full"
            disabled={summary.isArchived}
          >
            Partager ({readersCount})
          </Button>
        </Tooltip>
      ) : (
        <Button
          {...summaryReadersModal.buttonProps}
          iconId="fr-icon-admin-fill"
          className="rounded-full"
          disabled={summary.isArchived}
        >
          Partager
        </Button>
      )}
    </>
  );
}

function SummaryReaderModal() {
  const { summary, sessionId, nominationFileId } = useSummary();
  const originalReaderIds = React.useMemo(() => summary.summary.readers.map(({ id }) => id), [summary]);
  const [state, setState] = React.useState<{ readers: string[]; isDirty: boolean }>({
    isDirty: false,
    readers: originalReaderIds,
  });

  const onChange = React.useCallback(
    (readers: string[]) => {
      const isDirty = !(
        readers.length === originalReaderIds.length && readers.every((id) => originalReaderIds.includes(id))
      );

      setState({ isDirty, readers });
    },
    [originalReaderIds, setState],
  );

  const {
    reset,
    mutate: updateSummaryReaders,
    isPending: isUpdatingReaders,
  } = useUpdateSummaryReadersMutation();
  const onConfirmSummaryReaders = React.useCallback(() => {
    if (!state.isDirty) return;

    updateSummaryReaders(
      { sessionId, nominationFileId, readerIds: state.readers },
      {
        onSuccess() {
          reset();
          summaryReadersModal.close();
          setState({ isDirty: false, readers: [] });
        },
      },
    );
  }, [state, sessionId, nominationFileId, updateSummaryReaders, reset, setState]);

  const isOpen = useIsModalOpen(summaryReadersModal, {
    onConceal() {
      reset();
      setState({ isDirty: false, readers: [] });
    },
  });

  return (
    <summaryReadersModal.Component
      title="Partager cette synthèse"
      buttons={[
        {
          children: 'Annuler',
          priority: 'secondary',
          doClosesModal: true,
          disabled: isUpdatingReaders,
        },
        {
          doClosesModal: !isUpdatingReaders && !state.isDirty,
          children: state.isDirty ? 'Partager' : 'Ok',
          priority: 'primary',
          disabled: isUpdatingReaders,
          onClick: onConfirmSummaryReaders,
        },
      ]}
    >
      {isOpen ? <SummaryReaderAutocomplete readers={originalReaderIds} onChange={onChange} /> : null}
    </summaryReadersModal.Component>
  );
}

function SummaryReaderAutocomplete(props: { readers: string[]; onChange: (readers: string[]) => unknown }) {
  const { sessionId, nominationFileId } = useSummary();

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = useDebounce('', 600);
  const [selectedReaderIds, setReaderIds] = React.useState(new Set<string>(props.readers));

  const [includeIds, setIncludeIds] = React.useState<string[] | undefined>(
    selectedReaderIds.size ? [...selectedReaderIds] : undefined,
  );

  const toggleReader = React.useCallback(
    (id: string) => {
      let nextReaders: Set<string>;
      if (selectedReaderIds.has(id)) {
        selectedReaderIds.delete(id);
        nextReaders = new Set(selectedReaderIds);
      } else {
        nextReaders = new Set(selectedReaderIds.add(id));
      }

      setReaderIds(nextReaders);
      props.onChange([...nextReaders]);
    },
    [selectedReaderIds, setReaderIds, props],
  );

  const { data: readers } = useSearchSummaryReadersQuery({
    sessionId,
    nominationFileId,
    includeIds,
    search: debouncedSearch,
  });

  const checkboxOptions = React.useMemo(
    () =>
      (readers?.items ?? []).map((x) => {
        return {
          value: x.id,
          checked: selectedReaderIds.has(x.id),
          label: (
            <Marked
              key={x.id}
              search={search}
              value={`${capitalize(x.firstName)} ${x.lastName.toUpperCase()}`}
            />
          ),
        };
      }),
    [readers, selectedReaderIds, search],
  );

  return (
    <div className="w-full">
      <SearchBar
        renderInput={(inputProps) => (
          <input
            {...inputProps}
            role="combobox"
            autoComplete="off"
            aria-controls="summary_reader_list"
            aria-expanded={true}
            aria-autocomplete="list"
            className={`${inputProps.className} w-full`}
            value={search}
            onChange={(e) => {
              const value = e.currentTarget.value;

              setSearch(value);
              setDebouncedSearch(value.trim());
              setIncludeIds(value.trim() === '' ? [...selectedReaderIds] : undefined);
            }}
          />
        )}
      />
      <div className="fr-mt-1v text-sm">
        {selectedReaderIds.size
          ? selectedReaderIds.size > 1
            ? `${selectedReaderIds.size} lecteurs sélectionnés`
            : `1 lecteur sélectionné`
          : '\u00A0'}
      </div>

      <Checkbox
        id="summary_reader_list"
        className="fr-mt-4v fr-pb-24v max-h-60 overflow-auto"
        options={checkboxOptions.map(({ label, value, checked }) => ({
          label,
          nativeInputProps: { value, checked, role: 'option', onChange: () => toggleReader(value) },
        }))}
      />
    </div>
  );
}
