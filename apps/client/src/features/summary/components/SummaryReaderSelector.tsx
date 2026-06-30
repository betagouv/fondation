import { Button } from '@codegouvfr/react-dsfr/Button';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { SearchBar } from '@codegouvfr/react-dsfr/SearchBar';
import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { Marked } from '@/shared/ui/Marked';
import { capitalize } from '@/utils/string.utils';
import { useSearchSummaryReadersQuery, useUpdateSummaryReadersMutation } from '@queries/summary.queries';

const summaryReadersModal = createModal({
  id: `summaryReadersModal`,
  isOpenedByDefault: false,
});

export function SummaryReaderSelector(
  props: {
    className?: string;
    iconId?: React.ComponentProps<typeof Button>['iconId'];
    priority?: React.ComponentProps<typeof Button>['priority'];
    rounded?: boolean;
    size?: React.ComponentProps<typeof Button>['size'];
    withCount?: boolean;
  } = {},
) {
  const { summary, canWriteSummary } = useSummary();

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
    ...summaryReadersModal.buttonProps,
    className: clsx(rounded && 'rounded-full', props.className) || undefined,
    disabled: summary.isArchived,
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
      <SummaryReaderModal />

      {withCount && readersCount > 0 ? (
        <Tooltip
          title={summary.summary.readers
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

function SummaryReaderModal() {
  const intl = useIntl();
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

  const [shouldRender, setShouldRender] = React.useState(isOpen);
  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }
    // Keep the content mounted until the DSFR close animation ends, to avoid a flash while it fades out.
    const closeAnimationMs = 300;
    const timeout = setTimeout(() => setShouldRender(false), closeAnimationMs);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  return (
    <summaryReadersModal.Component
      title={intl.formatMessage({ defaultMessage: 'Partager cette synthèse' })}
      buttons={[
        {
          children: intl.formatMessage({ defaultMessage: 'Annuler' }),
          priority: 'secondary',
          doClosesModal: true,
          disabled: isUpdatingReaders,
        },
        {
          doClosesModal: !isUpdatingReaders && !state.isDirty,
          children: state.isDirty
            ? intl.formatMessage({ defaultMessage: 'Partager' })
            : intl.formatMessage({ defaultMessage: 'Ok' }),
          priority: 'primary',
          disabled: isUpdatingReaders,
          onClick: onConfirmSummaryReaders,
        },
      ]}
    >
      {shouldRender ? <SummaryReaderAutocomplete readers={originalReaderIds} onChange={onChange} /> : null}
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
          <Button priority="secondary" size="small" onClick={() => refetch()}>
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
          id="summary_reader_list"
          className="fr-mt-4v fr-pb-24v max-h-60 overflow-auto"
          options={checkboxOptions.map(({ label, value, checked }) => ({
            label,
            nativeInputProps: { value, checked, role: 'option', onChange: () => toggleReader(value) },
          }))}
        />
      )}
    </div>
  );
}
