import { Button } from '@codegouvfr/react-dsfr/Button';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { SearchBar } from '@codegouvfr/react-dsfr/SearchBar';
import clsx from 'clsx';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { Marked } from '@/shared/ui/Marked';
import { Modal } from '@/shared/ui/modal';
import { Tooltip } from '@/shared/ui/tooltip';
import { capitalize } from '@/utils/string.utils';
import { useSearchSummaryReadersQuery, useUpdateSummaryReadersMutation } from '@queries/summary.queries';

export function SummaryReaderSelector(
  props: {
    className?: string;
    iconId?: ComponentProps<typeof Button>['iconId'];
    priority?: ComponentProps<typeof Button>['priority'];
    rounded?: boolean;
    size?: ComponentProps<typeof Button>['size'];
    withCount?: boolean;
  } = {},
) {
  const { summary, canWriteSummary } = useSummary();
  const [isSharing, setIsSharing] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  if (!canWriteSummary) return null;

  const readersCount = summary.summary.readers.length;
  const withCount = props.withCount ?? true;
  const rounded = props.rounded ?? true;
  const iconId =
    props.iconId ??
    (withCount ? (readersCount > 0 ? 'fr-icon-group-fill' : 'fr-icon-admin-fill') : undefined);

  const label =
    withCount && readersCount > 0 ? (
      <FormattedMessage defaultMessage="Partager ({count})" values={{ count: readersCount }} />
    ) : (
      <FormattedMessage defaultMessage="Partager" />
    );

  const commonProps = {
    className: clsx(rounded && 'rounded-full', props.className) || undefined,
    disabled: summary.isArchived,
    onClick: () => {
      setOpenCount((current) => current + 1);
      setIsSharing(true);
    },
    priority: props.priority,
    size: props.size,
  };

  const button = iconId ? (
    <Button {...commonProps} iconId={iconId}>
      {label}
    </Button>
  ) : (
    <Button {...commonProps}>{label}</Button>
  );

  return (
    <>
      {openCount > 0 && (
        <SummaryReaderModal
          key={openCount}
          onClose={() => setIsSharing(false)}
          onClosed={() => !isSharing && setOpenCount(0)}
          open={isSharing}
        />
      )}

      {withCount && readersCount > 0 ? (
        <Tooltip
          label={summary.summary.readers
            .map(({ firstName, lastName }) => `${capitalize(firstName)} ${lastName.toUpperCase()}`)
            .join(', ')}
        >
          {button}
        </Tooltip>
      ) : (
        button
      )}
    </>
  );
}

function SummaryReaderModal(props: { onClose: () => void; onClosed: () => void; open: boolean }) {
  const { summary, sessionId, nominationFileId } = useSummary();
  const originalReaderIds = useMemo(() => summary.summary.readers.map(({ id }) => id), [summary]);
  const [state, setState] = useState<{ readers: string[]; isDirty: boolean }>({
    isDirty: false,
    readers: originalReaderIds,
  });

  const onChange = useCallback(
    (readers: string[]) => {
      const isDirty = !(
        readers.length === originalReaderIds.length && readers.every((id) => originalReaderIds.includes(id))
      );

      setState({ isDirty, readers });
    },
    [originalReaderIds],
  );

  const { mutate: updateSummaryReaders, isPending: isUpdatingReaders } = useUpdateSummaryReadersMutation();

  const onConfirm = useCallback(() => {
    if (!state.isDirty) {
      props.onClose();
      return;
    }

    updateSummaryReaders(
      { sessionId, nominationFileId, readerIds: state.readers },
      { onSuccess: props.onClose },
    );
  }, [nominationFileId, props, sessionId, state, updateSummaryReaders]);

  return (
    <Modal
      actions={
        <>
          <Button disabled={isUpdatingReaders} onClick={props.onClose} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>

          <Button disabled={isUpdatingReaders} onClick={onConfirm}>
            {state.isDirty ? (
              <FormattedMessage defaultMessage="Partager" />
            ) : (
              <FormattedMessage defaultMessage="Ok" />
            )}
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage="Partager cette synthèse" />}
    >
      <SummaryReaderAutocomplete onChange={onChange} readers={originalReaderIds} />
    </Modal>
  );
}

function SummaryReaderAutocomplete(props: { readers: string[]; onChange: (readers: string[]) => unknown }) {
  const { sessionId, nominationFileId } = useSummary();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useDebounce('', 600);
  const [selectedReaderIds, setReaderIds] = useState(new Set<string>(props.readers));

  const [includeIds, setIncludeIds] = useState<string[] | undefined>(
    selectedReaderIds.size ? [...selectedReaderIds] : undefined,
  );

  const toggleReader = useCallback(
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

  const {
    data: readers,
    isLoading,
    isError,
    refetch,
  } = useSearchSummaryReadersQuery({
    sessionId,
    nominationFileId,
    includeIds,
    search: debouncedSearch,
  });

  const checkboxOptions = useMemo(
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
            aria-autocomplete="list"
            aria-controls="summary_reader_list"
            aria-expanded={true}
            autoComplete="off"
            className={`${inputProps.className} w-full`}
            onChange={(e) => {
              const value = e.currentTarget.value;

              setSearch(value);
              setDebouncedSearch(value.trim());
              setIncludeIds(value.trim() === '' ? [...selectedReaderIds] : undefined);
            }}
            role="combobox"
            value={search}
          />
        )}
      />
      <div className="fr-mt-1v text-sm">
        {selectedReaderIds.size ? (
          <FormattedMessage
            defaultMessage="{count, plural, one {# lecteur sélectionné} other {# lecteurs sélectionnés}}"
            values={{ count: selectedReaderIds.size }}
          />
        ) : (
          '\u00A0'
        )}
      </div>

      {isError ? (
        <div className="fr-mt-4v flex flex-col items-start gap-2 text-sm text-(--text-default-error)">
          <FormattedMessage defaultMessage="Impossible de charger la liste des lecteurs." />
          <Button onClick={() => refetch()} priority="secondary" size="small">
            <FormattedMessage defaultMessage="Réessayer" />
          </Button>
        </div>
      ) : isLoading ? (
        <div className="fr-mt-4v text-sm text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Chargement…" />
        </div>
      ) : checkboxOptions.length === 0 ? (
        <div className="fr-mt-4v text-sm text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Aucun lecteur trouvé." />
        </div>
      ) : (
        <Checkbox
          className="fr-mt-4v fr-pb-24v max-h-60 overflow-auto"
          id="summary_reader_list"
          options={checkboxOptions.map(({ label, value, checked }) => ({
            label,
            nativeInputProps: { value, checked, role: 'option', onChange: () => toggleReader(value) },
          }))}
        />
      )}
    </div>
  );
}
