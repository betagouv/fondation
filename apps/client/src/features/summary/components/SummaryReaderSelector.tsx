import { Button } from '@codegouvfr/react-dsfr/Button';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import clsx from 'clsx';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { Marked } from '@/shared/ui/Marked';
import { Modal } from '@/shared/ui/modal';
import { SearchInput } from '@/shared/ui/search-input';
import { Tooltip } from '@/shared/ui/tooltip';
import { capitalize, unaccent } from '@/utils/string.utils';
import { useSummaryReadersQuery, useUpdateSummaryReadersMutation } from '@queries/summary.queries';

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

          <Button disabled={!state.isDirty || isUpdatingReaders} onClick={onConfirm}>
            <FormattedMessage defaultMessage="Partager" />
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage="Partager cette synthèse" />}
    >
      <SummaryReaderPicker onChange={onChange} readers={originalReaderIds} />
    </Modal>
  );
}

function SummaryReaderPicker(props: { onChange: (readers: string[]) => void; readers: string[] }) {
  const intl = useIntl();
  const { nominationFileId, sessionId } = useSummary();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set(props.readers));
  const { data, isError, isLoading, refetch } = useSummaryReadersQuery({ nominationFileId, sessionId });

  const matching = useMemo(() => {
    const wanted = unaccent(search.trim()).toLowerCase();
    return (data?.items ?? []).filter(({ firstName, lastName }) =>
      unaccent(`${firstName} ${lastName}`).toLowerCase().includes(wanted),
    );
  }, [data, search]);

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);

    setSelectedIds(next);
    props.onChange([...next]);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2 text-(--text-default-error)">
        <FormattedMessage defaultMessage="Impossible de charger la liste des lecteurs." />
        <Button onClick={() => refetch()} priority="secondary" size="small">
          <FormattedMessage defaultMessage="Réessayer" />
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Chargement…" />
      </p>
    );
  }

  return (
    <>
      <p className="fr-mb-6v">
        <FormattedMessage defaultMessage="Les personnes cochées peuvent lire la synthèse et ses pièces jointes" />
      </p>

      <SearchInput
        className="fr-mb-4v"
        onChange={setSearch}
        onClear={() => setSearch('')}
        placeholder={intl.formatMessage({ defaultMessage: 'Rechercher une personne' })}
        value={search}
      />

      <p aria-live="polite" className="fr-mb-2v text-sm text-(--text-mention-grey)">
        <FormattedMessage
          defaultMessage="{count, plural, =0 {Aucun lecteur sélectionné} one {# lecteur sélectionné} other {# lecteurs sélectionnés}}"
          values={{ count: selectedIds.size }}
        />
      </p>

      <div className="fr-px-4v fr-pt-4v max-h-[45dvh] overflow-y-auto border border-(--border-default-grey)">
        {matching.length === 0 ? (
          <p className="fr-mb-0 fr-pb-4v text-sm text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Aucune personne ne correspond à cette recherche" />
          </p>
        ) : (
          <Checkbox
            classes={{ legend: 'fr-sr-only' }}
            legend={<FormattedMessage defaultMessage="Lecteurs de la synthèse" />}
            options={matching.map(({ displayedRole, firstName, id, lastName }) => ({
              hintText: displayedRole.label,
              label: <Marked search={search} value={`${capitalize(firstName)} ${lastName.toUpperCase()}`} />,
              nativeInputProps: { checked: selectedIds.has(id), onChange: () => toggle(id), value: id },
            }))}
            small
          />
        )}
      </div>
    </>
  );
}
